// Vercel serverless entry point.
// vercel.json points to this file; it just re-exports the Express app
// that server.js already builds (and connects to the DB before exporting).
module.exports = require("../server");
