const mongoose = require("mongoose");
const fs = require("fs");
const { MongoMemoryReplSet } = require("mongodb-memory-server-core");
const connectDB = require("../../config/db");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const SignupOtp = require("../../models/SignupOtp");
const PasswordResetOtp = require("../../models/PasswordResetOtp");

let replSet;

const findMongoBinary = () => {
  const candidates = [
    process.env.MONGOD_BINARY,
    "C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe",
    "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe",
    "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe",
    "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe"
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const getTestMongoUri = async () => {
  if (process.env.TEST_MONGO_URI) {
    return process.env.TEST_MONGO_URI;
  }

  const systemBinary = findMongoBinary();

  if (!systemBinary) {
    throw new Error("MongoDB binary not found. Set MONGOD_BINARY to your mongod.exe path.");
  }

  replSet = await MongoMemoryReplSet.create({
    binary: {
      systemBinary,
      version: "8.3.2"
    },
    replSet: {
      count: 1,
      storageEngine: "wiredTiger"
    }
  });

  return replSet.getUri("ipay_test");
};

const buildTestMongoUri = async () => {
  const uri = await getTestMongoUri();

  if (process.env.TEST_MONGO_URI) {
    return uri;
  }

  const parsedUri = new URL(uri);
  const dbName = parsedUri.pathname && parsedUri.pathname !== "/"
    ? parsedUri.pathname.slice(1)
    : "ipay";

  parsedUri.pathname = `/${dbName}`;
  return parsedUri.toString();
};

const connectTestDB = async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  if (mongoose.connection.readyState === 0) {
    await connectDB(await buildTestMongoUri(), {
      serverSelectionTimeoutMS: 5000
    });
  }
};

const clearTestDB = async () => {
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    SignupOtp.deleteMany({}),
    PasswordResetOtp.deleteMany({})
  ]);
};

const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
};

module.exports = {
  connectTestDB,
  clearTestDB,
  closeTestDB
};
