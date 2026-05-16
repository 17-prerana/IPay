const request = require("supertest");
const app = require("../server");
const { connectTestDB, clearTestDB, closeTestDB } = require("./helpers/db");

beforeAll(connectTestDB);
beforeEach(clearTestDB);
afterAll(closeTestDB);

describe("Auth routes", () => {
  const signupPayload = (overrides = {}) => ({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    dateOfBirth: "2000-01-01",
    bankName: "HDFC Bank",
    accountNumber: "123456789012",
    ...overrides
  });

  const createVerifiedUser = async (overrides = {}) => {
    const user = signupPayload(overrides);

    const otpRes = await request(app)
      .post("/api/auth/signup/request-otp")
      .send(user);

    return request(app)
      .post("/api/auth/signup/verify")
      .send({
        email: user.email,
        otp: otpRes.body.otp
      });
  };

  describe("Signup OTP flow", () => {
    it("creates a user and returns a token", async () => {
      const otpRes = await request(app)
        .post("/api/auth/signup/request-otp")
        .send(signupPayload());

      expect(otpRes.statusCode).toBe(200);
      expect(otpRes.body.otp).toMatch(/^\d{6}$/);

      const res = await request(app)
        .post("/api/auth/signup/verify")
        .send({
          email: "test@example.com",
          otp: otpRes.body.otp
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user).toMatchObject({
        name: "Test User",
        email: "test@example.com",
        bankName: "HDFC Bank",
        accountNumber: "123456789012",
        balance: 1000
      });
      expect(res.body.user.password).toBeUndefined();
    });

    it("rejects duplicate email signup", async () => {
      const user = signupPayload({
        name: "Test User",
        email: "duplicate@example.com"
      });

      await createVerifiedUser(user);
      const res = await request(app).post("/api/auth/signup/request-otp").send(user);

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("User already exists");
    });

    it("rejects invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/signup/request-otp")
        .send(signupPayload({
          name: "Test User",
          email: "not-an-email"
        }));

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Valid email is required");
    });

    it("rejects weak password", async () => {
      const res = await request(app)
        .post("/api/auth/signup/request-otp")
        .send(signupPayload({
          name: "Test User",
          email: "weak@example.com",
          password: "123"
        }));

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Password must be at least 6 characters");
    });

    it("rejects users under 18", async () => {
      const today = new Date();
      const underageBirthDate = new Date(
        today.getFullYear() - 17,
        today.getMonth(),
        today.getDate()
      )
        .toISOString()
        .split("T")[0];

      const res = await request(app)
        .post("/api/auth/signup/request-otp")
        .send(signupPayload({
          name: "Young User",
          email: "young@example.com",
          dateOfBirth: underageBirthDate
        }));

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("User must be at least 18 years old");
    });

    it("rejects invalid OTP", async () => {
      await request(app)
        .post("/api/auth/signup/request-otp")
        .send(signupPayload({ email: "otp@example.com" }));

      const res = await request(app)
        .post("/api/auth/signup/verify")
        .send({
          email: "otp@example.com",
          otp: "000000"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Invalid OTP");
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with correct credentials", async () => {
      await createVerifiedUser({
          name: "Login User",
          email: "login@example.com",
          password: "password123"
        });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "password123"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe("login@example.com");
    });

    it("rejects wrong password", async () => {
      await createVerifiedUser({
          name: "Login User",
          email: "wrong-password@example.com",
          password: "password123"
        });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "wrong-password@example.com",
          password: "badpassword"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the current user with a valid token", async () => {
      const signupRes = await createVerifiedUser({
          name: "Me User",
          email: "me@example.com",
          password: "password123"
        });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${signupRes.body.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe("me@example.com");
      expect(res.body.password).toBeUndefined();
    });

    it("rejects invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe("Invalid token");
    });

    it("rejects missing token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe("No token");
    });
  });
});
