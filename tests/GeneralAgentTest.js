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
    return Agent.register().then((msg)=>{
        t.assert(msg);
      })
      .catch((err)=>{
        t.fail(err);
      })
  });

  test('deRegister', (t)=>{
    t.fail('not implemented');
    t.end();
  });

  test('takeDown', (t)=>{
    process.on('exit', ()=>{
      t.pass('process was exited');
    });
    return Agent.takeDown()
      .then(()=>{
      });
    t.end();
  })

});
