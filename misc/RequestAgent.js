"use strict";

var _ = require('lodash');

var eve = require('evejs');
var Promise = require('bluebird');

function RequestAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with support for requests
  this.extend('request');

  this.conversationTypes = [];

  this.connect(eve.system.transports.getAll());
}

// extend the eve.Agent prototype
RequestAgent.prototype = Object.create(eve.Agent.prototype);
RequestAgent.prototype.constructor = RequestAgent;

// implement the receive method
RequestAgent.prototype.receive = function (from, message) {
  //console.log(from, ' said: ', message);

  if ( !_.isString(message.conversation) ) {
    return Promise.reject('conversation must be a string');
  }
  let conversation = _.find(this.conversationTypes, {conversation: message.conversation});
  if ( conversation ) {
    //return conversation.handler(from, message.body);
    return conversation.handler.bind(this, from, message.body)(); //bind and execute
  } else {
    return Promise.reject('no conversation found'); //or resolve?
  }
};

RequestAgent.prototype.addConversationType = function(conversation, handler) {

  if( !_.isFunction(handler) ){
    throw new Error('handler must be a promise');
  }

  // check if it already exists --
  this.conversationTypes.push({conversation: conversation, handler: handler}); // handler promise

  console.log(this.conversationTypes);
};

/**
 * Adds timeout functionality
 *
 * otherwise this.request just works fine
 * @param to
 * @param msg
 */
RequestAgent.prototype.ask = function(to, conv, msg) {
  return new Promise((res, rej) => {
    let message = {conversation: conv, body: msg};
    this.request(to, message).then(function (reply) {
      res(reply);
    })
    .catch(rej);
  }).bind(this);
};

module.exports = RequestAgent;
