const Attempt = require("../models/Attempt");
const asyncHandler = require("../utils/asyncHandler");

// Pipeline 1: exam-wise average, highest and lowest marks.
exports.examSummary = asyncHandler(async (req, res) => {
  const data = await Attempt.aggregate([
    { $match: { status: { $in: ["submitted", "auto_submitted"] }, ...(req.query.examId ? { exam: require("mongoose").Types.ObjectId.createFromHexString(req.query.examId) } : {}) } },
    { $group: { _id: "$exam", attempts: { $sum: 1 }, averageScore: { $avg: "$score" }, highestScore: { $max: "$score" }, lowestScore: { $min: "$score" } } },
    { $lookup: { from: "exams", localField: "_id", foreignField: "_id", as: "exam" } },
    { $unwind: "$exam" },
    { $project: { examTitle: "$exam.title", attempts: 1, averageScore: { $round: ["$averageScore", 2] }, highestScore: 1, lowestScore: 1 } }
  ]);
  res.json({ success: true, data });
});

// Pipeline 2: student-wise score summary / leaderboard.
exports.studentPerformance = asyncHandler(async (req, res) => {
  const data = await Attempt.aggregate([
    { $match: { status: { $in: ["submitted", "auto_submitted"] }, ...(req.query.examId ? { exam: require("mongoose").Types.ObjectId.createFromHexString(req.query.examId) } : {}) } },
    { $group: { _id: "$student", examsAttempted: { $sum: 1 }, totalScore: { $sum: "$score" }, averageScore: { $avg: "$score" } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "student" } },
    { $unwind: "$student" },
    { $project: { name: "$student.name", email: "$student.email", examsAttempted: 1, totalScore: 1, averageScore: { $round: ["$averageScore", 2] } } },
    { $sort: { averageScore: -1 } }
  ]);
  res.json({ success: true, data });
});
