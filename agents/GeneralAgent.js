"use strict";

const _ = require('underscore');
const Promise = require('bluebird');
let co = require('co');
let eve = require('evejs');

let EventEmitter = require('events').EventEmitter;
//var EE = new EventEmitter();

function Agent(agent) {
  // execute super constructor and set agent-id
  eve.Agent.call(this, agent.id);

  // Setup transports
  eve.system.init({
    transports: agent.transports
  });

  this.skills = [];

  // set Directory Facilitator
  this.DF = agent.DF;

  // EventEmitter
  this.events = new EventEmitter();

  // load the RPC module
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout: 5*1000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());
}
Agent.prototype = Object.create(eve.Agent.prototype);
Agent.prototype.constructor = Agent; // not needed?

// ==============================================================================
// ACL ==========================================================================
Agent.prototype.ACL = {};
Agent.prototype.ACL.cfp = function(conversation, participant){
  var EE = new EventEmitter();

  var message = {method: 'cfp', params: {step: 'cfp', conversation: conversation}};
  this.rpc.request(participant, message)
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
// ==============================================================================


// ==============================================================================
// Services =====================================================================
Agent.prototype.rpcFunctions = {};
Agent.prototype.rpcFunctions.cfp = function(params, from) {
  console.log('#cfp - RPC from:', from, params);
  // add relays
  return {err: 'not yet implemented'};
};
// Services End =================================================================
// ==============================================================================


// ==============================================================================
// Skill Handling ===============================================================
Agent.prototype.skillAdd = function(name, func){
  this.skills.push(name);
  this.rpcFunctions[name] = func;
};

// Skill Handling End ===========================================================
// ==============================================================================



// ==============================================================================
// Default Functions ============================================================
Agent.prototype.register = function(){
  // Register skills
  var self = this;
  return this.rpc.request(this.DF,{method: 'register', params: {skills: this.skills}})
    .then(function(reply){
      if(reply.err) throw new Error('#register could not be performed: ' + reply.err);
      else {
        let success = 'register successfull with:'+JSON.stringify(self.skills);
        self.events.emit('registered', success);
        return success;
      }
    });
};
Agent.prototype.takeDown = function(){
  // Deregister skills
  this.rpc.request(this.DF, {method: 'deRegister'})
    .then(function(reply){
      if(reply.err) throw new Error('#deregister could not be performed' + err);
      else {
        console.log('takeDown now');
        return Promise.resolve('#deregister successfull');
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
        console.log('#search skill:',skill,':',reply);
        return Promise.resolve(reply);
      }
    });
};
Agent.prototype._informOf = function(event){
  return new Promise(function(resolve){
    myEmitter.on(event, function(eventPayload){
      resolve(eventPayload);
    });
  });
};
// Behaviour End ================================================================
// ==============================================================================
module.exports = Agent;
