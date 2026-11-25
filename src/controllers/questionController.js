const Question = require("../models/Question");
const asyncHandler = require("../utils/asyncHandler");

exports.create = asyncHandler(async (req, res) => {
  const { text, options, correctOptionId, marks, subject, topic, difficulty } = req.body;
  if (!text || !Array.isArray(options) || !correctOptionId || !subject)
    return res.status(400).json({ success: false, message: "text, options, correctOptionId and subject are required" });
  if (!options.some(o => o.id === correctOptionId)) return res.status(400).json({ success: false, message: "Correct option must match one supplied option" });
  const question = await Question.create({ createdBy: req.user._id, text, options, correctOptionId, marks, subject, topic, difficulty });
  res.status(201).json({ success: true, data: { id: question._id, text: question.text, options: question.options, marks: question.marks, subject: question.subject } });
});
exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Number(req.query.limit) || 20);
  const filter = { createdBy: req.user.role === "admin" ? (req.query.createdBy || { $exists: true }) : req.user._id };
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.topic) filter.topic = req.query.topic;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  const [items, total] = await Promise.all([
    Question.find(filter).select("-correctOptionId").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Question.countDocuments(filter)
  ]);
  res.json({ success: true, data: items, pagination: { page, limit, total } });
});
exports.update = asyncHandler(async (req, res) => {
  const q = await Question.findOne({ _id: req.params.id, ...(req.user.role === "admin" ? {} : { createdBy: req.user._id }) }).select("+correctOptionId");
  if (!q) return res.status(404).json({ success: false, message: "Question not found" });
  Object.assign(q, req.body);
  if (q.options && !q.options.some(o => o.id === q.correctOptionId)) return res.status(400).json({ success: false, message: "Correct option must match an option" });
  await q.save();
  res.json({ success: true, message: "Question updated" });
});
exports.remove = asyncHandler(async (req, res) => {
  const q = await Question.findOneAndDelete({ _id: req.params.id, ...(req.user.role === "admin" ? {} : { createdBy: req.user._id }) });
  if (!q) return res.status(404).json({ success: false, message: "Question not found" });
  res.json({ success: true, message: "Question deleted" });
});
