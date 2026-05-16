const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  validateSignup,
  validateLogin,
  validateOtpVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateProfileUpdate
} = require("../middleware/validators/authValidators");
const {
  signup,
  requestSignupOtp,
  verifySignupOtp,
  login,
  requestPasswordReset,
  resetPassword,
  getMe,
  updateMe,
  deleteMe
} = require("../controllers/authController");

router.post("/signup", validateSignup, signup);
router.post("/signup/request-otp", validateSignup, requestSignupOtp);
router.post("/signup/verify", validateOtpVerification, verifySignupOtp);
router.post("/login", validateLogin, login);
router.post("/password/request-reset", validatePasswordResetRequest, requestPasswordReset);
router.post("/password/reset", validatePasswordReset, resetPassword);
router.get("/me", auth, getMe);
router.put("/me", auth, validateProfileUpdate, updateMe);
router.delete("/me", auth, deleteMe);

module.exports = router;
