// QuestRecall - Spaced Repetition Learning App
class QuestRecallApp {
  constructor() {
    this.questions = [];
    this.subjects = {};
    this.currentFilter = null;
    this.isRandomized = false;
    this.stats = this.loadStats();
    this.currentQuestionId = null;
    this.showingImportant = false;
    this.init();
  }

  // Initialize the app
  async init() {
    try {
      await this.loadSubjectsData();
      this.generateQuestions();
      this.loadQuestionStates();
      this.renderHome();
      this.renderSubjects();
      this.updateStats();
      this.bindEvents();
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }

  // Load subjects data from JSON or use embedded data
  async loadSubjectsData() {
    try {
      const response = await fetch("data.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.subjects) {
        throw new Error("Invalid data structure: missing subjects property");
      }

      this.subjects = data.subjects;
      console.log("Successfully loaded data from data.json");
      return true;
    } catch (error) {
      console.error("Error loading data.json:", error);

      // Fallback to embedded data
      this.subjects = {
        indianFreedomStruggle: {
          name: "Indian Freedom Struggle",
          icon: "🇮🇳",
          color: "#ff6b6b",
          topics: {
            preIndependence: {
              name: "Pre-Independence Era",
              questions: [
                "What were the main causes of the Indian Rebellion of 1857?",
                "Describe the role of the Indian National Congress in the freedom struggle",
                "Explain the significance of the Partition of Bengal in 1905",
                "What was the impact of World War I on India's freedom movement?",
              ],
            },
          },
        },
      };
      console.log("Using embedded data instead");
      return false;
    }
  }

  // Generate questions from subjects data
  generateQuestions() {
    this.questions = [];
    let questionId = 0;

    Object.entries(this.subjects).forEach(([subjectKey, subject]) => {
      Object.entries(subject.topics).forEach(([topicKey, topic]) => {
        topic.questions.forEach((questionText) => {
          this.questions.push({
            id: questionId++,
            text: questionText,
            subject: subject.name,
            subjectKey: subjectKey,
            topic: topic.name,
            topicKey: topicKey,
            // SRS properties
            easeFactor: 2.5,
            repetitions: 0,
            interval: 1,
            nextReview: new Date(), // New questions are due immediately
            rating: null, // null = never attempted
            important: false,
            lastReviewed: null,
            createdAt: new Date(),
          });
        });
      });
    });
  }

  // FIXED: Proper Spaced Repetition System logic
  calculateNextReview(question, rating) {
    const now = new Date();

    // SRS intervals as specified
    const intervals = {
      again: 0.15, // 3-4 hours (0.15 days = 3.6 hours)
      hard: 1, // 1 day
      medium: 2, // 2 days
      easy: 4, // 4 days
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

    return {
      easeFactor,
      repetitions,
      interval: daysToAdd,
      nextReview,
      rating,
      lastReviewed: now,
    };
  }

  // Load question states from localStorage
  loadQuestionStates() {
    const saved = localStorage.getItem("questRecallQuestions");
    if (saved) {
      const savedStates = JSON.parse(saved);
      this.questions.forEach((question) => {
        const savedState = savedStates[question.id];
        if (savedState) {
          Object.assign(question, {
            ...savedState,
            nextReview: new Date(savedState.nextReview),
            lastReviewed: savedState.lastReviewed
              ? new Date(savedState.lastReviewed)
              : null,
            createdAt: new Date(savedState.createdAt),
          });
        }
      });
    }
  }

  // Save question states to localStorage
  saveQuestionStates() {
    const states = {};
    this.questions.forEach((question) => {
      states[question.id] = {
        easeFactor: question.easeFactor,
        repetitions: question.repetitions,
        interval: question.interval,
        nextReview: question.nextReview,
        rating: question.rating,
        important: question.important,
        lastReviewed: question.lastReviewed,
        createdAt: question.createdAt,
      };
    });
    localStorage.setItem("questRecallQuestions", JSON.stringify(states));
  }

  // FIXED: Load stats with proper initialization and rating counts
  loadStats() {
    const saved = localStorage.getItem("questRecallStats");
    if (saved) {
      const stats = JSON.parse(saved);
      if (stats.lastStudyDate) {
        stats.lastStudyDate = new Date(stats.lastStudyDate);
      }

      // Initialize all required properties
      if (!stats.dailyAttempts) stats.dailyAttempts = {};
      if (!stats.ratingCounts)
        stats.ratingCounts = { again: 0, hard: 0, medium: 0, easy: 0 };
      if (typeof stats.streak === "undefined") stats.streak = 0;
      if (typeof stats.totalAnswers === "undefined") stats.totalAnswers = 0;

      return stats;
    }
    return {
      streak: 0,
      totalAnswers: 0,
      lastStudyDate: null,
      dailyAttempts: {},
      ratingCounts: { again: 0, hard: 0, medium: 0, easy: 0 },
    };
  }

  // Save stats to localStorage
  saveStats() {
    localStorage.setItem("questRecallStats", JSON.stringify(this.stats));
  }

  // FIXED: Get questions due today (based on SRS nextReview date)
  getDueQuestions() {
    const now = new Date();
    return this.questions.filter((q) => {
      if (this.currentFilter && q.subjectKey !== this.currentFilter) {
        return false;
      }
      // Include questions due today (including never attempted)
      return q.nextReview <= now || q.rating === null;
    });
  }

  // FIXED: Get ALL due questions (overdue + today + never attempted)
  getAllDueQuestions() {
    const now = new Date();
    return this.questions.filter((q) => {
      if (this.currentFilter && q.subjectKey !== this.currentFilter) {
        return false;
      }
      // Include questions that are due (including never attempted and overdue)
      return q.nextReview <= now || q.rating === null;
    });
  }

  // Get important questions
  getImportantQuestions() {
    return this.questions.filter((q) => {
      if (this.currentFilter && q.subjectKey !== this.currentFilter) {
        return false;
      }
      return q.important;
    });
  }

  // Get practice questions (only Again and Hard)
  getPracticeQuestions() {
    return this.questions.filter((q) => {
      if (this.currentFilter && q.subjectKey !== this.currentFilter) {
        return false;
      }
      return q.rating === "again" || q.rating === "hard";
    });
  }

  // Get questions grouped by rating
  getQuestionsByRating() {
    const dueQuestions = this.getDueQuestions();
    const groups = {
      again: [],
      hard: [],
      medium: [],
      easy: [],
    };

    dueQuestions.forEach((q) => {
      const rating = q.rating || "again"; // Default to 'again' for new questions
      if (groups[rating]) {
        groups[rating].push(q);
      }
    });

    // Sort by importance (important questions first)
    Object.keys(groups).forEach((rating) => {
      groups[rating].sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return 0;
      });

      // Randomize if enabled
      if (this.isRandomized) {
        this.shuffleArray(groups[rating]);
      }
    });

    return groups;
  }

