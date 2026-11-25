const mongoose = require("mongoose");
const questionSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  options: {
    type: [{ id: { type: String, required: true }, text: { type: String, required: true } }],
    validate: v => v.length >= 2 && v.length <= 6
  },
  correctOptionId: { type: String, required: true, select: false },
  marks: { type: Number, required: true, min: 1, default: 1 },
  subject: { type: String, required: true, index: true },
  topic: { type: String, default: "" },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium", index: true }
}, { timestamps: true });
questionSchema.index({ subject: 1, difficulty: 1 });
module.exports = mongoose.model("Question", questionSchema);
