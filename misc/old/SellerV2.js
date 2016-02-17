"use strict";

const _ = require('lodash');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const co = require('co');
const retry = require('co-retry');
let Agent = require('./../../agents/Agent');

var Seller = new Agent({id: 'SellerV2-1', DF: 'DFUID'});
var Seller2 = new Agent({id: 'SellerV2-2', DF: 'DFUID'});

function generateLibrary() {
  return [
    {title: 'Harry Potter', price: Math.random(), storage: 90},
    {title: 'Faust', price: Math.random(), storage: 10},
    {title: 'Kabale und Liebe', price: Math.random(), storage: 50}
  ];
}
Seller.books = generateLibrary();
Seller2.books = generateLibrary();

Seller.agent.skillAdd('sell', sell);
function sell(params, sender) {
  var self = this;
  return new Promise(function(resolve, reject){
    let book = _.find(self.books, {title: params.title});
    console.log('book skill', book);
    if ( book ) {
      resolve(book);
    } else {
      resolve({err: 'no book found'});
    }
  });
}

Seller.agent.skillAdd('queryBook', queryBook);
function queryBook(params, sender){
  return new Promise(function(resolve, reject) {
    console.log(self.books);
    var book = _.find(self.books, {title: params.title});
    console.log('queryBook,book found', book);
    if (book) {
      resolve(book.price);
    } else {
      resolve({err: 'no book found'});
    }
  });
}

Seller.execute(()=>{
  console.log('exe');
  Seller.agent.on('registered', console.log);
  Seller.agent.on('deRegistered', console.log);
  Seller.agent.deRegister();
  Seller.agent.register() // TODO dirty fix - deRegistering on process.exit doesn't work
    .catch(console.log);
});