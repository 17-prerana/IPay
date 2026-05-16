const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200
    ? res.statusCode
    : 500;

  logger.error("Request failed", {
    message: err.message,
    stack: err.stack,
    statusCode,
    method: req.method,
    path: req.originalUrl,
    userId: req.user
  });

  res.status(statusCode).json({
    msg: err.message || "Server Error"
  });
};

module.exports = errorHandler;
