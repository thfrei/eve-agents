"use strict";

const develop   = require('debug')('develop');
const Promise = require('bluebird');
const DFAgent = require('./agents/DFAgent');
const _ = require('lodash');

let options = {
  id: 'DF',
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
    }
  ]
};

let DF = new DFAgent(options);

Promise.all([DF.ready]).then(function () {
  console.log('agent ', 'DF', ' ready');

  DF.events.on('register', develop);
  DF.events.on('deRegister', develop);
  DF.events.on('agentsChanged', (msg)=>{develop("agents Changed:\n",msg);});

}).catch(console.log);