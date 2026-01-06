const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true },
  email: { type: String, required: true }
});

const courseSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: false },
  is_available_for_subscription: { type: Boolean, required: true },
  picture: { type: String, required: false },
  price: { type: Number, required: true },
  year: { type: Number, required: true },
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true },
  first_free_video: { type: Boolean, required: true },
  subscriptions_count: { type: Number, required: true },
  deleted_at: { type: Date, default: null },
  is_deleted: { type: Boolean, required: true },
});

const checkoutSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },

  user: {
    type: userSchema,
    required: true
  },

  course: {
    type: courseSchema,
    required: true
  },

  paymentUrl: { type: String, required: true },
  isPaid: { type: Boolean, required: true },
  paymentMethodType: { type: String, required: true },

  createdAt: { type: Date, required: true }
});

module.exports = mongoose.model("Checkout", checkoutSchema);
