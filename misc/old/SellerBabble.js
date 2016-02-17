"use strict";

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
  // Event-Listeners
  Agent.events.on('registered',develop);
  // Skills
  Agent.skillAdd('cfp-book-trading', null);

  Agent.books = [
    {title: 'Harry Potter', price: Math.random(), storage: 90},
    {title: 'Faust', price: Math.random(), storage: 10},
    {title: 'Kabale und Liebe', price: Math.random(), storage: 50}
  ];

  Agent.skillAdd('sell', sell);
  function sell(params, sender) {
    var self = Agent;
    return new Promise(function(resolve, reject){
      let book = _.find(self.books, {title: params.title});
      console.log('book skill', book);
      if ( book ) {
        book.agent = Agent.id;
        resolve(book);
      } else {
        resolve({err: 'no book found'});
      }
    });
  }

  Agent.skillAdd('queryBook', queryBook);
  function queryBook(params, sender){
    var self = Agent;
    return new Promise(function(resolve, reject) {
      let book = _.find(self.books, {title: params.title});
      console.log('queryBook,book', book);
      if (book) {
        book.agent = Agent.id;
        resolve(book);
      } else {
        resolve({err: 'no book found'});
      }
    });
  }

  // Register Skills
  Agent.deRegister(); // TODO dirty fix - deRegistering on process.exit doesn't work
  Agent.register()
    .catch(console.log);

  try {
    var requestedBook = '';
    Agent.listen('cfp-book-trading')
      .listen(function (message, context) {
        develop('what does he want?:', message);
        requestedBook = message;
        return message;
      })
      .tell(function (message, context) {
        // Make an offer
        develop('making an offer...');
        if (Math.random() > 0.5) {
          return 100;
        } else {
          return 50;
        }
      })
      .listen(function (message, context) {
        develop('listening to if he wants to buy or not:', message);
        return message;
      })
      .tell(function (message, context) {
        develop('he wants to:', message);
        if (message == 'buy') {
          return {book: requestedBook, amount: 10};
        } else {
          // do nothing
        }
      });
  } catch (err) {
    develop(err);
  }

}).catch(function(err){console.log('exe',err)});
