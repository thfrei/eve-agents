"use strict";

const eve = require('evejs');

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

function DFAgent(options) {
  // execute super constructor
  eve.Agent.call(this, options.id);

  eve.system.init({
    transports: options.transports
  });
  console.log(this.id,' is connecting...');
  this.connect(eve.system.transports.getAll());

  // Properties =======================================================
  this._agents = []; // [{agent: name, skills: [skill1, 2, 3]},{...}]

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
 *
 * @param params {skills: ['fillBottle','loadBottle','unLoadBottle',...]
 * @param from
 * @returns {*}
 */
DFAgent.prototype.rpcFunctions.register = function(params, from){
  console.log('Agent', from, 'wants to register itself. params:',params);

  if(!_.isArray(params.skills)){
    let err = 'params.skills is not an array, please verify';
    return {err: err};
  }

  // Check if agent is already registered
  if(_.find(this._agents, {agent: from})){
    let err = from + ' has already registered';
    console.log(err);
    return {err: err};
  }
  else {
    this._agents.push({agent: from, skills: params.skills});
    this.events.emit('agentsChanged', this._agents);
    return {status: 'ok', description: 'agent has been registered with skills'+JSON.stringify(params.skills)};
  }
};

DFAgent.prototype.rpcFunctions.deRegister = function(params, from){
  console.log('Agent', from, 'wants to deregister');

  this._agents = _.reject(this._agents, {agent: from});
  this.events.emit('agentsChanged', this._agents);

  return {status: 'ok', description: 'agent has been deregistered'};
};

/**
 * find agent for skill
 *
 * @param params {skill: 'skill'}
 * @param from
 */
DFAgent.prototype.rpcFunctions.search = function(params, from) {
  console.log('Agent', from, 'wants to get all agents for', params.skill);

  // returns all skill-agent combinations with the required skill
  var found =  _.filter(this._agents, function(entry){
    // If skill can be found in skills-array
    if(_.indexOf(entry.skills, params.skill) != -1) {
      return true;
    }
  });
  console.log(found);

  return found;
};

module.exports = DFAgent;