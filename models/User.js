import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userStatsSchema = new mongoose.Schema(
  {
    totalAnswers: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastStudyDate: {
      type: Date,
      default: null,
    },
    dailyAttempts: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    ratingCounts: {
      again: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      easy: { type: Number, default: 0 },
    },
    importantQuestionsCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    stats: {
      type: userStatsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate current stats
userSchema.methods.getCurrentStats = async function () {
  const Question = mongoose.model("Question");
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // Get user's questions
  const userQuestions = await Question.find({ userId: this._id });

  // Calculate due questions
  const dueQuestions = userQuestions.filter(
    (q) => new Date(q.nextReview) <= now || q.rating === null
  );

  // Calculate important questions
  const importantQuestions = userQuestions.filter((q) => q.important);

  // Get daily attempts
  const todayAttempts = this.stats.dailyAttempts.get(today) || 0;
  const yesterdayAttempts = this.stats.dailyAttempts.get(yesterdayStr) || 0;
  const progressVsYesterday = todayAttempts - yesterdayAttempts;

  // Calculate retention rate
  const { again, hard, medium, easy } = this.stats.ratingCounts;
  const retentionRate =
    this.stats.totalAnswers > 0
      ? Math.round(
          ((medium + easy - hard - again) / this.stats.totalAnswers) * 100
        )
      : 0;

  return {
    dueToday: dueQuestions.length,
    dueOverall: dueQuestions.length,
    retention: retentionRate,
    progress: progressVsYesterday,
    importantCount: importantQuestions.length,
    totalQuestions: userQuestions.length,
  };
};

// Method to update stats after answering a question
userSchema.methods.updateStats = async function (rating) {
  const today = new Date().toDateString();

  // Update daily attempts
  const currentAttempts = this.stats.dailyAttempts.get(today) || 0;
  this.stats.dailyAttempts.set(today, currentAttempts + 1);

  // Update rating counts
  this.stats.ratingCounts[rating]++;
  this.stats.totalAnswers++;

  // Update last study date
  this.stats.lastStudyDate = new Date();

  await this.save();
};

export default mongoose.model("User", userSchema);
