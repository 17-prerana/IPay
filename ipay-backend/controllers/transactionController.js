const mongoose = require("mongoose");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Daily transaction limit: Rs. 50,000
const DAILY_LIMIT = 50000;
// Large transaction threshold for verification: Rs. 10,000
const LARGE_TRANSACTION_THRESHOLD = 10000;

const getDailyTransactionTotal = async (userId, session) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const dailyTransactions = await Transaction.aggregate([
    {
      $match: {
        sender: mongoose.Types.ObjectId.createFromHexString(userId.toString()),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: "success"
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" }
      }
    }
  ]).session(session);

  return dailyTransactions[0]?.total || 0;
};

exports.getDailyTransactionSummary = asyncHandler(async (req, res) => {
  const userId = req.user;
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const dailyTotal = await Transaction.aggregate([
    {
      $match: {
        sender: mongoose.Types.ObjectId.createFromHexString(userId.toString()),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: "success"
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);

  const spent = dailyTotal[0]?.total || 0;
  const transactionCount = dailyTotal[0]?.count || 0;
  const remaining = Math.max(0, DAILY_LIMIT - spent);
  const canTransfer = remaining > 0;

  res.json({
    dailyLimit: DAILY_LIMIT,
    spent,
    remaining,
    transactionCount,
    canTransfer,
    limitReached: spent >= DAILY_LIMIT,
    largeTransactionThreshold: LARGE_TRANSACTION_THRESHOLD
  });
});

exports.analyzeFraudRisk = asyncHandler(async (req, res) => {
  const userId = req.user;
  const { amount } = req.body;

  const transferAmount = Number(amount) || 0;
  const riskFactors = [];
  let riskScore = 0;

  // Get user's transaction history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTransactions = await Transaction.find({
    sender: userId,
    createdAt: { $gte: thirtyDaysAgo }
  }).sort({ createdAt: -1 });

  // Risk Factor 1: Unusually High Amount
  if (recentTransactions.length > 0) {
    const averageAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
    if (transferAmount > averageAmount * 3) {
      riskFactors.push({
        type: "HIGH_AMOUNT",
        description: "Amount is significantly higher than your usual transfers",
        severity: "high"
      });
      riskScore += 25;
    } else if (transferAmount > averageAmount * 1.5) {
      riskFactors.push({
        type: "ELEVATED_AMOUNT",
        description: "Amount is above your average transaction",
        severity: "medium"
      });
      riskScore += 15;
    }
  }

  // Risk Factor 2: Midnight Transaction (11 PM - 4 AM)
  const currentHour = new Date().getHours();
  if (currentHour >= 23 || currentHour < 4) {
    riskFactors.push({
      type: "MIDNIGHT_TRANSACTION",
      description: "Transaction during unusual hours (late night)",
      severity: "medium"
    });
    riskScore += 15;
  }

  // Risk Factor 3: Repeated Failed Payments (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentFailedTransactions = await Transaction.countDocuments({
    sender: userId,
    status: "failed",
    createdAt: { $gte: oneDayAgo }
  });

  if (recentFailedTransactions >= 3) {
    riskFactors.push({
      type: "REPEATED_FAILURES",
      description: `Multiple failed payment attempts (${recentFailedTransactions}) in last 24 hours`,
      severity: "high"
    });
    riskScore += 25;
  } else if (recentFailedTransactions >= 2) {
    riskFactors.push({
      type: "MULTIPLE_FAILURES",
      description: `${recentFailedTransactions} failed payment attempts in last 24 hours`,
      severity: "medium"
    });
    riskScore += 15;
  }

  // Risk Factor 4: Multiple Rapid Payments (more than 3 in last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const rapidTransactions = await Transaction.countDocuments({
    sender: userId,
    status: "success",
    createdAt: { $gte: tenMinutesAgo }
  });

  if (rapidTransactions >= 4) {
    riskFactors.push({
      type: "RAPID_TRANSACTIONS",
      description: `Multiple rapid transfers detected (${rapidTransactions} in last 10 minutes)`,
      severity: "high"
    });
    riskScore += 20;
  }

  // Risk Factor 5: Very High Amount (exceeds 40% of balance)
  const sender = await User.findById(userId);
  if (sender && transferAmount > sender.balance * 0.4) {
    riskFactors.push({
      type: "LARGE_BALANCE_TRANSFER",
      description: "Amount exceeds 40% of your account balance",
      severity: "medium"
    });
    riskScore += 15;
  }

  // Determine overall risk level
  let riskLevel = "LOW";
  if (riskScore >= 50) {
    riskLevel = "HIGH";
  } else if (riskScore >= 30) {
    riskLevel = "MEDIUM";
  }

  res.json({
    riskLevel,
    riskScore: Math.min(riskScore, 100),
    riskFactors,
    requiresVerification: riskLevel === "HIGH",
    message:
      riskScore === 0
        ? "Transaction looks normal"
        : `${riskFactors.length} suspicious indicator(s) detected`
  });
});

