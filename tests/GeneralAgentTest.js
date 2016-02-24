"use strict";

let test = require('blue-tape');
const Promise = require('bluebird');
const GeneralAgent = require('./../agents/GeneralAgent');
const _ = require('lodash');

let agentOptions = {
  id: 'testAgent',
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

  test('register', (t)=>{
    return Agent.register();
  });

  test('deRegister', (t)=> {
    return Agent.deRegister();
  });
});

