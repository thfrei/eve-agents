"use strict";

// we need to load the babble instance out from evejs, otherwise we cannot use babble.tell in a decision block;
//const babble = require('./../node_modules/evejs/node_modules/babble');
//const babble = require('babble');
const develop = require('debug')('develop');
const _ = require('underscore');
const Promise = require('bluebird');
let co = require('co');
let eve = require('evejs');

const EventEmitter = require('events').EventEmitter;
//var EE = new EventEmitter();

function Agent(agent) {
  // execute super constructor and set agent-id
  eve.Agent.call(this, agent.id);

  // Setup transports
  eve.system.init({
    transports: agent.transports
  });

  this.services = [];

  // set Directory Facilitator
  this.DF = agent.DF;

  // EventEmitter
  this.events = new EventEmitter();

  // load the RPC module
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout: 2*1000});

  // babblify the agent
  this.pattern = this.loadModule('pattern');

  // request
  this.request = this.loadModule('request');

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());
}
Agent.prototype = Object.create(eve.Agent.prototype);
Agent.prototype.constructor = Agent; // not needed?

// ACL ==========================================================================
Agent.prototype.cfp = function (objective, conversation, participant) {
  let EE = new EventEmitter();

  var message = {method: 'cfp', params: {
    step: 'cfp',
    conversation: conversation,
    objective: objective
  }};
  this.rpc.request(participant, message) // TODO: somehow closure is necessary? why?
    .then(function(reply){
      if(reply.err) {
        throw new Error('#cfp could not be performed: ' + reply.err + '\n message:' + JSON.stringify(message));
      }
      else {
        if(reply.refuse){
          EE.emit('refuse', reply);
        } else if (reply.propose) {
          EE.emit('propose', reply);
        } else {
          EE.emit('err', reply);
        }
      }
    });

  return EE;
};
// ACL END= =====================================================================

// Services =====================================================================
Agent.prototype.rpcFunctions = {};
Agent.prototype.rpcFunctions.cfp = function(params, from) {
  console.log('#cfp - RPC from:', from, params);
  if(params.step == 'cfp'){
    params.conversation(params.objective);
  }
  return {err: 'not yet implemented'};
};
// Services End =================================================================

// Skill Handling ===============================================================
/**
 * add a skill to an agent
 * @param name [string] name of skill
 * @param func [function] func(params, from)
 */
Agent.prototype.serviceAdd = function(name, func){
  this.services.push(name);
  this.rpcFunctions[name] = func;
};
Agent.prototype.getSkills = function(){
  return this.services;
};
// Skill Handling End ===========================================================

// Default Functions ============================================================
Agent.prototype.register = function(){
  // Register services
  var self = this;
  return this.rpc.request(this.DF,{method: 'register', params: {services: this.services}})
    .then(function(reply){
      if(reply.err) throw new Error('#register could not be performed: ' + reply.err);
      else {
        let ret = 'register successfull with:'+JSON.stringify(self.services);
        self.events.emit('registered', ret);
        return Promise.resolve(ret);
      }
    });
};
Agent.prototype.deRegister = function(){
  // Deregister services
  var self = this;
  //return new Promise((resolve, reject)=>{
  return this.rpc.request(this.DF, {method: 'deRegister'})
    .then(function(reply){
      if(reply.err) throw new Error('#deregister could not be performed' + reply.err);
      else {
        let ret = 'deRegister succesfull';
        self.events.emit('deRegistered', ret);
        return Promise.resolve(ret);
      }
    });
};
Agent.prototype.searchSkill = function(skill){
  return this.rpc.request(this.DF,{method: 'search', params: {skill: skill}})
    .then(function(reply){
      if(reply.err) {
        throw new Error('#search could not be performed' + err);
      } else if(_.isEmpty(reply)) {
        throw new Error('no skill was found');
      } else {
        develop('#search skill:',skill,':',reply);
        return Promise.resolve(reply);
      }
    });
};
Agent.prototype.rpc = function(to, method, params) {
  return this.rpc.request(to, {method: method, params: params})
    .then(function(reply){
      develop('#request ', to, method, params);
      return Promise.resolve(reply);
    })
    .catch(function(err){
      // RPC Timeout probably
      return Promise.resolve('RPC Timeout? Or Agent.request internal error. err='+err);
    });
};
// Behaviour End ================================================================

module.exports = Agent;
