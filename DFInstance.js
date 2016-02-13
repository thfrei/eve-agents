"use strict";

const develop = require('debug')('develop');
const Promise = require('bluebird');
let DFAgent = require('./agents/DFAgent');
const _ = require('lodash');

const options = {
  id: 'DFUID', // TODO find out, why on localhost DF is no blocked?
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
    }
  ]
};

let DF = new DFAgent(options);

Promise.all([DF.ready]).then(function () {
  console.log('agent ', options.id, ' ready');

  DF.events.on('register', develop);
  DF.events.on('deRegister', develop);
  DF.events.on('agentsChanged', (msg)=>{develop("agents Changed:\n",msg);});

}).catch(console.log);