exports.transferMoney = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderId = req.user;
    const { receiverEmail, amount } = req.body;

    const transferAmount = Number(amount);

    if (!Number.isFinite(transferAmount) || !Number.isInteger(transferAmount)) {
      res.status(400);
      throw new Error("Amount must be a positive whole number");
    }

    if (transferAmount <= 0) {
      res.status(400);
      throw new Error("Amount must be a positive whole number");
    }

    // Check daily transaction limit
    const dailyTotal = await getDailyTransactionTotal(senderId, session);
    if (dailyTotal + transferAmount > DAILY_LIMIT) {
      res.status(400);
      throw new Error(`Daily transaction limit of Rs. ${DAILY_LIMIT} exceeded. You can transfer up to Rs. ${DAILY_LIMIT - dailyTotal} more today.`);
    }

    const normalizedAmount = transferAmount;

    const sender = await User.findById(senderId).session(session);

    if (!sender) {
      res.status(400);
      throw new Error("Sender not found");
    }

    if (sender.email === receiverEmail) {
      res.status(400);
      throw new Error("Cannot transfer to yourself");
    }

    const receiver = await User.findOne({
      email: receiverEmail
    }).session(session);

    if (!receiver) {
      res.status(400);
      throw new Error("Receiver not found");
    }

    if (sender.balance < normalizedAmount) {
      res.status(400);
      throw new Error("Insufficient balance");
    }

    sender.balance = Number(
      (sender.balance - normalizedAmount).toFixed(2)
    );

    receiver.balance = Number(
      (receiver.balance + normalizedAmount).toFixed(2)
    );

    await sender.save({ session, validateModifiedOnly: true });
    await receiver.save({ session, validateModifiedOnly: true });

    await Transaction.create(
      [
        {
          sender: sender._id,
          receiver: receiver._id,
          amount: normalizedAmount,
          status: "success"
        }
      ],
      { session }
    );

    await session.commitTransaction();

    const remainingAfterTransfer = DAILY_LIMIT - (dailyTotal + normalizedAmount);

    res.json({
      success: true,
      data: {
        msg: "Transfer successful",
        balance: sender.balance,
        remainingDailyLimit: remainingAfterTransfer,
        isLargeTransaction: normalizedAmount >= LARGE_TRANSACTION_THRESHOLD
      }
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

exports.getTransactionHistory = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 10, 1),
    50
  );

  const skip = (page - 1) * limit;

  const query = {
    $or: [{ sender: req.user }, { receiver: req.user }]
  };

  const totalTransactions = await Transaction.countDocuments(query);

  const totalPages = Math.ceil(totalTransactions / limit);

  const transactions = await Transaction.find(query)
    .populate("sender", "name email")
    .populate("receiver", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: {
      transactions,
      currentPage: page,
      totalPages,
      totalTransactions,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});