  // Shuffle array (Fisher-Yates algorithm)
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // COMPLETELY FIXED: Update statistics with correct calculations
  updateStats() {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // Ensure today's attempts are tracked
    if (!this.stats.dailyAttempts[today]) {
      this.stats.dailyAttempts[today] = 0;
    }

    // Calculate stats according to requirements
    // Due Today: Questions that need to be attempted today (including never attempted)
    const cardsDueToday = this.getDueQuestions().length;

    // Due Overall: Total questions that are due (overdue + today + never attempted)
    const dueQuestionsOverall = this.getAllDueQuestions().length;

    // Progress: How many questions attempted MORE than yesterday
    const todayAttempts = this.stats.dailyAttempts[today] || 0;
    const yesterdayAttempts = this.stats.dailyAttempts[yesterdayStr] || 0;
    const progressVsYesterday = todayAttempts - yesterdayAttempts;

    // Retention: (medium + easy - hard - again) / total_attempted * 100
    const { again, hard, medium, easy } = this.stats.ratingCounts;
    const retentionRate =
      this.stats.totalAnswers > 0
        ? Math.round(
            ((medium + easy - hard - again) / this.stats.totalAnswers) * 100
          )
        : 0;

    // Update UI elements
    const cardsDueTodayEl = document.getElementById("cardsDueToday");
    const dueOverallEl = document.getElementById("dueOverall");
    const retentionEl = document.getElementById("retention");
    const progressEl = document.getElementById("progress");

    console.log("Stats Debug:", {
      cardsDueToday,
      dueQuestionsOverall,
      retentionRate,
      progressVsYesterday,
      todayAttempts,
      yesterdayAttempts,
      ratingCounts: this.stats.ratingCounts,
      totalAnswers: this.stats.totalAnswers,
    });

    // Update UI with proper values
    if (cardsDueTodayEl) cardsDueTodayEl.textContent = cardsDueToday;
    if (dueOverallEl) dueOverallEl.textContent = dueQuestionsOverall;
    if (retentionEl) retentionEl.textContent = retentionRate + "%";
    if (progressEl) {
      progressEl.textContent =
        progressVsYesterday >= 0
          ? "+" + progressVsYesterday
          : progressVsYesterday.toString();
    }

    this.saveStats();
  }

