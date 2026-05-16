const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    logger.warn("Missing auth token", {
      method: req.method,
      path: req.originalUrl
    });
    return res.status(401).json({ msg: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    logger.warn("Invalid auth token", {
      method: req.method,
      path: req.originalUrl
    });
    res.status(401).json({ msg: "Invalid token" });
  }
};
