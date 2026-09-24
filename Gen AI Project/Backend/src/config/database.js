const mongoose = require("mongoose");
const dns = require("node:dns");

// Use reliable public DNS resolvers for MongoDB Atlas SRV lookup.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function connectToDB() {
  // On serverless platforms (Vercel) a new function instance can be reused
  // across invocations. Skip reconnecting if we already have a live
  // connection (readyState 1 = connected, 2 = connecting).
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Database");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

module.exports = connectToDB;
