"use strict";

const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const program = require('commander');
const co = require('co');
const retry = require('co-retry');
let GeneralAgent = require('./../../agents/GeneralAgent');

const EventEmitter = require('events');
const util = require('util');
function MyEmitter() {
  EventEmitter.call(this);
}
util.inherits(MyEmitter, EventEmitter);
var EE = new MyEmitter();

program
  .version('0.0.2')
  .option('-a, --agent-name <name>', 'Agent name: e.g. Buyer1', /^(\w*)$/i, 'Buyer1')
  .option('-d, --directory-facilitator <df>', 'Agent name of the Directory Facilitator', /^(\w*)$/i, 'DFUID')
  .parse(process.argv);

var agentOptions = {
  id: program.agentName,
  DF: program.directoryFacilitator,
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
  // Tell how to take Down
  process.on('SIGINT', takeDown);
  process.on('uncaughtException', takeDown);
  Agent.events.on('registered',develop);
  // Register Skills
  Agent.register();

  function buyBook(book) {
    return new Promise(function(resolve, reject){
      Agent.searchSkill('cfp-book-trading')
        .then((skills)=> {
          skills.forEach((skill)=> {

            Agent.tell(skill.agent, 'cfp-book-trading')
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
                if (price < 60) {
                  return Promise.resolve('buy');
                } else {
                  reject('the book is too expensive');
                  return Promise.resolve('refuse');
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

  function err(err){
    console.log('err in babble',err);
  }

  // One time call
  //buyBook('Harry Potter').then(develop).catch(develop);

  // With retry
  co(function* (){
    try{
      let book = yield retry(buyBook.bind(this,'Harry Potter'),
        {retries: 100, interval: 500, factor: 1});
    } catch (err) {
      develop(err);
    }

    console.log(book);
  });

}).catch(function(err){console.log('exe',err)});

function takeDown(){
  // extra function is needed for closure on event
  Agent.deRegister();
  process.exit();
}

