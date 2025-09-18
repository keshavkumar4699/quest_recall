const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Subject = require("../models/Subject");

// GET all questions with filters
router.get("/", async (req, res) => {
  try {
    const filter = {};
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
    res.status(500).json({ message: error.message });
  }
});

// GET single question
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate("subject");
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new question
router.post("/", async (req, res) => {
  try {
    // Get subject to validate and get subject name
    const subject = await Subject.findById(req.body.subject);
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
    });

    const newQuestion = await question.save();
    await newQuestion.populate("subject");
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE question
router.put("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update basic fields
    question.text = req.body.text || question.text;
    if (req.body.subject) {
      const subject = await Subject.findById(req.body.subject);
      if (subject) {
        question.subject = req.body.subject;
        question.subjectName = subject.name;
      }
    }
    question.topicName = req.body.topicName || question.topicName;
    question.important =
      req.body.important !== undefined
        ? req.body.important
        : question.important;

    const updatedQuestion = await question.save();
    await updatedQuestion.populate("subject");
    res.json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// RATE question (SRS update)
router.put("/:id/rate", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
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
    res.json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE question
router.delete("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
