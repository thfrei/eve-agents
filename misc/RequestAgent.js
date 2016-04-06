"use strict";

const _ = require('lodash');
let eve = require('evejs');
let Promise = require('bluebird');
const EventEmitter = require('events').EventEmitter;

function RequestAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // Setup transports
  eve.system.init({
    transports:[
      {
        type: 'amqp',
        url: 'amqp://localhost'
        //host: 'dev.rabbitmq.com'
      }
    ]
  });

  // extend the agent with support for requests
  // cannot be extended with rpc apparently - maybe due to .receive()
  this.extend('request');

  this.events = new EventEmitter();

  this._conversations = [];
  this.services = [];

  this._DF = '';
  this.getDF = function() { return this._DF; };
  this.setDF = function(df) { this._DF = df; };

  this.connect(eve.system.transports.getAll());
}

// extend the eve.Agent prototype
RequestAgent.prototype = Object.create(eve.Agent.prototype);
RequestAgent.prototype.constructor = RequestAgent;

/**
 * depending on msg.conversation, call the specific handler
 * @param from
 * @param msg
 * @returns {*}
 */
RequestAgent.prototype.receive = function (from, msg) {
  console.log(from, ' said: ', msg);

  if ( !_.isString(msg.conversation) ) {
    return Promise.reject('there is no conversation. it must be a string');
  }
  let conversation = _.find(this.getConversations(), {conversation: msg.conversation});
  if ( conversation ) {
    //return conversation.handler(from, msg.body);
    //return conversation.handler.bind(this, from, msg.body)(); //bind and execute
    return conversation.handler.bind(this, msg.body)(); //bind and execute
  } else {
    return Promise.reject('no conversation found'); //or resolve?
  }
};

RequestAgent.prototype.addConversation = function(conversation, handler) {

  if( !_.isFunction(handler) ){
    throw new Error('handler must be a promise');
  }

  this._conversations.push({conversation: conversation, handler: handler}); // handler promise
};
RequestAgent.prototype.getConversations = function(){
  return this._conversations;
};
RequestAgent.prototype.getConversationNames = function(){
  return _.map(this._conversations, (conv) => {return conv.conversation;});
};
RequestAgent.prototype.getConversationHandlers = function(){
  return _.map(this._conversations, (conv) => {return conv.handler;});
};

/**
 * add a skill to an agent
 * @param name [string] name of skill
 * @param handler [function] func(params, from)
 */
RequestAgent.prototype.addSkill = function(name, handler){
  this.services.push({skill: name, handler: handler});
};
RequestAgent.prototype.getSkills = function(){
  return this.services;
};
RequestAgent.prototype.getSkillNames = function(){
  return _.map(this.services, (skill) => {return skill.skill;});
};
RequestAgent.prototype.getSkillHandlerss = function(){
  return _.map(this.services, (skill) => {return skill.handler;});
};

/**
 * We use the bluebird promise to add timeout functionality
 *
 * otherwise this.request just works fine
 * @param to
 * @param conv
 * @param msg
 */
RequestAgent.prototype.ask = function(to, conv, msg) {
  if( this.id == to ) {
    throw new Error('agent cannot ask itself');
  }

  return new Promise((resolve, reject) => {
    let message = {conversation: conv, body: msg};
    this.request(to, message)
      .then(resolve);
      //.then(resolve)
      //.catch(reject); // doesnt work with amqp?
  }).bind(this);
};

RequestAgent.prototype.register = function() {
  let message = { jsonrpc: '2.0',
    id: uuid(),
    method: 'register',
    params: {skills: this.getSkillNames()}
  };

  this.request(this.getDF(), message)
    .then(function(from, reply){
      console.log(from, reply);
    })
    .catch(console.error);

};

module.exports = RequestAgent;
