const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const asyncHandler = require("../utils/asyncHandler");

async function getEligibleExam(examId, student) {
  const exam = await Exam.findById(examId).populate("questions");
  if (!exam) return { error: [404, "Exam not found"] };
  const assigned = exam.assignedStudents.some(id => String(id) === String(student._id)) ||
    exam.assignedSections.includes(student.section) ||
    (!exam.assignedStudents.length && !exam.assignedSections.length);
  if (!exam.isPublished || !assigned) return { error: [403, "Exam is not assigned to you"] };
  return { exam };
}
exports.start = asyncHandler(async (req, res) => {
  const eligibility = await getEligibleExam(req.params.examId, req.user);
  if (eligibility.error) return res.status(eligibility.error[0]).json({ success: false, message: eligibility.error[1] });
  const { exam } = eligibility;
  const now = new Date();
  if (now < exam.startAt || now > exam.endAt) return res.status(400).json({ success: false, message: "Exam is outside its permitted window" });
  const existing = await Attempt.findOne({ exam: exam._id, student: req.user._id });
  if (existing) return res.status(409).json({ success: false, message: "An attempt already exists" });
  const expiresAt = new Date(Math.min(now.getTime() + exam.durationMinutes * 60000, exam.endAt.getTime()));
  const attempt = await Attempt.create({
    exam: exam._id, student: req.user._id, startedAt: now, expiresAt,
    totalMarks: exam.questions.reduce((sum, q) => sum + q.marks, 0)
  });
  let questions = exam.questions;
  if (exam.randomizeQuestions) questions = [...questions].sort(() => Math.random() - 0.5);
  res.status(201).json({ success: true, data: { attemptId: attempt._id, expiresAt, questions: questions.map(q => ({
    id: q._id, text: q.text, options: q.options, marks: q.marks, subject: q.subject, topic: q.topic
  })) } });
});
exports.saveAnswers = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id, status: "in_progress" });
  if (!attempt) return res.status(404).json({ success: false, message: "Active attempt not found" });
  if (new Date() > attempt.expiresAt) return res.status(400).json({ success: false, message: "Attempt time has expired; submit the attempt" });
  if (!Array.isArray(req.body.answers)) return res.status(400).json({ success: false, message: "answers must be an array" });
  const exam = await Exam.findById(attempt.exam);
  const allowed = new Set(exam.questions.map(String));
  for (const a of req.body.answers) {
    if (!allowed.has(String(a.question))) return res.status(400).json({ success: false, message: "Answer contains a question not in this exam" });
    const q = await Question.findById(a.question);
    if (!q || !q.options.some(o => o.id === a.selectedOptionId)) return res.status(400).json({ success: false, message: "Invalid question or option" });
    const existing = attempt.answers.find(x => String(x.question) === String(a.question));
    if (existing) existing.selectedOptionId = a.selectedOptionId;
    else attempt.answers.push({ question: a.question, selectedOptionId: a.selectedOptionId });
  }
  await attempt.save();
  res.json({ success: true, message: "Answers saved" });
});
exports.submit = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id, status: "in_progress" });
  if (!attempt) return res.status(404).json({ success: false, message: "Active attempt not found" });
  const now = new Date();
  const exam = await Exam.findById(attempt.exam);
  if (now > attempt.expiresAt) attempt.status = "auto_submitted";
  else attempt.status = "submitted";
  let score = 0;
  for (const answer of attempt.answers) {
    const q = await Question.findById(answer.question).select("+correctOptionId");
    answer.isCorrect = Boolean(q && q.correctOptionId === answer.selectedOptionId);
    answer.marksAwarded = answer.isCorrect ? q.marks : 0;
    score += answer.marksAwarded;
  }
  attempt.score = score;
  attempt.submittedAt = now;
  await attempt.save();
  req.app.get("io")?.to(`exam:${exam._id}`).emit("exam:submission", { examId: exam._id, studentId: req.user._id, status: attempt.status });
  res.json({ success: true, data: { attemptId: attempt._id, status: attempt.status, submittedAt: now, message: "Submission received" } });
});
exports.myResults = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({ student: req.user._id }).populate("exam", "title resultsReleased");
  const data = attempts.map(a => ({
    attemptId: a._id, exam: a.exam?.title, status: a.status,
    ...(a.exam?.resultsReleased ? { score: a.score, totalMarks: a.totalMarks, percentage: a.totalMarks ? Math.round(a.score / a.totalMarks * 10000) / 100 : 0 } : { result: "Not released yet" })
  }));
  res.json({ success: true, data });
});
