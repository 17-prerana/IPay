const { body } = require("express-validator");
const handleValidationErrors = require("./handleValidationErrors");

const validateSignup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .bail()
    .isISO8601()
    .withMessage("Valid date of birth is required")
    .bail()
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const minimumBirthDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );

      return birthDate <= minimumBirthDate;
    })
    .withMessage("User must be at least 18 years old"),
  body("gender")
    .optional({ values: "falsy" })
    .isIn(["Male", "Female", "Other", "Prefer not to say"])
    .withMessage("Invalid gender"),
  body("accountType")
    .optional({ values: "falsy" })
    .isIn(["Savings", "Current", "Student"])
    .withMessage("Invalid account type"),
  body("bankName")
    .notEmpty()
    .withMessage("Bank name is required")
    .bail()
    .isIn(["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra Bank", "PNB", "Other"])
    .withMessage("Invalid bank name"),
  body("accountNumber")
    .trim()
    .matches(/^\d{9,18}$/)
    .withMessage("Account number must be 9 to 18 digits"),
  handleValidationErrors
];

const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors
];

const validateOtpVerification = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("otp")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Valid OTP is required"),
  handleValidationErrors
];

const validatePasswordResetRequest = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  handleValidationErrors
];

const validatePasswordReset = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("otp")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Valid OTP is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  handleValidationErrors
];

const validateProfileUpdate = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),
  body("gender")
    .optional({ values: "falsy" })
    .isIn(["Male", "Female", "Other", "Prefer not to say"])
    .withMessage("Invalid gender"),
  body("accountType")
    .optional({ values: "falsy" })
    .isIn(["Savings", "Current", "Student"])
    .withMessage("Invalid account type"),
  body("bankName")
    .notEmpty()
    .withMessage("Bank name is required")
    .bail()
    .isIn(["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra Bank", "PNB", "Other"])
    .withMessage("Invalid bank name"),
  body("accountNumber")
    .trim()
    .matches(/^\d{9,18}$/)
    .withMessage("Account number must be 9 to 18 digits"),
  handleValidationErrors
];

module.exports = {
  validateSignup,
  validateLogin,
  validateOtpVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateProfileUpdate
};
