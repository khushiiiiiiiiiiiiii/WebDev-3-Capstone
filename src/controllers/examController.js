const Exam = require("../models/Exam");
const Question = require("../models/Question");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const events = require("../events/appEvents");

exports.create = asyncHandler(async (req, res) => {
  const { title, instructions, questions, durationMinutes, startAt, endAt, assignedStudents, assignedSections, randomizeQuestions } = req.body;
  if (!title || !Array.isArray(questions) || !questions.length || !durationMinutes || !startAt || !endAt)
    return res.status(400).json({ success: false, message: "title, questions, durationMinutes, startAt and endAt are required" });
  if (new Date(endAt) <= new Date(startAt)) return res.status(400).json({ success: false, message: "endAt must be after startAt" });
  const validQuestions = await Question.countDocuments({ _id: { $in: questions }, ...(req.user.role === "admin" ? {} : { createdBy: req.user._id }) });
  if (validQuestions !== new Set(questions.map(String)).size) return res.status(400).json({ success: false, message: "One or more questions are invalid or not owned by you" });
  if (assignedStudents?.length) {
    const count = await User.countDocuments({ _id: { $in: assignedStudents }, role: "student", isActive: true });
    if (count !== new Set(assignedStudents.map(String)).size) return res.status(400).json({ success: false, message: "Invalid assigned student list" });
  }
  const exam = await Exam.create({ title, instructions, createdBy: req.user._id, questions, durationMinutes, startAt, endAt, assignedStudents, assignedSections, randomizeQuestions });
  events.emit("exam.created", { title: exam.title, examId: exam._id });
  const io = req.app.get("io");
  if (io) io.emit("exam:created", { examId: exam._id, title: exam.title, startAt: exam.startAt });
  res.status(201).json({ success: true, data: exam });
});
exports.list = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === "faculty") filter.createdBy = req.user._id;
  if (req.user.role === "student") {
    filter.isPublished = true;
    filter.$or = [{ assignedStudents: req.user._id }, { assignedSections: req.user.section }, { assignedStudents: { $size: 0 }, assignedSections: { $size: 0 } }];
  }
  const exams = await Exam.find(filter).select("-__v").populate("createdBy", "name").sort({ startAt: 1 });
  res.json({ success: true, data: exams });
});
exports.get = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate("questions", "text options marks subject topic");
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
  if (req.user.role === "student") {
    const assigned = exam.assignedStudents.some(id => String(id) === String(req.user._id)) ||
      exam.assignedSections.includes(req.user.section) ||
      (!exam.assignedStudents.length && !exam.assignedSections.length);
    if (!exam.isPublished || !assigned) return res.status(403).json({ success: false, message: "Exam not assigned to you" });
    // Never expose correctOptionId to student-facing requests.
  } else if (req.user.role === "faculty" && String(exam.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "Not your examination" });
  }
  res.json({ success: true, data: exam });
});
exports.update = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, ...(req.user.role === "admin" ? {} : { createdBy: req.user._id }) });
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
  ["title", "instructions", "durationMinutes", "startAt", "endAt", "assignedStudents", "assignedSections", "randomizeQuestions", "isPublished", "resultsReleased"].forEach(k => {
    if (req.body[k] !== undefined) exam[k] = req.body[k];
  });
  if (new Date(exam.endAt) <= new Date(exam.startAt)) return res.status(400).json({ success: false, message: "endAt must be after startAt" });
  await exam.save();
  if (exam.resultsReleased) {
    events.emit("result.published", { examId: exam._id });
    req.app.get("io")?.to(`exam:${exam._id}`).emit("result:released", { examId: exam._id });
  }
  res.json({ success: true, data: exam });
});
exports.remove = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndDelete({ _id: req.params.id, ...(req.user.role === "admin" ? {} : { createdBy: req.user._id }) });
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
  res.json({ success: true, message: "Exam deleted" });
});
