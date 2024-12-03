const Hapi = require("@hapi/hapi");
const routes = require("../server/routes");
require("dotenv").config();
const loadModel = require("../services/loadModel");
const InputError = require("../exceptions/InputError");

(async () => {
  const server = Hapi.server({
    port: process.env.PORT || 8080,
    host: "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"],
      },
      payload: {
        maxBytes: 1000000, // 1 MB (dalam sistem desimal)
      },
    },
  });

  const model = await loadModel();
  server.app.model = model;

  server.route(routes);

  server.ext("onPreResponse", function (request, h) {
    const response = request.response;

     if (response.isBoom && response.output.statusCode === 413) {
       const newResponse = h.response({
         status: "fail",
         message: "Payload content length greater than maximum allowed: 1000000",
       });
       newResponse.code(413); // Kode status untuk Payload Too Large
       return newResponse;
     }

    if (response instanceof InputError) {
      const statusCode = response.output.statusCode;
      const newResponse = h.response({
        status: "fail",
        message: "Terjadi kesalahan dalam melakukan prediksi",
      });
      newResponse.code(statusCode);
      return newResponse;
    }

    if (response.isBoom) {
      const statusCode = response.output.statusCode;
      const newResponse = h.response({
        status: "fail",
        message: response.output.payload.message || "Internal server error.",
      });
      newResponse.code(statusCode);
      return newResponse;
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server start at: ${server.info.uri}`);
})();