  // Render home page
  renderHome() {
    const container = document.getElementById("questionsContainer");
    const noQuestions = document.getElementById("noQuestions");
    const currentSubjectText = document.getElementById("currentSubjectText");
    const clearFilter = document.getElementById("clearFilter");

    // Update current subject display
    if (this.currentFilter) {
      if (currentSubjectText) {
        currentSubjectText.textContent = this.subjects[this.currentFilter].name;
      }
      if (clearFilter) {
        clearFilter.classList.remove("hidden");
      }
    } else {
      if (currentSubjectText) {
        currentSubjectText.textContent = "All Subjects";
      }
      if (clearFilter) {
        clearFilter.classList.add("hidden");
      }
    }

    const questionGroups = this.getQuestionsByRating();
    const totalDue = Object.values(questionGroups).reduce(
      (sum, group) => sum + group.length,
      0
    );

    if (totalDue === 0) {
      if (container) container.innerHTML = "";
      if (noQuestions) noQuestions.classList.remove("hidden");
      return;
    }

    if (noQuestions) noQuestions.classList.add("hidden");
    if (container) container.innerHTML = "";

    // Render questions by rating priority
    const ratingOrder = ["again", "hard", "medium", "easy"];
    ratingOrder.forEach((rating) => {
      if (questionGroups[rating].length > 0) {
        questionGroups[rating].forEach((question) => {
          const card = this.createQuestionCard(question);
          if (container) container.appendChild(card);
        });
      }
    });
  }

  // Render important questions page
  renderImportantQuestions() {
    const container = document.getElementById("importantQuestionsContainer");
    const noQuestions = document.getElementById("noImportantQuestions");

    const importantQuestions = this.getImportantQuestions();

    if (importantQuestions.length === 0) {
      if (container) container.innerHTML = "";
      if (noQuestions) noQuestions.classList.remove("hidden");
      return;
    }

    if (noQuestions) noQuestions.classList.add("hidden");
    if (container) container.innerHTML = "";

    importantQuestions.forEach((question) => {
      const card = this.createQuestionCard(question);
      if (container) container.appendChild(card);
    });
  }

