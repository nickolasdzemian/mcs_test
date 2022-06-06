
//------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------PARSE-PAYLOAD------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------

function crc16(buf, len) {
  let crc = 0xffff;
  let i = 0;
  let j = 0;
  while (len--) {
    let b = buf[j++];
    crc ^= b << 8;
    crc = crc & 0xffff;

    for (i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc = crc & 0xffff;
    }
  }
  return (crc = crc & 0xffff);
}

function crc16to(buf, len) {
  let crc = 0xffff;
  let i = 0;
  let j = 0;
  while (len--) {
    let b = buf[j++];
    crc ^= b << 8;
    crc = crc & 0xffff;

    for (i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc = crc & 0xffff;
    }
  }
  return (crc = crc & 0xffff);
}

const ric = {
  base64: {
    decode: (str) =>
      new DataView(
        Uint8Array.from(
          typeof globalThis.Buffer === "function"
            ? [...Buffer.from(str, "base64")]
            : [...atob(str)].map((x) => x.charCodeAt(0))
        ).buffer
      ),
  },
};

function parceMode(u) {
  switch (u) {
    case 0:
      return 'Manual';
    case 1:
      return 'Programm';
    case 2:
      return 'Antifreeze';
    default: 'No cases for input data';
  }
}

function parceSelf(u) {
  const selves = ['▼', '▲', '▲▼', 4, '♲▼', '♲▲', '♲▲▼'];
  if (u < 1 || u > 7) {
    return u || 'No cases for input data';
  };
  return selves[u - 1];
}

function parceAirCorr(u) {
  const aLimit = u > 100 ? -(256 - u) : u;
  return aLimit;
}

function parceSensorType(u) {
  const types = ["Teploluxe 6.8", "AuBe 10", "Warmup 12", "DEVI 15", "Eberle 33", "Ensto 47"];
  return types[u - 1];
}


/**
 * @param {string} type
 * @param {DataView} b
 */
function parseSubrecord(type, b) {
  switch (type) {
    case "T":
      const tempFloor = b.getUint8(0);
      const tempAir = b.getUint8(1);
      const day = b.getUint8(2) + 1;
      const chartEvent = b.getUint8(3) + 1;
      return { tempFloor, tempAir, day, chartEvent };
    case "S":
      const status = b.getUint8(0) === 1;
      const mode = parceMode(b.getUint8(1));
      const self = parceSelf(b.getUint8(2));
      const tempUser = b.getUint8(3);
      const tempVacant = b.getUint8(4);
      const airLimit = b.getUint8(5);
      const airCorrection = parceAirCorr(b.getUint8(6));
      // console.log(tempUser);
      return { status, mode, self, tempUser, tempVacant, airLimit, airCorrection };
    case "M":
      const mac = new TextDecoder().decode(b.buffer);
      return { mac };
    case "C":
      let chart = [];
      for (let i = 0; i < b.buffer.byteLength / 3; i++) {
        chart[i] = {
          time: b.getUint16(0 + i*3),
          temp: b.getUint8(2 + i*3),
        }
      }
      return { chart };
    case "A":
      const isBusy = b.getUint8(0) == 1;
      return { isBusy };
    case "Z":
      const sensorType = parceSensorType(b.getUint8(0));
      return { sensorType };
    case "W":
      const signal = b.getUint8(0);
      return { signal };
    case "H":
      const relay = b.getUint8(0) == 1;
      return { relay };
  }

  return {};
}

function process(payload) {
  if (!payload) {
    return;
  }
  const b = ric.base64.decode(payload);
  let offset = 0;
  const stx = b.getInt8(offset);
  offset += /* STX */ 1 + /* 'T' */ 1;
  if (stx !== 0x02) {
    return;
  }

  let crcValid = false;
  const packetType = String.fromCharCode(b.getInt8(offset));
  offset++;
  const packetId = b.getInt8(offset);
  offset++;

  const dataLength = b.getUint16(offset);
  offset += 2;

  const crc = b.getUint16(offset + dataLength);
  const crcBuf = new Uint8Array(b.buffer.slice(0));
  if (crc === crc16(crcBuf, b.buffer.byteLength - 2)) {
    crcValid = true;
  }

  // crcValid = true;

  let result = {};

  while (offset < b.buffer.byteLength - 2) {
    const id = String.fromCharCode(b.getInt8(offset));
    offset++;
    const len = b.getUint16(offset, false);
    offset += 2;
    const data = new DataView(b.buffer.slice(offset, offset + len));
    offset += len;

    const r = parseSubrecord(id, data);
    // console.log({ id, len, r });

    result = { ...result, ...r };
  }

  return result;
}

//------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------MQTT--SERVER-------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------

