const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { createAccessToken, createRefreshToken } = require("../utils/tokens");

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, section } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: "name, email and password are required" });
  if (password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ success: false, message: "Email already registered" });
  // Public registration can only create student accounts. Admins create faculty/admin accounts.
  const user = await User.create({ name, email, password, section, role: "student" });
  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
});
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.isActive || !(await user.comparePassword(password || "")))
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  res.json({ success: true, accessToken: createAccessToken(user), refreshToken: createRefreshToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: "refreshToken is required" });
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || decoded.tokenVersion !== user.tokenVersion) return res.status(401).json({ success: false, message: "Refresh token revoked" });
  res.json({ success: true, accessToken: createAccessToken(user), refreshToken: createRefreshToken(user) });
});
exports.logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  res.json({ success: true, message: "Logged out; refresh tokens invalidated" });
});
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, section: req.user.section } });
});
