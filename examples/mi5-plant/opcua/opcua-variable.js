var Q = require('q');

function OpcuaVariable(client, nodeId, dataType){
    this.nodeId = nodeId;
	this.dataType = dataType;
    this.client = client;
	
	var self = this;
	
	this.read(function(err, value){
		console.log('init read value: '+ value)
		self.value = value;
	});
	this.onChange(function(value){
		self.value = value;
	});
	
}

OpcuaVariable.prototype.read = function(callback){
	this.client.readVariable(this.nodeId, callback);
};

OpcuaVariable.prototype.getValue = function(){
	return this.value;
};

OpcuaVariable.prototype.readQ = function(){
	var deferred = Q.defer();
	this.client.readVariable(this.nodeId, function(err, value){
		if(!err){
			deferred.resolve(value);
		} else {
			deferred.reject(err);
		}
	});
	return deferred.promise;
};

OpcuaVariable.prototype.write = function(value){
    this.client.writeNodeValue(this.nodeId, value, this.dataType, function(err){
		if(err)
			console.error(err);
	});
};

OpcuaVariable.prototype.writeQ = function(value){
	var deferred = Q.defer();
	
    this.client.writeNodeValue(this.nodeId, value, this.dataType, function(err){
		if(!err)
			deferred.resolve();
		else deferred.reject(err);
	});
	
	return deferred.promise;
};

OpcuaVariable.prototype.onChange = function(callback){
    this.client.onChange(this.nodeId, callback);
};

OpcuaVariable.prototype.oneChange = function(callback){
    this.client.oneChange(this.nodeId, callback);
};

module.exports.OpcuaVariable = OpcuaVariable;