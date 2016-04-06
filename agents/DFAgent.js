"use strict";

let eve = require('evejs');

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

const mqtt = require('mqtt');

function DFAgent(options) {
  // execute super constructor
  eve.Agent.call(this, options.id);

  eve.system.init({
    transports: options.transports
  });
  console.log(this.id,' is connecting...');
  this.connect(eve.system.transports.getAll());

  // MQTT Connection
  if(options.mqtt) {
    console.log('using mqtt:', options.mqtt);
    this.mqtt = mqtt.connect(options.mqtt);
  }

  // Properties =======================================================
  this._agents = []; // [{agent: name, services: [service1, 2, 3]},{...}]

  // EventEmitter
  this.events = new EventEmitter();

  // Properties End ===================================================
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout:2*1000});
}
// extend the eve.Agent prototype
DFAgent.prototype = Object.create(eve.Agent.prototype);
DFAgent.prototype.constructor = DFAgent;

DFAgent.prototype.rpcFunctions = {};
// =================================================

/**
 * @param params {services: ['fillBottle','loadBottle','unLoadBottle',...]
 * @param from
 * @returns {*}
 */
DFAgent.prototype.rpcFunctions.register = function(params, from){
  console.log('Agent', from, 'wants to register itself. params:',params);

  if(!_.isArray(params.services)){
    var err = 'params.services is not an array, please verify';
    return {err: err};
  }

  // Check if agent is already registered
  if(_.find(this._agents, {agent: from})){
    var err = from + ' has already registered';
    console.log(err);
    return {err: err};
  }
  else {
    this.events.emit('registered', from);
    this._agents.push({agent: from, services: params.services});
    this.events.emit('agentsChanged', this._agents);
    return {status: 'ok', description: 'agent has been registered with services: '+JSON.stringify(params.services), services: params.services};
  }
};

DFAgent.prototype.rpcFunctions.deRegister = function(params, from){
  console.log('deregistering', from, params);
  this._agents = _.reject(this._agents, {agent: from});
  this.events.emit('agentsChanged', this._agents);
  this.events.emit('deRegistered', from);

  return {status: 'ok', description: 'agent has been deregistered'};
};

/**
 * find agent for service
 *
 * @param params {service: 'service'}
 * @param from
 */
DFAgent.prototype.rpcFunctions.search = function(params, from) {
  console.log('Agent', from, 'wants to get all agents for', params.service);

  // returns all skill-agent combinations with the required skill
  var found =  _.filter(this._agents, function(entry){
    // If skill can be found in services-array
    if(_.indexOf(entry.services, params.service) != -1) {
      return true;
    }
  });
  console.log(found);

  return found;
};

/**
 * get all registered agents
 * @type {DFAgent}
 */
DFAgent.prototype.rpcFunctions.getAllAgents = function(params, from) {
  console.log('Agent', from, 'wants to get all agents');

  return this._agents;
};

module.exports = DFAgent;