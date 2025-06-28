const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Default to worksmartAI database if MONGO_URI is not set
const URI = process.env.MONGO_URI || "mongodb+srv://mrroy251998:Password@cluster0.szumu18.mongodb.net/";

exports.connectDB = async () => {
  try {
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      connectTimeoutMS: 10000, // Give up initial connection after 10s
    });
    console.log("DB is connected");
    return true;
  } catch (error) {
    console.error("DB connection error:", error.message);
    return false;
  }
};
