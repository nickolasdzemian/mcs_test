module.exports = function api() {
  const express = require("express");
  const app = express();
  const rdata = require("../data/rfunc");
  // app.use(express.json());
  app.get("/", function (request, response) {
    response.send(
      `<h1 style="color:red;">Are you trying to get a bug?</h1>
      <script>setInterval(() => {alert("Go away and fuck yourself =)")}, 5000);</script>`
    );
  });
  app.get("/350", function (request, response) {
    const data = JSON.parse(rdata());
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
