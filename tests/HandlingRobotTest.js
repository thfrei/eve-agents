"use strict";

const HandlingRobot = require('./../examples/transport-manager/HandlingRobot');
console.log(HandlingRobot.id);

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

  Agent.skillAdd('transport-end', console.log);
  Agent.register();

  test('find Handling Robot', (t)=>{
    return Agent.searchSkill('transport-move').
      then((agents) => {
        t.assert( _.isArray(agents), 'agents must be an array');
        t.assert( !_.isEmpty(agents), 'at least one agent should be in there');
        t.assert( _.isObject(agents[0]), 'each element of the array must be an object');
        t.assert( HandlingRobot.id == agents[0].agent, 'agent must be the HandlingRobot agent id');
    });
  });

  test('reserve a transporter', (t) => {
    return Agent.searchSkill('transport-reserve').
      then((agents) => {
        return agents[0];
      })
      .then((agent) => {
        t.equal(agent.agent, HandlingRobot.id, 'check if HandlingRobot agent found');
        return Agent.request(agent.agent, 'transport-reserve', {orderId: 'asdf'});
      })
      .then((reply) => {
        t.assert(reply.ok, 'reply must be ok');
      });
  });

  test('move a transporter', (t) => {
    return Agent.searchSkill('transport-move').
      then((agents) => {
        return agents[0];
      })
      .then((agent) => {
        t.equal(agent.agent, HandlingRobot.id, 'check if HandlingRobot agent found');
        return Agent.request(agent.agent, 'transport-move', {orderId: 'asdf', destination: 20});
      })
      .then((reply) => {
        t.assert(reply.ok, 'reply must be ok');
      });
  });

  test.skip('cfp-move', (t) => {
    return Agent.searchSkill('exe-transport').
      then((agents) => {
        return agents[0];
      })
      .then( (agent) => {
        return Agent.CAcfp(agent.agent, 'exe-transport', {});
      })
      .then( (reply) => {
        console.log(reply);
        t.end();
      })
  });

  test.skip('killAll', (t)=>{
    t.pass('emit SIGINT signal which kills the required HandlingRobot with a delay of 500ms');
    process.emit('SIGINT');
    t.end();
  });

});

