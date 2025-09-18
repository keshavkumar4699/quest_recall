import express from "express";
import Question from "../models/Question.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET all questions with filters (user-specific)
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.userId };

    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.subjectName) filter.subjectName = req.query.subjectName;
    if (req.query.topicName) filter.topicName = req.query.topicName;
    if (req.query.topics) {
      // Support multiple topics selection
      const topicNames = req.query.topics.split(",");
      filter.topicName = { $in: topicNames };
    }
    if (req.query.important === "true") filter.important = true;
    if (req.query.due === "true") {
      filter.$or = [{ nextReview: { $lte: new Date() } }, { rating: null }];
    }

    const questions = await Question.find(filter)
      .populate("subject")
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET single question (user-specific)
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    }).populate("subject");

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(question);
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE new question (user-specific)
router.post("/", async (req, res) => {
  try {
    // Get subject to validate and get subject name (user-specific)
    const subject = await Subject.findOne({
      _id: req.body.subject,
      userId: req.user.userId,
    });

    if (!subject) {
      return res.status(400).json({ message: "Subject not found" });
    }

    // Validate topic exists in subject
    const topicExists = subject.topics.some(
      (t) => t.name === req.body.topicName
    );
    if (!topicExists) {
      return res.status(400).json({ message: "Topic not found in subject" });
    }

    const question = new Question({
      text: req.body.text,
      subject: req.body.subject,
      subjectName: subject.name,
      topicName: req.body.topicName,
      userId: req.user.userId,
    });

    const newQuestion = await question.save();
    await newQuestion.populate("subject");
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Create question error:", error);
    res.status(400).json({ message: error.message });
  }
});

// UPDATE question (user-specific)
router.put("/:id", async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update basic fields
    question.text = req.body.text || question.text;

    if (req.body.subject) {
      const subject = await Subject.findOne({
        _id: req.body.subject,
        userId: req.user.userId,
      });
      if (subject) {
        question.subject = req.body.subject;
        question.subjectName = subject.name;
      } else {
        return res.status(400).json({ message: "Subject not found" });
      }
    }

    question.topicName = req.body.topicName || question.topicName;
    question.important =
      req.body.important !== undefined
        ? req.body.important
        : question.important;

    // Update important count in user stats if changed
    if (
      req.body.important !== undefined &&
      req.body.important !== question.important
    ) {
      const user = await User.findById(req.user.userId);
      if (req.body.important) {
        user.stats.importantQuestionsCount++;
      } else {
        user.stats.importantQuestionsCount = Math.max(
          0,
          user.stats.importantQuestionsCount - 1
        );
      }
      await user.save();
    }

    const updatedQuestion = await question.save();
    await updatedQuestion.populate("subject");
    res.json(updatedQuestion);
  } catch (error) {
    console.error("Update question error:", error);
    res.status(400).json({ message: error.message });
  }
});

// RATE question (SRS update) - user-specific
router.put("/:id/rate", async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const { rating } = req.body;
    const now = new Date();

    // SRS intervals
    const intervals = {
      again: 1,
      hard: 3,
      medium: 7,
      easy: 14,
    };

    const daysToAdd = intervals[rating];
    const nextReview = new Date(
      now.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );

    // Update SRS properties
    let { easeFactor, repetitions } = question;

    if (rating === "easy" || rating === "medium") {
      repetitions++;
      if (rating === "easy") {
        easeFactor = Math.min(easeFactor + 0.1, 3.0);
      }
    } else {
      repetitions = 0;
      if (rating === "again") {
        easeFactor = Math.max(easeFactor - 0.2, 1.3);
      } else if (rating === "hard") {
        easeFactor = Math.max(easeFactor - 0.15, 1.3);
      }
    }

    question.easeFactor = easeFactor;
    question.repetitions = repetitions;
    question.interval = daysToAdd;
    question.nextReview = nextReview;
    question.rating = rating;
    question.lastReviewed = now;

    const updatedQuestion = await question.save();
    await updatedQuestion.populate("subject");

    // Update user stats
    const user = await User.findById(req.user.userId);
    await user.updateStats(rating);

    res.json(updatedQuestion);
  } catch (error) {
    console.error("Rate question error:", error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE question (user-specific)
router.delete("/:id", async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update user stats if it was important
    if (question.important) {
      const user = await User.findById(req.user.userId);
      user.stats.importantQuestionsCount = Math.max(
        0,
        user.stats.importantQuestionsCount - 1
      );
      await user.save();
    }

    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
