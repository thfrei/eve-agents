'use strict';

var RequestAgent = require('./RequestAgent');

// create two agents
var DF = new RequestAgent('DFUIDR');

var skills = [];
DF.addConversation('register', register);
function register(skill) {
  console.log('register', skill);
  skills.push(skill);
  //return Promise.resolve('ok');
  return new Promise((res)=>{res('ok');});
}

Promise.all([DF.ready])
  .then(function(){
    console.log(DF.id,' ready');
  })
  .catch(console.error);