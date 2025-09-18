const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const Question = require("../models/Question");

// GET all subjects
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single subject
router.get("/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new subject
router.post("/", async (req, res) => {
  try {
    const subject = new Subject({
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
      topics: req.body.topics || [],
    });

    const newSubject = await subject.save();
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ADD topic to subject
router.post("/:id/topics", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if topic already exists
    const existingTopic = subject.topics.find((t) => t.name === req.body.name);
    if (existingTopic) {
      return res.status(400).json({ message: "Topic already exists" });
    }

    subject.topics.push({ name: req.body.name });
    const updatedSubject = await subject.save();
    res.status(201).json(updatedSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE subject
router.put("/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    subject.name = req.body.name || subject.name;
    subject.icon = req.body.icon || subject.icon;
    subject.color = req.body.color || subject.color;
    if (req.body.topics) subject.topics = req.body.topics;

    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE subject
router.delete("/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Delete all related questions
    await Question.deleteMany({ subject: req.params.id });

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
