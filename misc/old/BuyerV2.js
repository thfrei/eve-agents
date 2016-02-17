"use strict";

const _ = require('lodash');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let Agent = require('./../../agents/Agent');

var options = {
  id: 'BuyerV2',
  DF: 'DFUID'
};

var Buyer = new Agent(options);
Buyer.execute(Buyer.agent.register)// makes this in function == Buyer
  .then(function(){
    return Buyer.agent.searchSkill('sell');
  })
  .then( function(agents) {
    let queryBookPromises = _.map(agents, (agent) => {
      console.log('asking', agent.agent);
      return Buyer.agent.rpc.request(agent.agent, {method: 'queryBook', params: {title: 'Kabale und Liebe'}});
    });
    console.log(queryBookPromises);
    return Promise.all(queryBookPromises);
  })
  .then( function(prices) {
    console.log(prices);
  })
  .catch(develop);


//
//function getPrice(agent, book) {
//  var self = Buyer;
//
//  console.log('getPrice', agent, book);
//
//  return new Promise(function (resolve, reject) {
//    self.agent.tell(agent, 'cfp-book-trading')
//      .tell(function (message, context) {
//        // Want to buy book Harry Potter
//        return book;
//      })
//      .listen(function (message, context) {
//        develop('Backoffer:', context, ': ', message);
//        resolve({agent: context, price: message});
//      });
//  });
//}
//
//function buyBook(book) {
//  var self = this;
//
//  return new Promise(function(resolve, reject){
//    self.agent.searchSkill('cfp-book-trading')
//      .then((skills)=> {
//        skills.forEach((skill)=> {
//
//          self.agent.tell(skill.agent, 'cfp-book-trading')
//            .tell(function (message, context) {
//              // Want to buy book Harry Potter
//              return book;
//            })
//            .listen(function (message, context) {
//              develop('Backoffer:', context, ': ', message);
//              return message;
//            })
//            .tell(function (message, context) {
//              let price = parseFloat(message);
//              if (price < 0.6) {
//                develop('we buy for', price);
//                return 'buy';
//              } else {
//                develop('we do not buy for', price);
//                reject('the book is too expensive');
//                return 'refuse';
//              }
//            })
//            .listen(function (message, context) {
//              develop('finally we get it:', message);
//              resolve(message);
//            });
//
//        })
//      })
//      .catch(console.error);
//  })
//}
