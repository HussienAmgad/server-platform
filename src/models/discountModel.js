const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
  code: { type: String, required: true },
  type: { type: String, enum: ["percentage", "mony"], default: "percentage" },
  value: { type: Number, required: true },
  permission: {
    scope: {
      type: String,
      enum: ["global", "courses", "years"],
      required: true,
    },
    courses: [{ type: Number }],
    years: [{ type: Number }],
  },
  limit: { type: Number },
  used: { type: [], default: [] },
  createdAt: { type: Date, required: true },
  expireDate: { type: Date },
  deletedAt: { type: Date },
});

module.exports = mongoose.model("Discount", discountSchema);
