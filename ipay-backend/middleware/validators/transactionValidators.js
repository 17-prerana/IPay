const { body } = require("express-validator");
const handleValidationErrors = require("./handleValidationErrors");

const validateTransfer = [
  body("receiverEmail")
    .notEmpty()
    .withMessage("Receiver is required")
    .isEmail()
    .withMessage("Invalid email"),

  body("amount")
    .exists({ values: "falsy" })
    .withMessage("Amount is required")
    .bail()
    .matches(/^[1-9]\d*$/)
    .withMessage("Amount must be a positive whole number"),

  handleValidationErrors
];

module.exports = {
  validateTransfer
};
