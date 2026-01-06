const mongoose = require("mongoose");

const sectionableSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  sectionable_type: { type: String, required: true },
  sectionable_id: { type: Number, required: true },
  section_id: { type: Number, required: true },
  visible_from: { type: Date, required: true },
  visible_to: { type: Date, required: true },
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true },
  deleted_at: { type: Date, default: null },
  is_deleted: { type: Boolean, required: true },

  sectionable: {
    type: {
      id: { type: Number, required: true },
      name: { type: String, required: true },
      description: { type: String, required: false },
      source: { type: String, required: false },
      division_id: { type: Number, required: false },
      duration: { type: Number, required: false },
      question_quantity: { type: Number, required: false },
      view_limit: { type: Number, required: false },
      sectionable_type: { type: String, required: false },
      created_at: { type: Date, required: true },
      updated_at: { type: Date, required: true },
      deleted_at: { type: Date, default: null },
      is_deleted: { type: Boolean, required: true },
    },
    required: true,
  },
});

const sectionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: false },
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true },
  deleted_at: { type: Date, default: null },
  is_deleted: { type: Boolean, required: true },
  sectionables: { type: [sectionableSchema], required: true },
});

const courseSchema = new mongoose.Schema({
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
  sections: { type: [sectionSchema], required: true },
});

module.exports = mongoose.model("Course", courseSchema);
