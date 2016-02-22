"use strict";

var RequestAgent = require('./RequestAgent');

// create two agents
var agent1 = new RequestAgent('agent1');

Promise.all([agent1.ready]).then(function(){
  console.log('connected to amqp');
  agent1.setDF('DFUIDR');
  console.log(agent1.getDF());
  agent1.ask(agent1.getDF(), 'register', ['hi', 'ho'])
    .then(console.log);
}.bind(this));