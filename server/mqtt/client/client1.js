//-----------------------------------------------------------------------------------
//--------------------------------TEST-MQTT-CLIENT-1---------------------------------
//-----------------------------------------------------------------------------------

module.exports = function client1() {
  const mqtt = require("mqtt");
  const options = {
    host: "localhost",
    port: 1883,
    clientId: "CLIent1",
  };
  const client1 = mqtt.connect(options);

  client1.subscribe("pizdapizda/94:B9:7E:82:18:9C/from");
  client1.subscribe("pizdapizda/94:B9:7E:82:18:9C/to");

  client1.on("message", function (topic, message) {
    //Called each time a message is received
    console.log("Received message:", topic, message.toString("base64"));
  });

  // For testing only
  // setInterval(() => {
    // const send = Buffer.from('AlRRVwBXQwBUAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQc9pk=');
    // client1.publish('pizdapizda/94:B9:7E:82:18:9C/to', send, console.log);
  // }, 5000);
}
