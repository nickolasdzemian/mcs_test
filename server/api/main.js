module.exports = function api() {
  const express = require("express");
  const app = express();
  const http = require("http");
  const rdata = require("../data/rfunc");
  // let data = JSON.stringify(rdata());
  let data = JSON.parse(rdata());
  // app.use(express.json());
  app.get('/350', function(request, response){
    response.set("Content-Type", "application/json");
    response.send(data);
});
app.listen(8080);

  // http
  //   .createServer(function (request, response) {
  //     response.setHeader("Content-Type", "application/json");

  //     switch (request.url) {
  //       case "/350":
  //         response.write(data);
  //         break;
  //       default:
  //         response.end("Are you trying to get a bug?");
  //     }
  //     response.end();
  //   })
  //   .listen(8080);
};
