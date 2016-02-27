"use strict";

//const HandlingRobot = require('./../examples/transport-manager/HandlingRobot');
//console.log(HandlingRobot.id);

let test = require('blue-tape');
const Promise = require('bluebird');
const GeneralAgent = require('./../agents/GeneralAgent');
const _ = require('lodash');

let agentOptions = {
  DF: 'DFUID',
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
      //host: 'dev.rabbitmq.com'
    }
  ]
};

let Agent = new GeneralAgent(agentOptions);

Agent.ready.then(()=>{

  //Agent.register();

  test('find Handling Robot', (t)=>{
    return Agent.searchSkill('cfp-transport')
      .then((agents) => {
        t.assert( _.isArray(agents), 'agents must be an array');
        t.assert( !_.isEmpty(agents), 'at least one agent should be in there');
        t.assert( _.isObject(agents[0]), 'each element of the array must be an object');
        //t.assert( HandlingRobot.id == agents[0].agent, 'agent must be the HandlingRobot agent id');
    });
  });

  test.skip('check cfp-transport part 1', (t)=>{
    return Agent.searchSkill('cfp-transport')
      .then((agents) => {
        return agents[0];
      })
      .then((agent) => {
        return Agent.CAcfp(agent.agent, 'cfp-transport', '')
          .then((reply) => {
            t.assert(_.isNumber(reply.price), 'reply must have a price');
            t.assert((reply.price > 0 && reply.price < 1), 'price must be between 0 and 1');
            t.equal(reply.agent, agent.agent, 'agent must be part of reply');
            return reply;
          });
      });
  });

  const mockEdge = {
    from: {
      agent: '',
      position: 40
    },
    to: {
      agent: '',
      position: 50
    }
  };
  test('check cfp-transport part 1', (t)=>{
    return Agent.searchSkill('cfp-transport')
      .then((agents) => {
        return agents[0];
      })
      .then((agent) => {
        return Agent.CAcfp(agent.agent, 'cfp-transport', '')
          .then((reply) => {
            t.assert(_.isNumber(reply.price), 'reply must have a price');
            t.assert((reply.price > 0 && reply.price < 1), 'price must be between 0 and 1');
            t.equal(reply.agent, agent.agent, 'agent must be part of reply');
            return reply;
          });
      })
      .then((reply) => {
        return Agent.CAcfpAcceptProposal(reply.agent, 'cfp-transport', mockEdge);
      })
      .then((reply) => {
        console.log('it worked :-) ', reply);
        let task = reply.informDone;
        t.deepEqual(task.task.from, mockEdge.from, 'compare from'); //TODO why doesnt the test end?
        return Promise.resolve();
      });
  });


  test('killAll', (t)=>{
    t.pass('emit SIGINT signal which kills the required HandlingRobot with a delay of 500ms');
    process.emit('SIGINT');
    setTimeout(process.exit, 500);
    t.end();
  });

});

