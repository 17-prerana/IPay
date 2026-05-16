const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { transferLimiter } = require("../middleware/rateLimiter");
const {
  validateTransfer
} = require("../middleware/validators/transactionValidators");
const {
  transferMoney,
  getTransactionHistory,
  getDailyTransactionSummary,
  analyzeFraudRisk
} = require("../controllers/transactionController");

router.post("/transfer", auth, transferLimiter, validateTransfer, transferMoney);
router.get("/history", auth, getTransactionHistory);
router.get("/daily-summary", auth, getDailyTransactionSummary);
router.post("/analyze-risk", auth, analyzeFraudRisk);

module.exports = router;
