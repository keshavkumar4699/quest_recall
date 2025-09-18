const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    topicName: {
      type: String,
      required: true,
      trim: true,
    },
    // SRS properties
    easeFactor: {
      type: Number,
      default: 2.5,
    },
    repetitions: {
      type: Number,
      default: 0,
    },
    interval: {
      type: Number,
      default: 1,
    },
    nextReview: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: String,
      enum: ["again", "hard", "medium", "easy"],
      default: undefined,  // Changed from null to undefined
    },
    important: {
      type: Boolean,
      default: false,
    },
    lastReviewed: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Question", questionSchema);