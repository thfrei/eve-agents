/**
 * Created by Dominik on 17.05.2016.
 */
var Q = require('q');
 
var OpcuaClient = require('./opcua-client').OpcuaClient;
var OpcuaVariable = require('./opcua-variable').OpcuaVariable; 

var client, execute, ready, done, error;
var state = 'listenOnReady';
var production;

var config = require('./config');

var endpointUrl = "opc.tcp://" + require("os").hostname() + ":" + config.ServerStructure.serverInfo.port;
var baseNodeIdInput = config.ServerStructure.baseNodeId + '.' + config.ServerStructure.moduleName + '.Input.SkillInput.SkillInput0.';
var baseNodeIdOutput = config.ServerStructure.baseNodeId + '.' + config.ServerStructure.moduleName + '.Output.SkillOutput.SkillOutput0.';

// starting the client for the backend logic
client = new OpcuaClient(endpointUrl, post_init);

function post_init(){
	// building the backend logic
	execute	 =	new OpcuaVariable(client, baseNodeIdInput + 'Execute', 'Boolean');
	ready	 =	new OpcuaVariable(client, baseNodeIdOutput + 'Ready', 'Boolean');
	done	 = 	new OpcuaVariable(client, baseNodeIdOutput + 'Done', 'Boolean');
	error	 =	new OpcuaVariable(client, baseNodeIdOutput + 'Error', 'Boolean');
	
	setInterval(printStateValues,2000);
	setTimeout(function(){
		setInterval(produce,20000);
	},5000);

}

function produce(){
	production = setInterval(productionStateMachine,500);
}

function productionStateMachine(){
	console.log('new interval with state: '+state);
	switch (state) {
	  case 'listenOnReady':
		if(!ready.value && execute.value){
			console.log('not ready');
			break;
		} else {
			console.log('ready');
			state = 'setExecute';
		}
	  case 'setExecute':
		setExecute();
		state = 'listenOnDone';
	  case 'listenOnDone':
		if(!done.value){
			console.log('not done');
			break; 
		} else {
			console.log(done);
			state = 'resetExecute';
		}
	  case 'resetExecute':
		resetExecute();
		state = 'listenOnReady';
		clearInterval(production);
		
	}
}

function setExecute(){
	console.log('executing...');
	return execute.writeQ(true);
}

function resetExecute(){
	console.log('resetting execute');
	return execute.writeQ(false);
}

function printStateValues(){
	console.log('-----------------');
	console.log('execute: '+execute.value);
	console.log('ready: '+ready.value);
	console.log('done: '+done.value);
	console.log('-----------------');
}




