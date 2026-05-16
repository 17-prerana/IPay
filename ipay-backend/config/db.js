const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async (uri = process.env.MONGO_URI, options = {}) => {
  try {
    const conn = await mongoose.connect(uri, options);
    logger.info("MongoDB connected", { host: conn.connection.host });
    return conn;
  } catch (error) {
    logger.error("MongoDB connection failed", {
      message: error.message,
      stack: error.stack
    });

    if (process.env.NODE_ENV === "test") {
      throw error;
    }

    process.exit(1);
  }
};

module.exports = connectDB;
