const mongoose = require("mongoose");
const attemptSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOptionId: { type: String, default: "" },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 }
  }],
  startedAt: { type: Date, required: true },
  submittedAt: { type: Date },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ["in_progress", "submitted", "auto_submitted"], default: "in_progress", index: true },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 }
}, { timestamps: true });
attemptSchema.index({ exam: 1, student: 1 }, { unique: true });
module.exports = mongoose.model("Attempt", attemptSchema);
