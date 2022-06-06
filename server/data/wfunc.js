var fs = require("fs");

module.exports = wdata = (newdata) => {
  let data = JSON.stringify(newdata);
  fs.writeFileSync("/Users/nickolaus/GitHub/mcs_test/server/data/d350.json", data);
};
