const mongoose = require("mongoose");

// -------------------- Transaction Schema --------------------
const transactionSchema = new mongoose.Schema({
  checkoutId: { type: mongoose.Schema.Types.ObjectId, required: true },
  courseId: { type: Number, required: true },
  amount: { type: Number, required: true },
  sessionId: { type: String, required: true },
  course: {
    _id: { type: mongoose.Schema.Types.ObjectId },
    id: { type: Number },
    name: { type: String },
    description: { type: String },
    is_available_for_subscription: { type: Boolean },
    picture: { type: String },
    price: { type: Number },
    year: { type: Number },
    created_at: { type: Date },
    updated_at: { type: Date },
    first_free_video: { type: Boolean },
    subscriptions_count: { type: Number },
    deleted_at: { type: Date, default: null },
    is_deleted: { type: Boolean, default: false }
  },
  date: { type: Date, default: Date.now },
  paymentMethodType: { type: String },
  status: { type: String, enum: ["paid", "pending"], default: "pending" }
});

const viewsSchema = new mongoose.Schema({
  courseId: { type: Number, required: true },
  sectionId: { type: Number, required: true },
  sectionableId: { type: Number, required: true },
  timewhatching: { type: Number },
  video: { type: {}, required: true }
});

const examsSchema = new mongoose.Schema({
  courseId: { type: Number, required: true },
  sectionId: { type: Number, required: true },
  sectionableId: { type: Number, required: true },
  examId: { type: Number, required: true },
  examType: { type: String, required: true },
  result: { type: Number, default: 0 },
  duration: { type: Number, required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  questions: { type: [], required: true },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
});

// -------------------- Student Schema --------------------
const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  studentNumber: { type: String, required: true },
  parentNumber: { type: String, required: true },
  userName: { type: String, required: true },
  rol: { type: String, default: "student" },
  city: { type: String },
  year: { type: Number },
  email: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  pendingPayments: { type: [], default: [] }, // مصفوفة الكورسات غير المدفوعة
  enrolledCourses: { type: [Number], default: [] }, // مصفوفة الكورسات المسجلة
  transactions: [transactionSchema],
  views: [viewsSchema],
  exams: [examsSchema]
});

module.exports = mongoose.model("Student", studentSchema);
