const jwt = require("jsonwebtoken");
exports.createAccessToken = user => jwt.sign(
  { id: String(user._id), role: user.role, email: user.email },
  process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" }
);
exports.createRefreshToken = user => jwt.sign(
  { id: String(user._id), tokenVersion: user.tokenVersion },
  process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" }
);
