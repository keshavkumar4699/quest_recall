import express from "express";
import { connect } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Routes
import authRoutes from "./routes/auth.js";
import subjectsRoutes from "./routes/subjects.js";
import questionsRoutes from "./routes/questions.js";

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/questions", questionsRoutes);

// MongoDB connection
connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Handle 404 for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);
  res.status(500).json({
    message: "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Available routes:");
  console.log("  POST /api/auth/register - Register new user");
  console.log("  POST /api/auth/login - Login user");
  console.log("  GET  /api/auth/profile - Get user profile (protected)");
  console.log("  GET  /api/auth/stats - Get user stats (protected)");
  console.log("  PUT  /api/auth/password - Update password (protected)");
  console.log("  GET  /api/subjects - Get user subjects (protected)");
  console.log("  POST /api/subjects - Create subject (protected)");
  console.log("  PUT  /api/subjects/:id - Update subject (protected)");
  console.log("  DELETE /api/subjects/:id - Delete subject (protected)");
  console.log("  POST /api/subjects/:id/topics - Add topic (protected)");
  console.log(
    "  PUT  /api/subjects/:id/topics/:topicName - Update topic (protected)"
  );
  console.log(
    "  DELETE /api/subjects/:id/topics/:topicName - Delete topic (protected)"
  );
  console.log("  GET  /api/questions - Get user questions (protected)");
  console.log("  POST /api/questions - Create question (protected)");
  console.log("  PUT  /api/questions/:id - Update question (protected)");
  console.log("  PUT  /api/questions/:id/rate - Rate question (protected)");
  console.log("  DELETE /api/questions/:id - Delete question (protected)");
});
