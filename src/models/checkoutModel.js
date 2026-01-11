const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

  course: { type: Number, required: true },
  
  priceBeforeDiscount: { type: Number, required: true },
  isDiscounted: { type: Boolean, required: true },
  codeDiscount: { type: String, required: true },
  priceAfterDiscount: { type: Number, required: true },

  paymentUrl: { type: String, required: true },
  isPaid: { type: Boolean, required: true },
  paymentMethodType: { type: String, required: true },

  createdAt: { type: Date, required: true }
});

module.exports = mongoose.model("Checkout", checkoutSchema);
