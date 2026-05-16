# iPay Digital Wallet

iPay is a full-stack digital wallet application built with React, Express, and MongoDB. It supports secure account creation, OTP verification, login, wallet transfers, transaction history, profile management, account deletion, and password reset through email OTP.

## Features

- User signup with email OTP verification
- Login with JWT authentication
- Forgot password with email OTP reset
- Protected dashboard
- Balance display with privacy masking
- Bank name and masked account number display
- Edit profile
- Delete account
- Send money to another iPay user
- Daily transfer limit tracking
- Fraud-risk indicators for unusual transfers
- Transaction history with search and filters
- Backend validation, logging, and error handling
- Backend tests for auth and transactions

## Tech Stack

Frontend:
- React
- Vite
- React Router
- Axios
- Tailwind CSS

Backend:
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Nodemailer
- Winston
- Jest and Supertest

## Project Structure

```text
PRERANA/
  ipay-backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    tests/
    utils/
    server.js
  ipay-frontend/
    public/
    src/
      components/
      context/
      pages/
      routes/
      services/
```

## Environment Variables

Create `ipay-backend/.env` using `ipay-backend/.env.example` as a guide.

```env
MONGO_URI=mongodb://127.0.0.1:27018/ipay?replicaSet=rs0
JWT_SECRET=your_jwt_secret
PORT=5001

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=iPay <your_email@gmail.com>
NODE_ENV=development
```

Do not commit real `.env` values to Git.

## Installation

Install backend dependencies:

```bash
cd ipay-backend
npm install
```

Install frontend dependencies:

```bash
cd ../ipay-frontend
npm install
```

## Running the Project

Start MongoDB replica set for transfer transactions:

```bash
cd ipay-backend
npm run mongo:rs
```

In another terminal, initialize the replica set:

```bash
npm run mongo:init
```

Start the backend:

```bash
npm run dev
```

Start the frontend:

```bash
cd ../ipay-frontend
npm run dev
```

Open the frontend URL shown by Vite, usually:

```text
http://localhost:5173
```

The frontend currently calls the backend at:

```text
http://localhost:5001/api
```

## Main API Routes

Auth:

```text
POST   /api/auth/signup
POST   /api/auth/signup/request-otp
POST   /api/auth/signup/verify
POST   /api/auth/login
POST   /api/auth/password/request-reset
POST   /api/auth/password/reset
GET    /api/auth/me
PUT    /api/auth/me
DELETE /api/auth/me
```

Transactions:

```text
POST /api/transactions/transfer
GET  /api/transactions/history
GET  /api/transactions/daily-summary
POST /api/transactions/analyze-risk
```

## Testing

Run backend syntax check:

```bash
cd ipay-backend
npm run test:syntax
```

Run backend tests:

```bash
npm test
```

Build frontend:

```bash
cd ../ipay-frontend
npm run build
```

## Notes

- Signup and password reset OTPs are sent through Nodemailer.
- If SMTP is not configured in development, email output uses JSON transport and is logged by the backend.
- JWT is used to protect dashboard, transfer, history, edit profile, and delete account operations.
- MongoDB transactions require a replica set, so use the provided MongoDB scripts or Docker setup.

## Docker Backend Setup

The backend includes a Dockerfile and Docker Compose file:

```bash
cd ipay-backend
docker compose up --build
```

This starts the backend and MongoDB service together.
