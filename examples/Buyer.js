"use strict";

const develop = require('debug')('develop');
const Promise = require('bluebird');
const program = require('commander');
let GeneralAgent = require('./../agents/GeneralAgent');

const EventEmitter = require('events');
const util = require('util');
function MyEmitter() {
  EventEmitter.call(this);
}
util.inherits(MyEmitter, EventEmitter);
var EE = new MyEmitter();

program
  .version('0.0.2')
  .option('-a, --agent-name <name>', 'Agent name: e.g. Buyer1', /^(\w*)$/i, 'Buyer1')
  .option('-d, --directory-facilitator <df>', 'Agent name of the Directory Facilitator', /^(\w*)$/i, 'DFUID')
  .parse(process.argv);

var agentOptions = {
  id: program.agentName,
  DF: program.directoryFacilitator,
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
      //host: 'dev.rabbitmq.com'
    }
  ]
};

var Agent = new GeneralAgent(agentOptions);

// ========================================================================================================
// Do not change below ====================================================================================
Promise.all([Agent.ready]).then(function () {
  // Tell how to take Down
  process.on('SIGINT', takeDown);
  process.on('uncaughtException', takeDown);
  Agent.events.on('registered',develop);
  // Register Skills
  Agent.register();

  setTimeout(()=>{
    Agent.searchSkill('sell')
      .then((skills)=>{
        skills.forEach((skill)=>{
          //Agent.rpc.request(skill.agent, {method: 'sell', params: {foo: 'bar'}})
          //  .then(develop);

          //try{
          //  var cfp = Agent.cfp('HP', 'sell', skill.agent, Agent);
          //  cfp.on('refuse', (m)=>{console.log('refuse',m);});
          //  cfp.on('propose', (m)=>{console.log('propose',m);});
          //  cfp.on('err', (m)=>{console.log('err',m);});
          //} catch(err){
          //  console.log(err);
          //}

          //Agent.callCFP(skill.agent);

          Agent.tell(skill.agent, 'cfp-book-trading')
            .tell(function (message , context) {
              // Want to buy book Harry Potter
              return 'Harry Potter';
            })
            .listen(function (message, context) {
              develop('Backoffer:', context , ': ' ,  message);
              return message;
            })
            .tell(function (message, context) {
              develop('deciding while telling', message, context);
              let price = parseInt(message, 10);
              if(price < 60) {
                return 'buy';
              } else {
                return 'refuse';
              }
            })
            .listen(function (message, context) {
              develop('finally we get it:', message);
            });

        })
      })
      .catch(develop);
  },0);

}).catch(function(err){console.log('exe',err)});

function takeDown(){
  // extra function is needed for closure on event
  Agent.deRegister();
  process.exit();
}

