//==============================================================//
//  SERVERLESS ENTRYPOINT (Vercel)                              //
//  Vercel imports this handler. The Express app connects to    //
//  MongoDB lazily per request (see the SERVERLESS branch in    //
//  server.js), so we just re-export the app.                   //
//==============================================================//
module.exports = require("../server");
