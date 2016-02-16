"use strict";

const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let Agent = require('./../agents/Agent');

var options = {
  id: 'BuyerV2',
  DF: 'DFUID'
};

var Buyer = new Agent(options);
Buyer.execute(function(){

  this.agent.register();

  // With retry
  co(function* (){
    try{
      let book = yield retry(buyBook.bind(Buyer,'Harry Potter'), //call buyBook with arguments, and make it as a Buyer
        {retries: 100, interval: 500, factor: 1});

    } catch (err) {
      develop(err);
    }

    console.log(book);
  });
}.bind(Buyer)); // makes this in function == Buyer

function buyBook(book) {
  var self = this;

  return new Promise(function(resolve, reject){
    self.agent.searchSkill('cfp-book-trading')
      .then((skills)=> {
        skills.forEach((skill)=> {

          self.agent.tell(skill.agent, 'cfp-book-trading')
            .tell(function (message, context) {
              // Want to buy book Harry Potter
              return book;
            })
            .listen(function (message, context) {
              develop('Backoffer:', context, ': ', message);
              return message;
            })
            .tell(function (message, context) {
              develop('deciding while telling', message, context);
              let price = parseInt(message, 10);
              if (price < 0.6) {
                return 'buy';
              } else {
                reject('the book is too expensive');
                return 'refuse';
              }
            })
            .listen(function (message, context) {
              develop('finally we get it:', message);
              resolve(message);
            });

        })
      })
      .catch(console.error);
  })
}
