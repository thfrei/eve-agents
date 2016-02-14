"use strict";

const babble = require('babble');
const develop = require('debug')('develop');
const Promise = require('bluebird');
const program = require('commander');
let GeneralAgent = require('./../agents/GeneralAgent');

const EventEmitter = require('events');
const util = require('util');
function MyEmitter() {
  EventEmitter.call(this);
}
util.inherits(MyEmitter, EventEmitter);
var EE = new MyEmitter();

program
  .version('0.0.2')
  .option('-a, --agent-name <name>', 'Agent name: e.g. Seller1', /^(\w*)$/i, 'Seller1')
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


// ========================================================================================================
// Do not change below ====================================================================================
Promise.all([Agent.ready]).then(function () {
  // Tell how to take Down
  process.on('SIGINT', takeDown);
  process.on('uncaughtException', takeDown);
  // Event-Listeners
  Agent.events.on('registered',develop);
  // Skills
  Agent.skillAdd('sell', console.log);
  Agent.skillAdd('cfp-book-trading', null);
  // Register Skills
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

function takeDown(){
  // extra function is needed for closure on event
  Agent.deRegister();
  process.exit();
}