const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
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
  const sex = process(publish.payload.toString("base64"));
  console.log(sex);

  // Send data
  // const c = "AlRBUgCrVAAEHh8BAVMABwEABxwMIwBDAFQBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAxJAAVUMjQwN00AETk0OkI5OjdFOjgyOjE4OjlDQQABAFoAAQFMAAMAAABEAAoxNjUyODA4Njc4VwABBEgAAQBPAAEA/hM=";
  let send = {
    instruction: '02TAW',
    length: 3,
    id: 'S',
    len: 1,
    power: 0,
    // mode: 'U',
    // self: 0,
    // tempUser: 44,
    // tempVacant: 12,
  }
  send = Buffer.from(
    Object.values(send)
    .toString("base64")
  );
  let crc = crc16to(send, Buffer.length);
  crc = Buffer.from(
    String(crc).toString("base64")
  );
  send = Buffer.from(send + crc);
  console.log(send);

  var packet = {
    cmd: 'publish',
    messageId: 42,
    qos: 0,
    dup: false,
    topic: 'pizdapizda/94:B9:7E:82:18:9C/to',
    payload: Buffer.from("AlRRVwBXQwBUAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQc9pk="),
    retain: false,
    // properties: { // optional properties MQTT 5.0
    //     payloadFormatIndicator: true,
    //     messageExpiryInterval: 4321,
    //     topicAlias: 100,
    //     responseTopic: 'topic',
    //     correlationData: Buffer.from([1, 2, 3, 4]),
    //     userProperties: {
    //       'test': 'test'
    //     },
    //     subscriptionIdentifier: 120, // can be an Array in message from broker, if message included in few another subscriptions
    //     contentType: 'test'
    //  }
  };
  client.publish(packet, function(err) {
    // console.log(packet);
    // console.log(err?.toString());
  })
});

server.listen(port, function () {
  console.log("Server started and listening on port ", port);
});

// server.on("connection", (socket) => {
//   socket.on("data", (chunk) => {
//     console.log(new Date().toISOString(), chunk.toString("base64"));
//   });
// });


//------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------NODE--CLINET-------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------

const mqtt = require('.')
// const client = mqtt.connect('mqtt://broker.mqttdashboard.com')
var options = {
    host: '192.168.88.97',
    port: 1883,
    clientId: 'CLIENT-PC',
}
var client2 = mqtt.connect(options)

// var message = "AlRBUgCrVAAEHh8BAVMABwEABxwMIwBDAFQBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAxJAAVUMjQwN00AETk0OkI5OjdFOjgyOjE4OjlDQQABAFoAAQFMAAMAAABEAAoxNjUyODA4Njc4VwABBEgAAQBPAAEA/hM=";

// client.publish('pizdapizda/94:B9:7E:82:18:9C/to', message, function (err, smth) {
//   console.log(err?.toString());
//   console.log(smth?.toString());
//   // const c = "AlRBUgCrVAAEHh8BAVMABwEABxwMIwBDAFQBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAxJAAVUMjQwN00AETk0OkI5OjdFOjgyOjE4OjlDQQABAFoAAQFMAAMAAABEAAoxNjUyODA4Njc4VwABBEgAAQBPAAEA/hM=";

// })

client2.subscribe('pizdapizda/94:B9:7E:82:18:9C/from');
client2.subscribe('pizdapizda/94:B9:7E:82:18:9C/to');

// // client.publish('from', 'Hello');
// // client.publish('to', 'Hello');

// // client.end()

// // var mqtt = require('./')

// // var options = {
// //     host: 'e245d8ca10e54f4f967da6a7beb04e02.s1.eu.hivemq.cloud',
// //     port: 8883,
// //     protocol: 'mqtts',
// //     username: 'test666',
// //     password: 'Qetuo666',
// //     clientId: '94:B9:7E:82:18:9C'
// // }

// // //initialize the MQTT client
// // var client = mqtt.connect(options);

// // //setup the callbacks
// // client.on('connect', function () {
// //     console.log('Connected');
// // });

// client.on('error', function (error) {
//     console.log(error);
// });

client2.on('message', function (topic, message) {
    //Called each time a message is received
    console.log('MESSAGE!');
    console.log('Received message:', topic, message.toString("base64"));
});

// // // subscribe to topic 'my/test/topic'
// // client.subscribe('94:B9:7E:82:18:9C/from');
// // client.subscribe('from');

// // // publish message 'Hello' to topic 'my/test/topic'
// const testMSG = Buffer.from("AlRRVwBXQwBUAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQc9pk=");

// const testMSG = Buffer.from("AlRRVwBXQwBUAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQcAAAdAAocABQdBWQc9pk=");
let send = {
  instruction: '02TAW',
  length: 3,
  id: 'S',
  len: 1,
  power: 0,
  // mode: 'U',
  // self: 0,
  // tempUser: 44,
  // tempVacant: 12,
}
send = Buffer.from(
  Object.values(send)
  .toString("base64")
);
let crc = crc16to(send, Buffer.length);
crc = Buffer.from(
  String(crc).toString("base64")
);
send = Buffer.from(send + crc);
console.log(send, 'DATA FOR SENDING');
client2.publish('pizdapizda/94:B9:7E:82:18:9C/to', send, console.log);
// client2.publish('pizdapizda/94:B9:7E:82:18:9C/to', testMSG);
// client2.publish('from', 'Hello');