  // Create question card element
  createQuestionCard(question) {
    const card = document.createElement("div");
    const rating = question.rating || "again";
    card.className = `question-card rating-${rating}`;
    card.dataset.questionId = question.id;

    card.innerHTML = `
            <div class="question-header">
                <span class="subject-badge">${question.subject}</span>
                <button class="star-btn ${
                  question.important ? "important" : ""
                }"
                        data-question-id="${question.id}">
                    ${question.important ? "⭐" : "☆"}
                </button>
            </div>
            <div class="question-text">${question.text}</div>
            <div class="rating-buttons">
                <button class="rating-btn rating-again" data-rating="again" data-question-id="${
                  question.id
                }">
                    Again<br><span class="rating-time">3-4 hours</span>
                </button>
                <button class="rating-btn rating-hard" data-rating="hard" data-question-id="${
                  question.id
                }">
                    Hard<br><span class="rating-time">1 day</span>
                </button>
                <button class="rating-btn rating-medium" data-rating="medium" data-question-id="${
                  question.id
                }">
                    Medium<br><span class="rating-time">2 days</span>
                </button>
                <button class="rating-btn rating-easy" data-rating="easy" data-question-id="${
                  question.id
                }">
                    Easy<br><span class="rating-time">4 days</span>
                </button>
            </div>
        `;

    // Add click handler for the card
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".rating-btn") && !e.target.closest(".star-btn")) {
        this.showQuestionModal(question);
      }
    });

    return card;
  }

  // Show question in modal
  showQuestionModal(question) {
    this.currentQuestionId = question.id;

    const modal = document.getElementById("ratingModal");
    const modalSubject = document.getElementById("modalSubject");
    const modalQuestion = document.getElementById("modalQuestion");
    const modalStarBtn = document.getElementById("modalStarBtn");

    if (modalSubject) modalSubject.textContent = question.subject;
    if (modalQuestion) modalQuestion.textContent = question.text;
    if (modalStarBtn) {
      modalStarBtn.className = `star-btn ${
        question.important ? "important" : ""
      }`;
      modalStarBtn.dataset.questionId = question.id;
    }

    if (modal) modal.classList.remove("hidden");
  }

  // Hide question modal
  hideQuestionModal() {
    const modal = document.getElementById("ratingModal");
    if (modal) modal.classList.add("hidden");
    this.currentQuestionId = null;
  }

  // FIXED: Rate question with proper stats tracking
  rateQuestion(questionId, rating) {
    const question = this.questions.find((q) => q.id === questionId);
    if (!question) return;

    console.log(`Rating question ${questionId} as ${rating}`);

    // Calculate next review using SRS
    const srsData = this.calculateNextReview(question, rating);
    Object.assign(question, srsData);

    // FIXED: Update statistics properly
    const today = new Date().toDateString();

    // Update daily attempts
    if (!this.stats.dailyAttempts[today]) {
      this.stats.dailyAttempts[today] = 0;
    }
    this.stats.dailyAttempts[today]++;

    // FIXED: Track rating counts for retention calculation
    this.stats.ratingCounts[rating]++;
    this.stats.totalAnswers++;

    console.log("Updated stats:", {
      dailyAttempts: this.stats.dailyAttempts[today],
      totalAnswers: this.stats.totalAnswers,
      ratingCounts: this.stats.ratingCounts,
    });

    // Animate card out
    const card = document.querySelector(`[data-question-id="${questionId}"]`);
    if (card && card.classList.contains("question-card")) {
      card.classList.add("animating-out");
      setTimeout(() => {
        if (this.showingImportant) {
          this.renderImportantQuestions();
        } else {
          this.renderHome();
        }
        this.updateStats();
      }, 600);
    } else {
      if (this.showingImportant) {
        this.renderImportantQuestions();
      } else {
        this.renderHome();
      }
      this.updateStats();
    }

    // Hide modal if open
    this.hideQuestionModal();

    // Save data
    this.saveQuestionStates();
    this.saveStats();
  }

  // Toggle important status
  toggleImportant(questionId) {
    const question = this.questions.find((q) => q.id === questionId);
    if (question) {
      question.important = !question.important;
      this.saveQuestionStates();

      // Update star button immediately
      const starBtns = document.querySelectorAll(
        `[data-question-id="${questionId}"].star-btn`
      );
      starBtns.forEach((btn) => {
        if (question.important) {
          btn.classList.add("important");
          btn.textContent = "⭐";
        } else {
          btn.classList.remove("important");
          btn.textContent = "☆";
        }
      });

      // Update display if showing important questions
      if (this.showingImportant) {
        setTimeout(() => this.renderImportantQuestions(), 100);
      }
    }
  }

  // Render subjects page
  renderSubjects() {
    const container = document.getElementById("subjectsGrid");
    if (!container) return;

    container.innerHTML = "";

    Object.entries(this.subjects).forEach(([key, subject]) => {
      const subjectQuestions = this.questions.filter(
        (q) => q.subjectKey === key
      );
      const dueCount = subjectQuestions.filter(
        (q) => q.nextReview <= new Date()
      ).length;

      const card = document.createElement("div");
      card.className = "subject-card";
      card.dataset.subjectKey = key;

      card.innerHTML = `
                <div class="subject-icon">${subject.icon}</div>
                <div class="subject-name">${subject.name}</div>
                <div class="subject-count">${dueCount} due / ${subjectQuestions.length} total</div>
            `;

      card.addEventListener("click", () => this.setSubjectFilter(key));
      container.appendChild(card);
    });

    // Add "All Subjects" option
    const allCard = document.createElement("div");
    allCard.className = "subject-card";
    allCard.innerHTML = `
            <div class="subject-icon">📚</div>
            <div class="subject-name">All Subjects</div>
            <div class="subject-count">${
              this.getDueQuestions().length
            } due</div>
        `;
    allCard.addEventListener("click", () => this.clearSubjectFilter());
    container.insertBefore(allCard, container.firstChild);
  }

  // Set subject filter
  setSubjectFilter(subjectKey) {
    this.currentFilter = subjectKey;
    this.showHomePage();
    this.renderHome();
    this.updateStats();
  }

  // Clear subject filter
  clearSubjectFilter() {
    this.currentFilter = null;
    this.renderHome();
    this.updateStats();
  }

  // Show home page
  showHomePage() {
    this.showingImportant = false;
    const homePage = document.getElementById("homePage");
    const subjectPage = document.getElementById("subjectPage");
    const importantPage = document.getElementById("importantPage");

    if (homePage) homePage.classList.add("active");
    if (subjectPage) subjectPage.classList.remove("active");
    if (importantPage) importantPage.classList.remove("active");
  }

  // Show subjects page
  showSubjectsPage() {
    this.showingImportant = false;
    this.renderSubjects();
    const homePage = document.getElementById("homePage");
    const subjectPage = document.getElementById("subjectPage");
    const importantPage = document.getElementById("importantPage");

    if (homePage) homePage.classList.remove("active");
    if (subjectPage) subjectPage.classList.add("active");
    if (importantPage) importantPage.classList.remove("active");
  }

  // Show important questions page
  showImportantPage() {
    this.showingImportant = true;
    this.renderImportantQuestions();
    const homePage = document.getElementById("homePage");
    const subjectPage = document.getElementById("subjectPage");
    const importantPage = document.getElementById("importantPage");

    if (homePage) homePage.classList.remove("active");
    if (subjectPage) subjectPage.classList.remove("active");
    if (importantPage) importantPage.classList.add("active");
  }

  // Toggle randomization
  toggleRandomization() {
    this.isRandomized = !this.isRandomized;
    const btn = document.getElementById("randomizeBtn");
    if (btn) {
      btn.textContent = this.isRandomized ? "🎯 Ordered" : "🎲 Randomize";
    }

    if (this.showingImportant) {
      this.renderImportantQuestions();
    } else {
      this.renderHome();
    }
  }

  // Practice more functionality
  practiceMore() {
    const now = new Date();
    const practiceQuestions = this.getPracticeQuestions();

    if (practiceQuestions.length === 0) {
      alert("No questions rated as 'Again' or 'Hard' available for practice!");
      return;
    }

    // Make practice questions due immediately
    practiceQuestions.forEach((q) => (q.nextReview = now));

    this.renderHome();
    this.updateStats();
    this.saveQuestionStates();
  }

  // Bind event handlers
  bindEvents() {
    // Header buttons
    const subjectBtn = document.getElementById("subjectBtn");
    const randomizeBtn = document.getElementById("randomizeBtn");
    const importantBtn = document.getElementById("importantBtn");
    const logo = document.getElementById("appLogo");
    if (logo) {
      logo.addEventListener("click", () => {
        this.showingImportant = false;
        this.renderHome();
        this.updateStats();
      });
    }

    if (subjectBtn)
      subjectBtn.addEventListener("click", () => this.showSubjectsPage());
    if (randomizeBtn)
      randomizeBtn.addEventListener("click", () => this.toggleRandomization());
    if (importantBtn)
      importantBtn.addEventListener("click", () => this.showImportantPage());

    // Back buttons
    const backToHome = document.getElementById("backToHome");
    const backToHomeFromImportant = document.getElementById(
      "backToHomeFromImportant"
    );

    if (backToHome)
      backToHome.addEventListener("click", () => this.showHomePage());
    if (backToHomeFromImportant)
      backToHomeFromImportant.addEventListener("click", () =>
        this.showHomePage()
      );

    // Clear filter button
    const clearFilter = document.getElementById("clearFilter");
    if (clearFilter)
      clearFilter.addEventListener("click", () => this.clearSubjectFilter());

    // Rating buttons event delegation
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("rating-btn")) {
        e.stopPropagation();
        const rating = e.target.dataset.rating;
        const questionId = e.target.dataset.questionId;
        this.rateQuestion(parseInt(questionId), rating);
      }

      if (e.target.classList.contains("star-btn")) {
        e.stopPropagation();
        const questionId = e.target.dataset.questionId;
        this.toggleImportant(parseInt(questionId));
      }
    });

    // Modal events
    const ratingModal = document.getElementById("ratingModal");
    if (ratingModal) {
      ratingModal.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
          this.hideQuestionModal();
        }
      });
    }

    // Modal rating buttons
    document.querySelectorAll("#ratingModal .rating-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const rating = e.target.dataset.rating;
        if (this.currentQuestionId) {
          this.rateQuestion(this.currentQuestionId, rating);
        }
      });
    });

    // Modal star button
    const modalStarBtn = document.getElementById("modalStarBtn");
    if (modalStarBtn) {
      modalStarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const questionId = e.target.dataset.questionId;
        this.toggleImportant(parseInt(questionId));
      });
    }

    // Practice more button
    const addMoreBtn = document.getElementById("addMoreBtn");
    if (addMoreBtn)
      addMoreBtn.addEventListener("click", () => this.practiceMore());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (this.currentQuestionId) {
        switch (e.key) {
          case "1":
            this.rateQuestion(this.currentQuestionId, "again");
            break;
          case "2":
            this.rateQuestion(this.currentQuestionId, "hard");
            break;
          case "3":
            this.rateQuestion(this.currentQuestionId, "medium");
            break;
          case "4":
            this.rateQuestion(this.currentQuestionId, "easy");
            break;
          case "Escape":
            this.hideQuestionModal();
            break;
        }
      }
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.questRecallApp = new QuestRecallApp();
});
