"use strict";

// we need to load the babble instance out from evejs, otherwise we cannot use babble.tell in a decision block;
const babble = require('./../node_modules/evejs/node_modules/babble');
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

  this._skills = [];

  // set Directory Facilitator
  this.DF = agent.DF;

  // EventEmitter
  this.events = new EventEmitter();

  // load the RPC module
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout: 5*1000});

  // babblify the agent
  this.extend('babble');
  //this.babble = this.loadModule('babble');

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());
}
Agent.prototype = Object.create(eve.Agent.prototype);
Agent.prototype.constructor = Agent; // not needed?

// Babble
// Buyer
//Agent.prototype.callCFP = function (to) {
//  this.tell(to, 'cfp-book-trading')
//    .tell(function (message , context) {
//      // Want to buy book Harry Potter
//      return 'Harry Potter';
//    })
//    .listen(function (message, context) {
//      develop('Backoffer:', context , ': ' ,  message);
//      return message;
//    })
//    .tell(function (message, context) {
//      develop('deciding while telling', message, context);
//      let price = parseInt(message, 10);
//      if(price < 60) return 'buy';
//      else return 'refuse';
//    });
//};
//// Seller
//Agent.prototype.listenCFP = function () {
//  try {
//    var requestedBook = '';
//    this.listen('cfp-book-trading')
//      .listen(function (message, context) {
//        develop('what does he want?:', message);
//        requestedBook = message;
//        return message;
//      })
//      .tell(function (message, context) {
//        // Make an offer
//        develop('making an offer...');
//        if (Math.random() > 0.5) {
//          return 100;
//        } else {
//          return 50;
//        }
//      })
//      .listen(function (message, context) {
//        develop('listening to if he wants to buy or not:', message);
//        return message;
//      })
//      .tell(function (message, context) {
//        develop('he wants to:', message);
//        if (message == 'buy') {
//          return {book: requestedBook, amount: 10};
//        } else {
//          // do nothing
//        }
//      });
//  } catch (err) {
//    develop(err);
//  }
//};
// Babble End

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
Agent.prototype.skillAdd = function(name, func){
  this._skills.push(name);
  this.rpcFunctions[name] = func;
};
Agent.prototype.getSkills = function(){
  return this._skills;
};

// Skill Handling End ===========================================================

// Conversation Handling ========================================================
///**
// * add a skill to an agent
// * @param name [string] name of skill
// * @param func [function] func(params, from)
// */
//Agent.prototype.startConversation = function(name, func){
//  this._skills.push(name);
//  this.rpcFunctions[name] = func;
//};
// Conversation Handling End ====================================================

// Default Functions ============================================================
Agent.prototype.register = function(){
  // Register _skills
  var self = this;
  return this.rpc.request(this.DF,{method: 'register', params: {skills: this._skills}})
    .then(function(reply){
      if(reply.err) throw new Error('#register could not be performed: ' + reply.err);
      else {
        let ret = 'register successfull with:'+JSON.stringify(self._skills);
        self.events.emit('registered', ret);
        return ret;
      }
    });
};
Agent.prototype.deRegister = function(){
  // Deregister _skills
  this.rpc.request(this.DF, {method: 'deRegister'})
    .then(function(reply){
      if(reply.err) throw new Error('#deregister could not be performed' + err);
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

module.exports = Agent;
