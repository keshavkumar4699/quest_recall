import mongoose from "mongoose";

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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      default: null,
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

// Index for efficient queries
questionSchema.index({ userId: 1, nextReview: 1 });
questionSchema.index({ userId: 1, important: 1 });
questionSchema.index({ userId: 1, subject: 1 });

export default mongoose.model("Question", questionSchema);
