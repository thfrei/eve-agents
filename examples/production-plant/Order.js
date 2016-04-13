"use strict";

const config = require('./../../config.js');

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const verbose = require('debug')('verbose');
const time = require('debug')('time');
time.log = console.log.bind(console); // don't forget to bind to console!

const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
const uuid = require('uuid-v4');
let GeneralAgent = require('./../../agents/GeneralAgent');

var agentOptions = {
  id: 'Order'+uuid(),
  DF: config.DF,
  transports: [
    {
      type: 'amqp',
      url: config.amqpHost
      //host: 'dev.rabbitmq.com'
    }
  ],
  mqtt: config.mqttHost
};

var Agent = new GeneralAgent(agentOptions);

Promise.all([Agent.ready]).then(function () {
  "use strict";

  Agent.register();

  // order
  let order = {};
  order.orderId = uuid();
  order.recipe = [
    {
      service: 'bottleInput',
      parameters: {
        bottleType: 'longneck', size: 300
      }
    },
    {
      service: 'print',
      execute: true,
      parameters: {
        logo: '1.gif',
        bottleType: 'longneck', size: 300
      }
    },
    {
      service: 'fill',
      execute: true,
      parameters: {
        liquids: [{type: 'lemonade', amount: 150}, {type: 'weissbier', amount: 150}]
      }
    },
    {
      service: 'bottleOutput',
      parameters: {
        size: 300
      }
    }
  ];

  // Business Logic
  co(function* () {
    "use strict";
    let startReal = Date.now();
    let start = Agent.timer.getTime();
    // Negotiate every entry in recipe and find an agent
    time('TIME Start', Agent.timer.getTime()-start, 'ms');
    let agents = yield _.map(order.recipe, negotiate);
    time('TIME Negotiation', Agent.timer.getTime()-start, 'ms');
    verbose('agents', agents);
    // Edges of network. Ways that we need to travel:
    let edges = computeEdges(agents);
    verbose('edges', edges);
    // Execute travel edges
    yield Promise.each(edges, co.wrap(function* (edge) { //wrap a generator function into a promise
    //yield forEach(edges, function* (edge) {
      verbose('edgesforeach',edge);
      // Negotiate for transport agent:
      time('TIME Start Edge - negotiateTransport', Agent.timer.getTime()-start);
      let task = yield negotiateTransportation(edge);
      verbose('negotiated task', task);
      time('TIME Edge - negotiateTransport End', Agent.timer.getTime()-start);
      let done = yield Agent.CArequest(task.agent, 'request-execute', {taskId: task.taskId});
      verbose('edge complete', done);
      // Now execute the main-task
      time('TIME Execute', Agent.timer.getTime()-start);
      if(edge.to.execute) {
        let mainDone = yield Agent.CArequest(edge.to.agent, 'request-execute', {taskId: edge.to.taskId});
        verbose('mainDone', mainDone);
        time('TIME Execute Main', Agent.timer.getTime()-start);
      }
      return Promise.resolve(done);
    }));
    let end = Agent.timer.getTime();
    let endReal = Date.now();
    console.log('HHHHHHHHUUUUUUUUURRRRRRRRRRAAAAAAAAAAAHHHHHHHHHHHHH!!!!!!!!!!!!');
    console.log('duration: ', end-start,'ms');
    console.log('real: ', endReal-startReal, 'ms');
  }).catch(errorHandling);

  function negotiate (task) {
    let conversation = 'cfp-'+task.service;
    //let service = task.parameters;
    return cfpMinPrice(conversation, task);
  }

  function negotiateTransportation(edge) {
    return cfpMinPrice('cfp-transport', {parameters: edge});
  }

  function computeEdges (agents) {
    let edges = [];
    for (let i = 0; i < agents.length; i++) {
      let edge = {};
      edge.from = agents[i];
      edge.to = agents[i+1];
      if( edge.to ) {
        edges.push(edge);
      }
    }
    return edges;
  }

  function cfpMinPrice (conversation, task) {
    return co(function* () {
      let participants = yield Agent.searchService(conversation);
      develop('participants for ', conversation, ': ', participants);

      // ask all participants for objective
      let propositions = yield Promise.all(_.map(participants, (participant) => {
        return Agent.CAcfp(participant.agent, conversation, task.parameters);
      }));
      verbose('propositions', propositions);

      // Filter for valid propositions
      _.remove(propositions, (prop) => { if( prop.refuse || prop.error ) { return true; }});
      develop('clean propositions', propositions);

      // Check if we can process the requested service
      if( _.isEmpty(propositions) ) {
        throw new Error(`service ${task.service} with conversation ${conversation} is not available in MAS`);
      }

      // Get offer with lowest price
      let bestOffer = _.minBy(propositions, (offer) => {return offer.price});
      if(typeof bestOffer == 'undefined') {
        console.log(task.parameters,' is not available, nowhere');
      } else {
        console.log('bestOffer', bestOffer);

        // Tell participant with bestoffer to reserve
        let inform = yield Agent.CAcfpAcceptProposal(bestOffer.agent, conversation, task.parameters);
        verbose(inform);

        let agent = {taskId: inform.inform.taskId, agent: bestOffer.agent};
        if(task.execute) {
          agent.execute = task.execute;
        }
        return agent;
      }
    });
  }

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch( (err) => {console.log('exe',err)} );

function errorHandling(err) {
  console.log('=============================================================================================');
  console.log('================== ERROR in working the recipe ===============================================');
  console.error(err);
  console.log('=============================================================================================');
}