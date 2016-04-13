"use strict";

const config = require('./../../config.js');

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const uuid = require('uuid-v4');
const co = require('co');
let GeneralAgent = require('./../../agents/GeneralAgent');

var agentOptions = {
  id: 'Cocktail',
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

Agent.position = 500;

Agent.liquids = [
  {type: 'grenadine', amount: '10000'},
  {type: 'lemon', amount: '10000'},
  {type: 'maracuja', amount: '10000'},
  {type: 'pineapple', amount: '10000'},
  {type: 'orange', amount: '10000'},
  {type: 'strawberry', amount: '10000'},
  {type: 'bluecuracao', amount: '10000'},
  {type: 'water', amount: '10000'}
];
Agent.taskList = [];

var opc = new require('node-opcua-simple');
var opcua = new opc.opcua();

opcua.connect('opc.tcp://localhost:4334/')
  .then(function(result){
    develop('OPC UA connected', result);
  })
  .catch(console.error);

Agent.opcuaExecute = function(job){

  return co(function* () {
    console.log('execute.......', JSON.stringify(job));

    let subscription = yield opcua.subscribe();
    yield opcua.write('MI5.Module2501.Output.SkillOutput.SkillOutput0.Parameter.Parameter0.Value', 1337, 'Int16');
    yield opcua.write('MI5.Module2501.Input.SkillInput.SkillInput0.Execute', true, 'Boolean');

    // wait for done to become true
    let done = yield opcua.monitor(subscription, 'MI5.Module2501.Output.SkillOutput.SkillOutput0.Done');
    yield new Promise(function(resolve, reject) {
      done.on('changed', function(data){
        console.log(data);
        if (data.value.value == true) {
          subscription.terminate();
          resolve();
        }
      });
    });
    done = undefined; // TODO somehow the monitored item continues to be called (on node-opcua server)
    subscription = undefined;

    yield opcua.write('MI5.Module2501.Output.SkillOutput.SkillOutput0.Done', false, 'Boolean');
    yield opcua.write('MI5.Module2501.Input.SkillInput.SkillInput0.Execute', false, 'Boolean');

  }).catch(console.error);
};

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  Agent.skillAddCAcfpParticipant('cfp-fill', checkParameters, reserve);
  Agent.serviceAdd('getPosition', function(){ return Agent.position; });

  function checkParameters (message, context) {
    return new Promise( (resolve, reject) => {
      develop('#checkParams', message, context);
      //let book = _.find(Agent.books, {title: message.title});
      if(true) {
        let offer = {price: Math.random()};
        develop('offer:', offer);
        resolve({propose: offer });
      } else {
        develop('not in stock');
        resolve({refuse: 'not in stock'});
      }
    }).catch(console.error);
  }

  function reserve(message, context) {
    return new Promise( (resolve, reject) => {
      develop('#reserve', message, context);

      let task = {
        taskId: 'fill-'+uuid(),
        parameters: message
      };
      Agent.taskList.push(task);

      if(true) {
        develop('inform-result:', task);
        resolve({informDone: task}); // propose
      } else {
        develop('book could not be fetched in stock');
        resolve({failure: 'book could not be fetched in stock'}); // refuse
      }
    }).catch(console.error);
  }

  Agent.CArequestParticipant('request-give', give);
  function give(message, context){
    develop('#give', message, context);
    return new Promise((resolve, reject) => {
      resolve({inform: 'here you have it'});
    });
  }

  Agent.CArequestParticipant('request-take', take);
  function take(message, context){
    develop('#take', message, context);
    return new Promise((resolve, reject) => {
      resolve({inform: 'i took it'});
    });
  }

  Agent.CArequestParticipant('request-execute', execute);
  function execute (objective, context) {
    develop('#execute', objective, context);

    return new Promise((resolve, reject) => {
      co(function* () {
        let job = _.find(Agent.taskList, {taskId: objective.taskId});
        console.log('task', job);
        if(typeof job == 'undefined') {
          throw new Error('job was not found in taskList:', Agent.taskList);
        }
        yield Agent.opcuaExecute(job);
        _.remove(Agent.taskList, {taskId: job.taskId});
        develop('task successfully finished. removed. taskList:', Agent.taskList);
        resolve({inform: 'done'});

      }).catch(console.error);
    });
  }

  // Register Skills
  Agent.register()
    .catch(console.log);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});
