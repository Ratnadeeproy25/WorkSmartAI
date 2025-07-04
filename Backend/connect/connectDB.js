const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Require MONGO_URI for production, with a local fallback for development
const URI = process.env.MONGO_URI || (process.env.NODE_ENV === 'production' ? null : "mongodb://localhost:27017/worksmartAI");

if (!URI) {
  console.error("MONGO_URI environment variable is required for production deployment");
  process.exit(1);
}

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
