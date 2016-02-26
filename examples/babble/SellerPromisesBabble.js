"use strict";

process.env.DEBUG = 'develop';

const _ = require('lodash');
const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
let GeneralAgent = require('./../../agents/GeneralAgent');

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

  Agent.skillAddCAcfpParticipant('cfp-book-trading', getBook, sellBook);

  Agent.books = [
    {title: 'Harry Potter', price: Math.random()},
    {title: 'Harry Potter', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Faust', price: Math.random()},
    {title: 'Kabale und Liebe', price: Math.random()}
  ];

  function getBook (message, context) {
    develop(message, context);
    let book = _.find(Agent.books, {title: message.title});
    if(book) {
      develop('offer:', book);
      return {propose: book}; // propose
    } else {
      develop('not in stock');
      return {refuse: 'not in stock'}; // refuse
    }
  }

  function sellBook(message, context) {
    return new Promise( (resolve, reject) => {
      develop(message, context);
      let bookIndex = _.findIndex(Agent.books, {title: message.title});
      let book = _.pullAt(Agent.books, bookIndex); // remove the book from array
      book.agent = Agent.id;
      console.log('current stock', Agent.books);

      if(book) {
        develop('inform-result:', book);
        resolve({informDone: book}); // propose
      } else {
        develop('book could not be fetched in stock');
        resolve({failure: 'book could not be fetched in stock'}); // refuse
      }
    }).catch(console.error);
  }

  Agent.CArequestParticipant('request-give', give);
  function give(message, context){
    develop('#give', message, context);
    return new Promise((resolve, reject) => {
      resolve({inform: 'here you have it'});
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
