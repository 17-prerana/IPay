const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const SignupOtp = require("../models/SignupOtp");
const PasswordResetOtp = require("../models/PasswordResetOtp");
const Transaction = require("../models/Transaction");
const { sendSignupOtp, sendPasswordResetOtp } = require("../utils/mailer");

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  accountType: user.accountType,
  bankName: user.bankName,
  accountNumber: user.accountNumber,
  balance: user.balance
});

exports.signup = asyncHandler(async (req, res) => {
  // Redirect to requestSignupOtp - the actual signup process requires OTP verification
  return requestSignupOtp(req, res);
});

exports.requestSignupOtp = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    dateOfBirth,
    gender,
    accountType,
    bankName,
    accountNumber
  } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await SignupOtp.findOneAndUpdate(
    { email },
    {
      name,
      email,
      passwordHash: hashedPassword,
      dateOfBirth,
      gender: gender || "Prefer not to say",
      accountType: accountType || "Savings",
      bankName,
      accountNumber,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0
    },
    {
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  await sendSignupOtp(email, otp);

  res.status(200).json({
    msg: "OTP sent to your email",
    ...(process.env.NODE_ENV === "test" ? { otp } : {})
  });
});

exports.verifySignupOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const pendingSignup = await SignupOtp.findOne({ email });

  if (!pendingSignup) {
    res.status(400);
    throw new Error("OTP expired or not requested");
  }

  if (pendingSignup.expiresAt < new Date()) {
    await SignupOtp.deleteOne({ _id: pendingSignup._id });
    res.status(400);
    throw new Error("OTP expired or not requested");
  }

  const isOtpValid = await bcrypt.compare(otp, pendingSignup.otpHash);

  if (!isOtpValid) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    await SignupOtp.deleteOne({ _id: pendingSignup._id });
    res.status(400);
    throw new Error("User already exists");
  }

  const user = new User({
    name: pendingSignup.name,
    email: pendingSignup.email,
    password: pendingSignup.passwordHash,
    dateOfBirth: pendingSignup.dateOfBirth,
    gender: pendingSignup.gender,
    accountType: pendingSignup.accountType,
    bankName: pendingSignup.bankName,
    accountNumber: pendingSignup.accountNumber
  });

  await user.save();
  await SignupOtp.deleteOne({ _id: pendingSignup._id });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });

  res.status(201).json({ token, user: buildUserResponse(user) });
});

exports.signupDirectForTests = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    dateOfBirth,
    gender,
    accountType,
    bankName,
    accountNumber
  } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user = new User({
    name,
    email,
    password: hashedPassword,
    dateOfBirth: dateOfBirth || null,
    gender: gender || undefined,
    accountType: accountType || undefined,
    bankName,
    accountNumber
  });

  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });

  res.status(201).json({ token, user: buildUserResponse(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  // Check if user is 18 or older
  const birthDate = new Date(user.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (age < 18 || (age === 18 && monthDifference < 0) || (age === 18 && monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    res.status(403);
    throw new Error("You must be 18 years or older to login");
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });

  res.json({ token, user: buildUserResponse(user) });
});

exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("No account found with this email");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await PasswordResetOtp.findOneAndUpdate(
    { email },
    {
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    },
    {
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  await sendPasswordResetOtp(email, otp);

  res.json({
    msg: "Password reset OTP sent to your email",
    ...(process.env.NODE_ENV === "test" ? { otp } : {})
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  const resetRequest = await PasswordResetOtp.findOne({ email });

  if (!resetRequest) {
    res.status(400);
    throw new Error("OTP expired or not requested");
  }

  if (resetRequest.expiresAt < new Date()) {
    await PasswordResetOtp.deleteOne({ _id: resetRequest._id });
    res.status(400);
    throw new Error("OTP expired or not requested");
  }

  const isOtpValid = await bcrypt.compare(otp, resetRequest.otpHash);
  if (!isOtpValid) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  const user = await User.findOne({ email });
  if (!user) {
    await PasswordResetOtp.deleteOne({ _id: resetRequest._id });
    res.status(404);
    throw new Error("No account found with this email");
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save({ validateModifiedOnly: true });
  await PasswordResetOtp.deleteOne({ _id: resetRequest._id });

  res.json({ msg: "Password reset successful" });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user);
});

exports.updateMe = asyncHandler(async (req, res) => {
  const {
    name,
    gender,
    accountType,
    bankName,
    accountNumber
  } = req.body;

  const user = await User.findById(req.user);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = name;
  user.gender = gender || "Prefer not to say";
  user.accountType = accountType || "Savings";
  user.bankName = bankName;
  user.accountNumber = accountNumber;

  await user.save();

  res.json({
    msg: "Profile updated successfully",
    user: buildUserResponse(user)
  });
});

exports.deleteMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await Transaction.deleteMany({
    $or: [{ sender: user._id }, { receiver: user._id }]
  });
  await SignupOtp.deleteMany({ email: user.email });
  await PasswordResetOtp.deleteMany({ email: user.email });
  await User.deleteOne({ _id: user._id });

  res.json({ msg: "Account deleted successfully" });
});
