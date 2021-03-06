"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
let GeneralAgent = require('./../agents/GeneralAgent');

var agentOptions = {
  //id: 'PromiseSeller',
  DF: 'DFUID',
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
      //host: 'dev.rabbitmq.com'
    }
  ]
};

var Agent = new GeneralAgent(agentOptions);

Promise.all([Agent.ready]).then(function () {
  Agent.events.on('registered',console.log);

  Agent.books = [
    {title: 'Harry Potter', price: Math.random()},
    {title: 'Harry Potter', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Kabale und Liebe', price: Math.random()}
  ];

  Agent.serviceAdd('sell', Promise.resolve('group sell'));

  Agent.serviceAdd('query', query);
  function query(params, sender){
    develop('query', params, sender);
    var self = Agent;

    return new Promise(function(resolve, reject) {
      let book = _.find(self.books, {title: params.title});
      console.log('queryBook,book', book);
      if ( !_.isEmpty(book) ) {
        book.agent = self.id;
        resolve(book);
      } else {
        resolve({err: 'no book found'});
      }
    });
  }

  Agent.serviceAdd('buy', buy);
  function buy(params, sender){
    develop('buy', params, sender);
    var self = Agent;

    return new Promise(function (resolve, reject) {
      let bookIndex = _.findIndex(self.books, {title: params.title});
      let book = _.pullAt(self.books, bookIndex); // remove the book from array
      book.agent = Agent.id;
      console.log('current stock', self.books);
      resolve(book);
    });
  }

  // Register Skills
  Agent.register()
    .catch(console.log);

  // deRegister upon exiting
  process.on('SIGINT', function(){
    console.log('taking down...');
    Agent.deRegister();
    setTimeout(process.exit, 500); // wait for deregistering complete
  });

}).catch(function(err){console.log('exe',err)});
