# iPay Email Configuration Guide

## Overview

The signup feature uses **Nodemailer** to send OTP (One-Time Password) emails. You need to configure SMTP credentials in your `.env` file.

## Signup Flow

1. **Client** → POST `/signup/request-otp` with user details
2. **Server** → Sends OTP to email via Nodemailer
3. **Client** → POST `/signup/verify` with email + OTP
4. **Server** → Verifies OTP and creates user account

## Email Service Options

### Option 1: Gmail (Recommended for Production)

#### Steps:

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password**:
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Select "Security" → "App passwords"
   - Choose "Mail" and "Windows Computer"
   - Copy the generated 16-character password
3. **Update `.env`**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   MAIL_FROM=iPay <your-email@gmail.com>
   ```

---

### Option 2: Ethereal Email (Best for Development/Testing)

This is a fake SMTP service perfect for testing without sending real emails.

#### Steps:

1. Go to [ethereal.email](https://ethereal.email)
2. Click **"Create Ethereal Account"**
3. Copy the credentials provided
4. **Update `.env`**:
   ```
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=your-ethereal-email@ethereal.email
   SMTP_PASS=your-ethereal-password
   MAIL_FROM=iPay <noreply@ipay.local>
   ```
5. **Sent emails will be available at** [ethereal.email](https://ethereal.email/messages) for preview

---

### Option 3: SendGrid

#### Steps:

1. Create account at [sendgrid.com](https://sendgrid.com)
2. Generate API Key in Settings
3. **Update `.env`**:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxx...
   MAIL_FROM=iPay <noreply@ipay.local>
   ```

---

### Option 4: Mailtrap

#### Steps:

1. Create account at [mailtrap.io](https://mailtrap.io)
2. Go to Inbox → Integrations → Nodemailer
3. Copy SMTP credentials
4. **Update `.env`**:
   ```
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your-mailtrap-user
   SMTP_PASS=your-mailtrap-password
   MAIL_FROM=iPay <noreply@ipay.local>
   ```

---

## Testing the Setup

### 1. Test OTP Request:

```bash
curl -X POST http://localhost:5001/api/auth/signup/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "test@example.com",
    "password": "password123",
    "dateOfBirth": "2000-01-01",
    "gender": "Male",
    "accountType": "Savings"
  }'
```

### 2. Check Ethereal/Mailtrap Dashboard:

- View sent OTP emails in the service's dashboard
- Copy the OTP code

### 3. Verify OTP:

```bash
curl -X POST http://localhost:5001/api/auth/signup/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

---

## Environment Variables (.env)

```
# Required for email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=iPay <noreply@ipay.local>

# Optional
NODE_ENV=development
```

---

## Troubleshooting

### "SMTP is not configured" Warning

- This is normal in development if SMTP credentials are not set
- Emails will be logged to console instead
- To send real emails, configure SMTP credentials

### "Invalid credentials" Error

- Check that SMTP_USER and SMTP_PASS are correct
- For Gmail, ensure you used an App Password (not your regular password)
- For Ethereal, regenerate credentials

### Emails not arriving

- Check spam folder
- Verify SMTP_PORT matches your email service (usually 587 for TLS, 465 for SSL)
- Check server logs for error messages

---

## Production Checklist

- [ ] Use Gmail App Password or SendGrid/Mailtrap for production
- [ ] Store credentials securely in `.env`
- [ ] Never commit `.env` to Git
- [ ] Set `NODE_ENV=production`
- [ ] Test OTP verification flow
- [ ] Monitor email delivery logs
