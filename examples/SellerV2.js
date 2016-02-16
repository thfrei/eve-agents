"use strict";

const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let Agent = require('./../agents/Agent');

var options = {
  id: 'SellerV2',
  DF: 'DFUID'
};

var books = [
  {title: 'Harry Potter', price: Math.random()},
  {title: 'Fluch der Karibik', price: Math.random()}
];

var Seller = new Agent(options);
Seller.execute(function(){

  this.agent.events.on('registered',develop);
  // Skills
  this.agent.skillAdd('sell', console.log);
  this.agent.skillAdd('cfp-book-trading', null);
  // Register Skills
  this.agent.deRegister(); // TODO dirty fix - deRegistering on process.exit doesn't work
  this.agent.register()
    .catch(console.log);



  try {
    var requestedBook = '';
    this.agent.listen('cfp-book-trading')
      .listen(function (message, context) {
        develop('what does he want?:', message);
        requestedBook = message;
        return message;
      })
      .tell(function (message, context) {
        // Make an offer
        develop('making an offer if we have the book');
        let book = _.find(books, {name: requestedBook});
        if( book ) {
          return book.price;
        } else {
          return 'not in stock';
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

}.bind(Seller)); // makes this in function == Buyer
