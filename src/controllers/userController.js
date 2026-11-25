const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.section) filter.section = req.query.section;
  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role, section } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ success: false, message: "name, email, password and role required" });
  if (!["admin", "faculty", "student"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role" });
  const user = await User.create({ name, email, password, role, section });
  res.status(201).json({ success: true, data: { id: user._id, name, email, role, section } });
});
exports.update = asyncHandler(async (req, res) => {
  const allowed = {};
  ["name", "section", "isActive"].forEach(k => { if (req.body[k] !== undefined) allowed[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true }).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});
exports.remove = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, message: "User deleted" });
});
