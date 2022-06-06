var broker = require('./mqtt/broker/main');
var client1 = require('./mqtt/client/client1');
var api = require('./api/main');

broker();
client1();

api();
