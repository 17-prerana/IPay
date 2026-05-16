const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { connectTestDB, clearTestDB, closeTestDB } = require("./helpers/db");

const createTransferUsers = async () => {
  const sender = await User.create({
    name: "Sender",
    email: "sender@example.com",
    password: "hashed-password",
    bankName: "HDFC Bank",
    accountNumber: "123456789012"
  });

  const receiver = await User.create({
    name: "Receiver",
    email: "receiver@example.com",
    password: "hashed-password",
    bankName: "ICICI Bank",
    accountNumber: "987654321012"
  });

  return {
    sender,
    senderToken: jwt.sign({ id: sender._id }, process.env.JWT_SECRET),
    receiver,
    senderId: sender._id.toString(),
    senderEmail: sender.email,
    receiverId: receiver._id.toString(),
    receiverEmail: receiver.email
  };
};

beforeAll(connectTestDB);
beforeEach(clearTestDB);
afterAll(closeTestDB);

describe("Transaction routes", () => {
  describe("POST /api/transactions/transfer", () => {
    it("transfers money and updates both balances", async () => {
      const { senderId, senderToken, receiverId, receiverEmail } = await createTransferUsers();

      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          receiverEmail,
          amount: "125"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          msg: "Transfer successful",
          balance: 875
        }
      });

      const updatedSender = await User.findById(senderId);
      const updatedReceiver = await User.findById(receiverId);
      const transactions = await Transaction.find({});

      expect(updatedSender.balance).toBe(875);
      expect(updatedReceiver.balance).toBe(1125);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(125);
    });

    it("rejects insufficient balance without mutating balances", async () => {
      const { senderId, senderToken, receiverId, receiverEmail } = await createTransferUsers();

      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          receiverEmail,
          amount: "1001"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Insufficient balance");

      const updatedSender = await User.findById(senderId);
      const updatedReceiver = await User.findById(receiverId);
      const transactions = await Transaction.find({});

      expect(updatedSender.balance).toBe(1000);
      expect(updatedReceiver.balance).toBe(1000);
      expect(transactions).toHaveLength(0);
    });

    it("rejects self-transfer", async () => {
      const { senderEmail, senderToken } = await createTransferUsers();

      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          receiverEmail: senderEmail,
          amount: "10"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Cannot transfer to yourself");
    });

    it("rejects decimal amount", async () => {
      const { senderToken, receiverEmail } = await createTransferUsers();

      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          receiverEmail,
          amount: "10.5"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Amount must be a positive whole number");
    });

    it("rejects zero amount", async () => {
      const { senderToken, receiverEmail } = await createTransferUsers();

      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          receiverEmail,
          amount: "0"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Amount must be a positive whole number");
    });

    it("rejects a non-existent receiver without mutating sender balance", async () => {
      const { senderId, senderToken } = await createTransferUsers();
      const missingReceiverEmail = "missing@example.com";

      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          receiverEmail: missingReceiverEmail,
          amount: "10"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Receiver not found");

      const updatedSender = await User.findById(senderId);
      const transactions = await Transaction.find({});

      expect(updatedSender.balance).toBe(1000);
      expect(transactions).toHaveLength(0);
    });
  });

  describe("GET /api/transactions/history", () => {
    it("returns paginated transaction history", async () => {
      const { senderToken, receiverEmail } = await createTransferUsers();

      await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ receiverEmail, amount: "10" });

      const res = await request(app)
        .get("/api/transactions/history?page=1&limit=1")
        .set("Authorization", `Bearer ${senderToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.transactions).toHaveLength(1);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          currentPage: 1,
          totalPages: 1,
          totalTransactions: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    });
  });
});
