process.env.DEBUG = 'time,develop,verbose';

var config = {};

config.mqttHost = 'mqtt://localhost';
config.amqpHost = 'amqp://localhost';
config.DF = 'DFUID';

module.exports = config;