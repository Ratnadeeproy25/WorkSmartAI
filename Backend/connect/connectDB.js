const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Use environment variable for MongoDB URI, with fallback for development
const URI = process.env.MONGO_URI || "mongodb+srv://mrroy251998:Password@cluster0.szumu18.mongodb.net/";

exports.connectDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      connectTimeoutMS: 15000, // Give up initial connection after 15s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 1, // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      retryWrites: true, // Retry write operations if they fail
      w: 'majority' // Write concern for data durability
    });
    
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("🔧 Please check your MONGO_URI environment variable");
    return false;
  }
};
