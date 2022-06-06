var fs = require("fs");

module.exports = rdata = () => {
  try {
    const data = fs.readFileSync('/Users/nickolaus/GitHub/mcs_test/server/data/d350.json');
    return data;
  } catch (err) {
    console.error(err);
  }
};
