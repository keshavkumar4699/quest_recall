import express from "express";
import Subject from "../models/Subject.js";
import Question from "../models/Question.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET all subjects (user-specific)
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(subjects);
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET single subject (user-specific)
router.get("/:id", async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json(subject);
  } catch (error) {
    console.error("Get subject error:", error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE new subject (user-specific)
router.post("/", async (req, res) => {
  try {
    // Check if subject name already exists for this user
    const existingSubject = await Subject.findOne({
      name: req.body.name,
      userId: req.user.userId,
    });

    if (existingSubject) {
      return res
        .status(400)
        .json({ message: "Subject with this name already exists" });
    }

    const subject = new Subject({
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
      topics: req.body.topics || [],
      userId: req.user.userId,
    });

    const newSubject = await subject.save();
    res.status(201).json(newSubject);
  } catch (error) {
    console.error("Create subject error:", error);
    res.status(400).json({ message: error.message });
  }
});

// ADD topic to subject (user-specific)
router.post("/:id/topics", async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

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
    console.error("Add topic error:", error);
    res.status(400).json({ message: error.message });
  }
});

// UPDATE topic in subject (user-specific)
router.put("/:id/topics/:topicName", async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const topicIndex = subject.topics.findIndex(
      (t) => t.name === req.params.topicName
    );
    if (topicIndex === -1) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // Check if new name already exists (if changing name)
    if (req.body.name && req.body.name !== req.params.topicName) {
      const existingTopic = subject.topics.find(
        (t) => t.name === req.body.name
      );
      if (existingTopic) {
        return res
          .status(400)
          .json({ message: "Topic with this name already exists" });
      }

      // Update all questions with this topic name
      await Question.updateMany(
        {
          subject: subject._id,
          topicName: req.params.topicName,
          userId: req.user.userId,
        },
        { topicName: req.body.name }
      );
    }

    subject.topics[topicIndex].name =
      req.body.name || subject.topics[topicIndex].name;
    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    console.error("Update topic error:", error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE topic from subject (user-specific)
router.delete("/:id/topics/:topicName", async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const topicIndex = subject.topics.findIndex(
      (t) => t.name === req.params.topicName
    );
    if (topicIndex === -1) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // Check if there are questions using this topic
    const questionsCount = await Question.countDocuments({
      subject: subject._id,
      topicName: req.params.topicName,
      userId: req.user.userId,
    });

    if (questionsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete topic. It has ${questionsCount} questions. Please move or delete the questions first.`,
      });
    }

    subject.topics.splice(topicIndex, 1);
    const updatedSubject = await subject.save();
    res.json({
      message: "Topic deleted successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error("Delete topic error:", error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE subject (user-specific)
router.put("/:id", async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if new name already exists (if changing name)
    if (req.body.name && req.body.name !== subject.name) {
      const existingSubject = await Subject.findOne({
        name: req.body.name,
        userId: req.user.userId,
        _id: { $ne: req.params.id },
      });

      if (existingSubject) {
        return res
          .status(400)
          .json({ message: "Subject with this name already exists" });
      }

      // Update all questions with this subject name
      await Question.updateMany(
        { subject: subject._id, userId: req.user.userId },
        { subjectName: req.body.name }
      );
    }

    subject.name = req.body.name || subject.name;
    subject.icon = req.body.icon || subject.icon;
    subject.color = req.body.color || subject.color;
    if (req.body.topics) subject.topics = req.body.topics;

    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    console.error("Update subject error:", error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE subject (user-specific)
router.delete("/:id", async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if there are questions using this subject
    const questionsCount = await Question.countDocuments({
      subject: req.params.id,
      userId: req.user.userId,
    });

    if (questionsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete subject. It has ${questionsCount} questions. Please delete the questions first.`,
      });
    }

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Delete subject error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
