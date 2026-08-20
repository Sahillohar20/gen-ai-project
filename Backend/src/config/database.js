const mongoose = require("mongoose");
const dns = require("node:dns");

// Use reliable public DNS resolvers for MongoDB Atlas SRV lookup.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Database");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

module.exports = connectToDB;
