//-----------------------------------------------------------------------------------
//-----------------------------------MQTT-BROKER-------------------------------------
//-----------------------------------------------------------------------------------

var process350 = require('../../protocol/350');

module.exports = function broker() {
  const aedes = require("aedes")();
  const broker = require("net").createServer(aedes.handle);
  const port = 1883;

  aedes.on("client", (client) => {
    console.log("connected", client.id);
  });

  aedes.on("clientError", (err) => {
    console.log("clientError", err);
  });

  aedes.on("publish", (publish, client) => {
    if (!client) {
      return;
    }
    // Recieve data
    console.log("publish", client.id, publish);
    const sex = process350(publish.payload.toString("base64"));
    console.log(sex ? sex : 'Unreadable data, LOL');
  });

  broker.listen(port, function () {
    console.log("Server (broker) started and listening on port ", port);
  });
}
