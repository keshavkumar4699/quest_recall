const mongoose = require("mongoose");
require("dotenv").config();

const Subject = require("../models/Subject");
const Question = require("../models/Question");

// Sample data based on the existing data.json
const seedData = {
  subjects: [
    {
      name: "Indian Freedom Struggle",
      icon: "🇮🇳",
      color: "#ff6b6b",
      topics: [],
    },
    {
      name: "Art and Culture",
      icon: "🎨",
      color: "#ff9ff3",
      topics: [],
    },
    {
      name: "Current Affairs",
      icon: "📰",
      color: "#54a0ff",
      topics: [{ name: "News" }],
    },
    {
      name: "Economics",
      icon: "💹",
      color: "#1dd1a1",
      topics: [
        { name: "Basics of Economics" },
        { name: "National Income" },
        { name: "Money" },
        { name: "Banking" },
      ],
    },
    {
      name: "Polity",
      icon: "🏛️",
      color: "#f368e0",
      topics: [
        { name: "Historical Background" },
        { name: "Making of the Constitution of India" },
        { name: "Salient Features" },
        { name: "Preamble" },
      ],
    },
  ],
  questions: {
    "Current Affairs": {
      News: [
        "What is the name of the AI app launched to preserve tribal languages? and which ministry launched it?",
        "Which technology will be used in Census 2027 for geo-tagging all buildings?",
        "What are the recent economic reforms introduced in India?",
      ],
    },
    Economics: {
      "Basics of Economics": [
        "What is the difference between microeconomics and macroeconomics?",
        "What do you understand by Primary, Secondary and Tertiary sectors of economy? Give examples.",
        "What is law of Supply and Demand?",
        "How Demand, Supply and Price are related to each other?",
      ],
      "National Income": [
        "What are factors of production?",
        "What does the factors of production get in return?",
        "What is the complete production process?",
        "What is GDP? Give its basic outline.",
      ],
      Money: [
        "Describe the flow of money in an economy.",
        "What is monetary policy?",
        "What does it mean to have tight and loose monetary policy?",
        "What are the effects of tight and loose monetary policy?",
      ],
      Banking: [
        "What is BFI? Give all of its types and subtypes.",
        "What is NBFC?",
        "What is AFI? Give examples.",
        "What are the types of BFI?",
      ],
    },
    Polity: {
      "Historical Background": [
        "what was the first step taken by the British to establish their control on East India Company? and when?",
        "What were the two main provisions of the Regulating Act of 1773?",
        "When was the Supreme Court of Calcutta established with how many judges?",
        "What was the other name of Act of 1781?",
      ],
      "Making of the Constitution of India": [
        "Who gave the idea of a Constituent Assembly for India and when?",
        "When was the demand for Constituent Assembly was raised by the Indian National Congress?",
        "What was idea for formation of Constituent Assembly given by Nehru?",
        "When was the Constituent Assembly for India demand was accepted by the British government and what was it named?",
      ],
      "Salient Features": [
        "How are three pillars of democracy are established through the constitution and how they are related to each other?",
        "How British Parliamentary system is different from Indian Parliamentary system?",
        "What is the other name of Parliamentary form of government?",
        "How Indian judiciary is different from American judiciary?",
      ],
      Preamble: [
        "What does the Preamble of the Constitution reflect?",
        "When was it amended and what was amended?",
        "What is meaning of word 'Sovereign' in the Preamble?",
        "What is meaning of word 'Socialist' in the Preamble? And when was it added?",
      ],
    },
  },
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Clear existing data
    await Subject.deleteMany({});
    await Question.deleteMany({});

    console.log("Cleared existing data");

    // Create subjects with topics
    const subjectMap = {};
    for (const subjectData of seedData.subjects) {
      const subject = new Subject(subjectData);
      await subject.save();
      subjectMap[subject.name] = subject._id;
      console.log(
        `Created subject: ${subject.name} with ${subject.topics.length} topics`
      );
    }

    // Create questions
    for (const [subjectName, subjectQuestions] of Object.entries(
      seedData.questions
    )) {
      const subjectId = subjectMap[subjectName];
      if (!subjectId) continue;

      for (const [topicName, questions] of Object.entries(subjectQuestions)) {
        for (const questionText of questions) {
          const question = new Question({
            text: questionText,
            subject: subjectId,
            subjectName: subjectName,
            topicName: topicName,
          });
          await question.save();
          console.log(`Created question for ${subjectName} - ${topicName}`);
        }
      }
    }

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
