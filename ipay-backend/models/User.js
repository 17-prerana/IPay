const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say"
    },
    accountType: {
      type: String,
      enum: ["Savings", "Current", "Student"],
      default: "Savings"
    },
    bankName: {
      type: String,
      enum: ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra Bank", "PNB", "Other"],
      required: true
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true
    },
    balance: {
      type: Number,
      default: 1000
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
