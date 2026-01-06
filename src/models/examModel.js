const mongoose = require("mongoose");

// -------------------- Question Schema --------------------
const questionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  picture: { type: String, default: null },
  correct_answer: { type: String, required: true },
  answers: { type: [String], required: true }
});

// -------------------- Exam Schema --------------------
const examSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  courseid: { type: Number, required: true },
  weekid: { type: Number, required: true },
  sectionable_type: { type: String, required: true },
  sectionable_id: { type: Number, required: true },
  question_quantity: { type: Number, required: true },
  duration: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  questions: { type: [questionSchema], required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
  isdeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model("Exam", examSchema);
