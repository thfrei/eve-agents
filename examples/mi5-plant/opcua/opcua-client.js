/*global require,console,setTimeout */
var opcua = require("node-opcua");
var async = require("async");
var Q = require("q");
var should = require("should");
var client, the_session, the_subscription;

function OpcuaClient(endpointUrl, callback){	
	client = new opcua.OPCUAClient();
	
	connect(client, endpointUrl)
		.then(createSession)
		.then(subscribe)
		.then(function(){
			console.log('post subscription');
			callback(client);
		})
		.catch(function(err){
			console.log(err);
			callback(err);
		});
}

//var client = new opcua.OPCUAClient();
//var endpointUrl = "opc.tcp://" + require("os").hostname() + ":4842";
//var nodeId = "ns=4;s=MI5.Module2101.Input.SkillInput.SkillInput0.Execute";


//var the_session, the_subscription;

function connect(client, endpointUrl){
	var deferred = Q.defer();

	client.connect(endpointUrl,function (err) {
		if(err) {
			deferred.reject(err);
		} else {
			console.log("connected !");
			deferred.resolve();
		}
	});
	
	return deferred.promise;
	
}

function createSession(){
	var deferred = Q.defer();
	
	client.createSession(function(err,session) {
		if(!err) {
			the_session = session;
			deferred.resolve();
		} else {
			deferred.reject(err);
		}
	});
	
	return deferred.promise;
}

function subscribe(){
	var deferred = Q.defer();
	
	the_subscription = new opcua.ClientSubscription(the_session,{
	   requestedPublishingInterval: 1000,
	   requestedLifetimeCount: 10,
	   requestedMaxKeepAliveCount: 2,
	   maxNotificationsPerPublish: 10,
	   publishingEnabled: true,
	   priority: 10
    });
   
    the_subscription.on("started",function(){
	   console.log("subscription started - subscriptionId = ",the_subscription.subscriptionId);
	   deferred.resolve();
    }).on("keepalive",function(){
	   //console.log("keepalive");
    }).on("terminated",function(){
	   console.log("terminated");
    });
	
	return deferred.promise;
}

OpcuaClient.prototype.readVariable = function(nodeId, callback){	
	the_session.readVariableValue(nodeId, function(err,dataValue) {
	   callback(err, dataValue.value.value);
	});	
};

OpcuaClient.prototype.monitorItem = function(nodeId){
    var monitoredItem  = the_subscription.monitor({
 	   nodeId: opcua.resolveNodeId(nodeId),
 	   attributeId: opcua.AttributeIds.Value
    },
    {
 	   samplingInterval: 100,
 	   discardOldest: true,
 	   queueSize: 10
    },
    opcua.read_service.TimestampsToReturn.Both
    );
    console.log("-------------------------------------");
	
	return monitoredItem;
};

OpcuaClient.prototype.onChange = function(nodeId, callback){
	var monitoredItem = this.monitorItem(nodeId);
	setTimeout(function(){	monitoredItem.on("changed",function(dataValue){
   	  var value = dataValue.value.value;
	  //console.log(new Date().toString(), nodeId, value);
	  callback(value);	  
    });},10000);
};

OpcuaClient.prototype.oneChange = function(nodeId, callback){
	var monitoredItem = this.monitorItem(nodeId);
	setTimeout(function(){	monitoredItem.once("changed",function(dataValue){
   	  var value = dataValue.value.value;
	  //console.log(new Date().toString(), nodeId, value);
	  callback(value);	  
    });},10000);
};
    
OpcuaClient.prototype.writeNodeValue = function(nodeId, value, dataType, callback) {

    var nodesToWrite = [
        {
            nodeId: nodeId,
            attributeId: opcua.AttributeIds.Value,
            indexRange: null,
            value: { /* dataValue*/
                serverTimestamp: new Date(2015, 5, 2),
                serverPicoseconds: 20,
                sourceTimestamp: new Date(2015, 5, 2),
                sourcePicoseconds: 30,
                value: { /* Variant */
                    dataType: opcua.DataType[dataType],
                    value: value
                }
          }
        }
    ];

    the_session.write(nodesToWrite, function (err, statusCodes) {
        if (!err) {
			console.log('statusCodes:'+statusCodes);
            statusCodes.length.should.equal(nodesToWrite.length);
            //statusCodes[0].should.eql(opcua.StatusCodes.BadNotWritable);
        }
		callback(err);
    });

};

exports.OpcuaClient = OpcuaClient;
module.exports = exports;