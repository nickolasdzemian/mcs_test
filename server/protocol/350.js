//-----------------------------------------------------------------------------------
//-----------------------------------PARSE-MCS-350-----------------------------------
//-----------------------------------------------------------------------------------

var crc16 = require("./common/crc16");
var decode = require("./common/decode");
const wdata = require("../data/wfunc");

function parceMode(u) {
  switch (u) {
    case 0:
      return "Manual";
    case 1:
      return "Programm";
    case 2:
      return "Antifreeze";
    default:
      "No cases for input data";
  }
}

function parceSelf(u) {
  const selves = ["▼", "▲", "▲▼", 4, "♲▼", "♲▲", "♲▲▼"];
  if (u < 1 || u > 7) {
    return u || "No cases for input data";
  }
  return selves[u - 1];
}

function parceAirCorr(u) {
  const aLimit = u > 100 ? -(256 - u) : u;
  return aLimit;
}

function parceSensorType(u) {
  const types = [
    "Teploluxe 6.8",
    "AuBe 10",
    "Warmup 12",
    "DEVI 15",
    "Eberle 33",
    "Ensto 47",
  ];
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
      return {
        status,
        mode,
        self,
        tempUser,
        tempVacant,
        airLimit,
        airCorrection,
      };
    case "M":
      const mac = new TextDecoder().decode(b.buffer);
      return { mac };
    case "C":
      let chart = [];
      for (let i = 0; i < b.buffer.byteLength / 3; i++) {
        chart[i] = {
          time: b.getUint16(0 + i * 3),
          temp: b.getUint8(2 + i * 3),
        };
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

module.exports =  function process350(payload) {
  if (!payload) {
    return;
  }

  // // FOR TESTING ONLY
  // const testPayload = "AlRBUgCrVAAEHh8BAVMABwEABxwMIwBDAFQBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAwBpBwB4AwEdBwFKAxJAAVUMjQwN00AETk0OkI5OjdFOjgyOjE4OjlDQQABAFoAAQFMAAMAAABEAAoxNjUyODA4Njc4VwABBEgAAQBPAAEA/hM="
  // const b = decode.base64.decode(testPayload);
  
  const b = decode.base64.decode(payload);
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
    const updateDate = {timestamp: new Date().toUTCString()}
    result = { ...result, ...r,  ...updateDate};
  }

  wdata(result);
  return result;
}
