const mongoose = require("mongoose");
const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  instructions: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true }],
  durationMinutes: { type: Number, required: true, min: 1, max: 600 },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true, index: true },
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  assignedSections: [{ type: String }],
  randomizeQuestions: { type: Boolean, default: false },
  resultsReleased: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });
examSchema.index({ startAt: 1, endAt: 1, isPublished: 1 });
module.exports = mongoose.model("Exam", examSchema);
