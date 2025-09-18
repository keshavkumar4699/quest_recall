// QuestRecall - Simplified MongoDB Connected App
class QuestRecallApp {
  constructor() {
    this.questions = [];
    this.subjects = [];
    this.currentFilter = { subjectId: null, topicNames: [] };
    this.selectedTopics = new Set();
    this.isRandomized = false;
    this.randomizedOrder = [];
    this.stats = this.loadStats();
    this.currentQuestionId = null;
    this.showingImportant = false;
    this.currentSubjectId = null;
    this.init();
  }

  // Initialize the app
  async init() {
    try {
      await this.loadData();
      this.renderHome();
      this.updateStats();
      this.bindEvents();
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }

  // Load all data from API
  async loadData() {
    try {
      const [subjectsRes, questionsRes] = await Promise.all([
        fetch("/api/subjects"),
        fetch("/api/questions"),
      ]);

      this.subjects = await subjectsRes.json();
      this.questions = await questionsRes.json();
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  // API Methods
  async createSubject(data) {
    const response = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create subject");
    }

    return response.json();
  }

  async addTopicToSubject(subjectId, topicName) {
    const response = await fetch(`/api/subjects/${subjectId}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: topicName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create topic");
    }

    return response.json();
  }

  async createQuestion(data) {
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create question");
    }

    return response.json();
  }

  async updateQuestion(id, data) {
    const response = await fetch(`/api/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async rateQuestion(id, rating) {
    const response = await fetch(`/api/questions/${id}/rate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    return response.json();
  }

  // Load stats from localStorage
  loadStats() {
    const saved = localStorage.getItem("questRecallStats");
    if (saved) {
      const stats = JSON.parse(saved);
      if (stats.lastStudyDate) {
        stats.lastStudyDate = new Date(stats.lastStudyDate);
      }
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

  // Get filtered questions
  getFilteredQuestions() {
    const filtered = this.questions.filter((q) => {
      if (
        this.currentFilter.subjectId &&
        q.subject._id !== this.currentFilter.subjectId
      ) {
        return false;
      }
      if (
        this.currentFilter.topicNames.length > 0 &&
        !this.currentFilter.topicNames.includes(q.topicName)
      ) {
        return false;
      }
      return true;
    });

    console.log("Current filter:", this.currentFilter);
    console.log(
      "Filtered questions:",
      filtered.length,
      "out of",
      this.questions.length
    );
    return filtered;
  }

  // Get due questions
  getDueQuestions() {
    const now = new Date();
    return this.getFilteredQuestions().filter((q) => {
      return new Date(q.nextReview) <= now || q.rating === null;
    });
  }

  // Get important questions
  getImportantQuestions() {
    return this.getFilteredQuestions().filter((q) => q.important);
  }

  // Update statistics
  updateStats() {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (!this.stats.dailyAttempts[today]) {
      this.stats.dailyAttempts[today] = 0;
    }

    const cardsDueToday = this.getDueQuestions().length;
    const dueQuestionsOverall = this.getDueQuestions().length;
    const todayAttempts = this.stats.dailyAttempts[today] || 0;
    const yesterdayAttempts = this.stats.dailyAttempts[yesterdayStr] || 0;
    const progressVsYesterday = todayAttempts - yesterdayAttempts;

    const { again, hard, medium, easy } = this.stats.ratingCounts;
    const retentionRate =
      this.stats.totalAnswers > 0
        ? Math.round(
            ((medium + easy - hard - again) / this.stats.totalAnswers) * 100
          )
        : 0;

    const cardsDueTodayEl = document.getElementById("cardsDueToday");
    const dueOverallEl = document.getElementById("dueOverall");
    const retentionEl = document.getElementById("retention");
    const progressEl = document.getElementById("progress");

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
    const backToTopics = document.getElementById("backToTopics");

    this.hideAllPages();
    document.getElementById("homePage").classList.add("active");

    if (
      this.currentFilter.topicNames.length > 0 &&
      this.currentFilter.subjectId
    ) {
      backToTopics.classList.remove("hidden");
    } else {
      backToTopics.classList.add("hidden");
    }

    // Update current subject display
    let displayText = "All Subjects";
    if (this.currentFilter.subjectId) {
      const subject = this.subjects.find(
        (s) => s._id === this.currentFilter.subjectId
      );
      if (subject) {
        displayText = subject.name;
        if (this.currentFilter.topicNames.length > 0) {
          displayText += `: ${this.currentFilter.topicNames.join(", ")}`;
        }
      }
    }

    if (currentSubjectText) {
      currentSubjectText.textContent = displayText;
    }

    const dueQuestions = this.getDueQuestions();

    // Clear container first
    if (container) container.innerHTML = "";

    // Always add "Create New Question" card as first card
    const createCard = document.createElement("div");
    createCard.className = "question-card create-card";
    createCard.innerHTML = `
    <div class="question-header">
      <span class="subject-badge">Create</span>
    </div>
    <div class="question-text">➕ Create New Question</div>
    <div class="create-question-info">Add a new question to practice</div>
  `;
    createCard.addEventListener("click", () => this.showCreateQuestion());
    if (container) container.appendChild(createCard);

    // Handle no questions case - add a card instead of showing the separate no-questions section
    if (dueQuestions.length === 0) {
      const allFilteredQuestions = this.getFilteredQuestions();
      const practiceMoreCount = allFilteredQuestions.length;

      const noQuestionsCard = document.createElement("div");
      noQuestionsCard.className = "question-card no-questions-card";
      noQuestionsCard.innerHTML = `
      <div class="question-header">
        <span class="subject-badge">Status</span>
      </div>
      <div class="question-text">🎉 All Done for Today!</div>
      <div class="create-question-info">You've completed all your due cards. Great work!</div>
      ${
        practiceMoreCount > 0
          ? `
        <button class="practice-more-btn btn btn--outline btn--sm">
          Practice More (${practiceMoreCount} questions)
        </button>
      `
          : ""
      }
    `;

      // Add click handler for practice more button
      if (practiceMoreCount > 0) {
        const practiceBtn = noQuestionsCard.querySelector(".practice-more-btn");
        if (practiceBtn) {
          practiceBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showPracticeMoreQuestions();
          });
        }
      }

      if (container) container.appendChild(noQuestionsCard);

      if (noQuestions) noQuestions.classList.add("hidden");
      return;
    }

    if (noQuestions) noQuestions.classList.add("hidden");

    // Apply randomization if enabled
    let questionsToRender = [...dueQuestions];
    if (this.isRandomized && this.randomizedOrder.length > 0) {
      questionsToRender = this.randomizedOrder
        .map((id) => dueQuestions.find((q) => q._id === id))
        .filter((q) => q !== undefined);
    }

    // Group questions by rating
    const questionGroups = {
      again: [],
      hard: [],
      medium: [],
      easy: [],
    };

    questionsToRender.forEach((q) => {
      const rating = q.rating || "again";
      if (questionGroups[rating]) {
        questionGroups[rating].push(q);
      }
    });

    // Sort by importance within each group (only if not randomized)
    if (!this.isRandomized) {
      Object.keys(questionGroups).forEach((rating) => {
        questionGroups[rating].sort((a, b) => {
          if (a.important && !b.important) return -1;
          if (!a.important && b.important) return 1;
          return 0;
        });
      });
    }

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

  // Show practice more questions (all filtered questions regardless of due date)
  showPracticeMoreQuestions() {
    const container = document.getElementById("questionsContainer");
    const noQuestions = document.getElementById("noQuestions");

    if (container) container.innerHTML = "";
    if (noQuestions) noQuestions.classList.add("hidden");

    // Always add "Create New Question" card as first card
    const createCard = document.createElement("div");
    createCard.className = "question-card create-card";
    createCard.innerHTML = `
    <div class="question-header">
      <span class="subject-badge">Create</span>
    </div>
    <div class="question-text">➕ Create New Question</div>
    <div class="create-question-info">Add a new question to practice</div>
  `;
    createCard.addEventListener("click", () => this.showCreateQuestion());
    if (container) container.appendChild(createCard);

    // Get all filtered questions (not just due ones)
    const allQuestions = this.getFilteredQuestions();

    if (allQuestions.length === 0) {
      const noQuestionsCard = document.createElement("div");
      noQuestionsCard.className = "question-card no-questions-card";
      noQuestionsCard.innerHTML = `
      <div class="question-header">
        <span class="subject-badge">Status</span>
      </div>
      <div class="question-text">📝 No Questions Yet</div>
      <div class="create-question-info">Create your first question to start practicing!</div>
    `;
      if (container) container.appendChild(noQuestionsCard);
      return;
    }

    // Add a "Practice More" indicator card
    const practiceMoreCard = document.createElement("div");
    practiceMoreCard.className = "question-card practice-more-info-card";
    practiceMoreCard.innerHTML = `
    <div class="question-header">
      <span class="subject-badge">Practice Mode</span>
      <button class="back-to-due-btn btn btn--outline btn--sm" title="Back to Due Questions">
        🎯 Due Only
      </button>
    </div>
    <div class="question-text">📚 Practice Mode Active</div>
    <div class="create-question-info">Showing all questions including completed ones</div>
  `;

    // Add click handler for back to due questions
    const backBtn = practiceMoreCard.querySelector(".back-to-due-btn");
    if (backBtn) {
      backBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.renderHome(); // Go back to normal due questions view
      });
    }

    if (container) container.appendChild(practiceMoreCard);

    // Group questions by rating
    const questionGroups = {
      again: [],
      hard: [],
      medium: [],
      easy: [],
    };

    allQuestions.forEach((q) => {
      const rating = q.rating || "again";
      if (questionGroups[rating]) {
        questionGroups[rating].push(q);
      }
    });

    // Sort by importance within each group
    Object.keys(questionGroups).forEach((rating) => {
      questionGroups[rating].sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return 0;
      });
    });

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

  // Create question card element
  createQuestionCard(question) {
    const card = document.createElement("div");
    const rating = question.rating || "again";
    card.className = `question-card rating-${rating}`;
    card.dataset.questionId = question._id;

    card.innerHTML = `
      <div class="question-header">
        <span class="subject-badge">${question.subjectName}</span>
        <button class="star-btn ${question.important ? "important" : ""}" 
                data-question-id="${question._id}">
          ${question.important ? "🌟" : "⭐"}
        </button>
      </div>
      <div class="question-text">${question.text}</div>
      <div class="rating-buttons">
        <button class="rating-btn rating-again" data-rating="again" 
                data-question-id="${question._id}">
          Again<br><span class="rating-time">Tomorrow</span>
        </button>
        <button class="rating-btn rating-hard" data-rating="hard" 
                data-question-id="${question._id}">
          Hard<br><span class="rating-time">3 days</span>
        </button>
        <button class="rating-btn rating-medium" data-rating="medium" 
                data-question-id="${question._id}">
          Medium<br><span class="rating-time">7 days</span>
        </button>
        <button class="rating-btn rating-easy" data-rating="easy" 
                data-question-id="${question._id}">
          Easy<br><span class="rating-time">14 days</span>
        </button>
      </div>
    `;
    return card;
  }

  // Hide all pages
  hideAllPages() {
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
    });
  }

  // Show subjects page
  showSubjectsPage() {
    this.hideAllPages();
    document.getElementById("subjectPage").classList.add("active");
    this.renderSubjects();
  }

  // Render subjects
  renderSubjects() {
    const container = document.getElementById("subjectsGrid");
    if (!container) return;

    container.innerHTML = "";

    // Add "Create New Subject" card as first card
    const createCard = document.createElement("div");
    createCard.className = "subject-card create-card";
    createCard.innerHTML = `
      <div class="subject-icon">➕</div>
      <div class="subject-name">Create New Subject</div>
      <div class="subject-count">Add a new subject</div>
    `;
    createCard.addEventListener("click", () => this.showCreateSubject());
    container.appendChild(createCard);

    // Add "All Subjects" option
    const allCard = document.createElement("div");
    allCard.className = "subject-card";
    allCard.innerHTML = `
      <div class="subject-icon">📚</div>
      <div class="subject-name">All Subjects</div>
      <div class="subject-count">${this.getDueQuestions().length} due</div>
    `;
    allCard.addEventListener("click", () => this.clearSubjectFilter());
    container.appendChild(allCard);

    this.subjects.forEach((subject) => {
      const subjectQuestions = this.questions.filter(
        (q) => q.subject._id === subject._id
      );
      const dueCount = subjectQuestions.filter(
        (q) => new Date(q.nextReview) <= new Date() || q.rating === null
      ).length;

      const card = document.createElement("div");
      card.className = "subject-card";
      card.dataset.subjectId = subject._id;

      card.innerHTML = `
        <div class="subject-icon">${subject.icon}</div>
        <div class="subject-name">${subject.name}</div>
        <div class="subject-count">${dueCount} due / ${subjectQuestions.length} total</div>
      `;

      card.addEventListener("click", () => this.showTopicsPage(subject._id));
      container.appendChild(card);
    });
  }

  // Show topics page
  showTopicsPage(subjectId) {
    this.hideAllPages();
    document.getElementById("topicPage").classList.add("active");
    this.currentSubjectId = subjectId;

    const subject = this.subjects.find((s) => s._id === subjectId);
    if (subject) {
      const currentSubjectName = document.getElementById("currentSubjectName");
      if (currentSubjectName) {
        currentSubjectName.textContent = subject.name;
      }
    }

    this.renderTopics(subjectId);
  }

  // Render topics - SIMPLIFIED: Single topic selection
  renderTopics(subjectId) {
    const container = document.getElementById("topicsGrid");
    if (!container) return;

    container.innerHTML = "";

    const subject = this.subjects.find((s) => s._id === subjectId);
    if (!subject) return;

    // Add "Create New Topic" card as first card
    const createCard = document.createElement("div");
    createCard.className = "subject-card create-card";
    createCard.innerHTML = `
      <div class="subject-icon">➕</div>
      <div class="subject-name">Create New Topic</div>
      <div class="subject-count">Add a new topic</div>
    `;
    createCard.addEventListener("click", () => this.showCreateTopic());
    container.appendChild(createCard);

    // Add "All Topics" option
    const allTopicsCard = document.createElement("div");
    allTopicsCard.className = "subject-card";
    allTopicsCard.innerHTML = `
      <div class="subject-icon">📚</div>
      <div class="subject-name">All Topics</div>
      <div class="subject-count">${this.getSubjectQuestionCount(
        subjectId
      )} questions</div>
    `;
    allTopicsCard.addEventListener("click", () => {
      this.currentFilter.subjectId = subjectId;
      this.currentFilter.topicNames = [];
      this.resetRandomization();
      this.showHomePage();
      this.renderHome();
      this.updateStats();
    });
    container.appendChild(allTopicsCard);

    if (subject.topics && subject.topics.length > 0) {
      subject.topics.forEach((topic) => {
        const topicQuestions = this.questions.filter(
          (q) => q.subject._id === subjectId && q.topicName === topic.name
        );
        const dueCount = topicQuestions.filter(
          (q) => new Date(q.nextReview) <= new Date() || q.rating === null
        ).length;

        const card = document.createElement("div");
        card.className = "subject-card";
        card.dataset.topicName = topic.name;

        card.innerHTML = `
          <div class="subject-icon">${subject.icon}</div>
          <div class="subject-name">${topic.name}</div>
          <div class="subject-count">${dueCount} due / ${topicQuestions.length} total</div>
        `;

        card.addEventListener("click", () => {
          this.currentFilter.subjectId = subjectId;
          this.currentFilter.topicNames = [topic.name];
          this.resetRandomization();
          this.showHomePage();
          this.renderHome();
          this.updateStats();
        });

        container.appendChild(card);
      });
    }
  }

  // Helper method to get subject question count
  getSubjectQuestionCount(subjectId) {
    return this.questions.filter((q) => q.subject._id === subjectId).length;
  }

  // Clear subject filter - FIXED: Always show all questions when going back to home
  clearSubjectFilter() {
    this.currentFilter = { subjectId: null, topicNames: [] };
    this.selectedTopics.clear();
    this.currentSubjectId = null;
    this.showingImportant = false; // Reset important view
    this.resetRandomization();
    this.showHomePage();
    this.renderHome();
    this.updateStats();
  }

  // Show home page - FIXED: Reset important view when going home
  showHomePage() {
    this.showingImportant = false; // Always reset when going to home
    this.hideAllPages();
    document.getElementById("homePage").classList.add("active");
  }

  // Reset randomization
  resetRandomization() {
    this.isRandomized = false;
    this.randomizedOrder = [];
    const randomizeBtn = document.getElementById("randomizeBtn");
    if (randomizeBtn) {
      randomizeBtn.textContent = "🎲 Randomize";
      randomizeBtn.classList.remove("active");
    }
  }

  // FIXED: Toggle randomization functionality
  toggleRandomization() {
    this.isRandomized = !this.isRandomized;
    const btn = document.getElementById("randomizeBtn");

    if (this.isRandomized) {
      // Create new randomized order
      const currentQuestions = this.showingImportant
        ? this.getImportantQuestions()
        : this.getDueQuestions();
      this.randomizedOrder = [...currentQuestions.map((q) => q._id)];
      this.shuffleArray(this.randomizedOrder);

      if (btn) {
        btn.textContent = "🎯 Ordered";
        btn.classList.add("active");
      }
    } else {
      // Reset to original order
      this.randomizedOrder = [];
      if (btn) {
        btn.textContent = "🎲 Randomize";
        btn.classList.remove("active");
      }
    }

    // Re-render current view
    if (this.showingImportant) {
      this.renderImportantQuestions();
    } else {
      this.renderHome();
    }
  }

  // Shuffle array utility
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Rate question and update stats
  async handleRateQuestion(questionId, rating) {
    try {
      await this.rateQuestion(questionId, rating);

      // Update local data
      await this.loadData();

      // Update statistics
      const today = new Date().toDateString();
      if (!this.stats.dailyAttempts[today]) {
        this.stats.dailyAttempts[today] = 0;
      }
      this.stats.dailyAttempts[today]++;
      this.stats.ratingCounts[rating]++;
      this.stats.totalAnswers++;

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

      this.saveStats();
    } catch (error) {
      console.error("Error rating question:", error);
    }
  }

  // Toggle important status
  async toggleImportant(questionId) {
    try {
      const question = this.questions.find((q) => q._id === questionId);
      if (question) {
        await this.updateQuestion(questionId, {
          important: !question.important,
        });
        await this.loadData();

        // Update star button immediately
        const starBtns = document.querySelectorAll(
          `[data-question-id="${questionId}"].star-btn`
        );
        starBtns.forEach((btn) => {
          if (!question.important) {
            btn.classList.add("important");
            btn.textContent = "🌟";
          } else {
            btn.classList.remove("important");
            btn.textContent = "⭐";
          }
        });

        if (this.showingImportant) {
          setTimeout(() => this.renderImportantQuestions(), 100);
        }
      }
    } catch (error) {
      console.error("Error toggling important:", error);
    }
  }

  // Show important questions page - FIXED: Toggle between important and all questions
  showImportantPage() {
    if (this.showingImportant) {
      // If already showing important, go back to all questions
      this.showingImportant = false;
      this.showHomePage();
      this.renderHome();
    } else {
      // Show important questions
      this.showingImportant = true;
      this.hideAllPages();
      document.getElementById("importantPage").classList.add("active");
      this.renderImportantQuestions();
    }
  }

  // Render important questions - FIXED: Support randomization
  renderImportantQuestions() {
    const container = document.getElementById("importantQuestionsContainer");
    const noQuestions = document.getElementById("noImportantQuestions");

    let importantQuestions = this.getImportantQuestions();

    if (importantQuestions.length === 0) {
      if (container) container.innerHTML = "";
      if (noQuestions) noQuestions.classList.remove("hidden");
      return;
    }

    // Apply randomization if enabled
    if (this.isRandomized && this.randomizedOrder.length > 0) {
      importantQuestions = this.randomizedOrder
        .map((id) => importantQuestions.find((q) => q._id === id))
        .filter((q) => q !== undefined);
    }

    if (noQuestions) noQuestions.classList.add("hidden");
    if (container) container.innerHTML = "";

    importantQuestions.forEach((question) => {
      const card = this.createQuestionCard(question);
      if (container) container.appendChild(card);
    });
  }

  // Modal methods
  showModal(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
  }

  // Subject creation
  showCreateSubject() {
    document.getElementById("subjectModalTitle").textContent =
      "Create New Subject";
    document.getElementById("subjectForm").reset();
    this.showModal("subjectModal");
  }

  async handleSubjectSubmit(e) {
    e.preventDefault();
    console.log("Subject form submitted");

    const data = {
      name: document.getElementById("subjectName").value,
      icon: document.getElementById("subjectIcon").value,
      color: document.getElementById("subjectColor").value,
      topics: [],
    };

    console.log("Subject data:", data);

    try {
      const result = await this.createSubject(data);
      console.log("Subject created:", result);
      await this.loadData();
      this.hideModal("subjectModal");
      this.renderSubjects();
    } catch (error) {
      console.error("Error creating subject:", error);
      alert("Error creating subject: " + error.message);
    }
  }

  // Topic creation
  showCreateTopic() {
    if (!this.currentSubjectId) {
      alert("Please select a subject first");
      return;
    }

    document.getElementById("topicModalTitle").textContent = "Create New Topic";
    document.getElementById("topicForm").reset();
    this.showModal("topicModal");
  }

  async handleTopicSubmit(e) {
    e.preventDefault();
    console.log("Topic form submitted");

    const topicName = document.getElementById("topicName").value;
    console.log("Topic name:", topicName, "Subject ID:", this.currentSubjectId);

    try {
      const result = await this.addTopicToSubject(
        this.currentSubjectId,
        topicName
      );
      console.log("Topic created:", result);
      await this.loadData();
      this.hideModal("topicModal");
      this.renderTopics(this.currentSubjectId);
    } catch (error) {
      console.error("Error creating topic:", error);
      if (error.message && error.message.includes("already exists")) {
        alert("Topic already exists in this subject");
      } else {
        alert("Error creating topic: " + error.message);
      }
    }
  }

  // Question creation submit handler
  async handleQuestionSubmit(e) {
    e.preventDefault();
    console.log("Question form submitted");

    const data = {
      text: document.getElementById("questionText").value,
      subject: document.getElementById("questionSubject").value,
      topicName: document.getElementById("questionTopic").value,
    };

    console.log("Question data:", data);

    try {
      const result = await this.createQuestion(data);
      console.log("Question created:", result);
      await this.loadData();
      this.hideModal("questionModal");

      // Refresh current view
      if (this.showingImportant) {
        this.renderImportantQuestions();
      } else {
        this.renderHome();
      }
      this.updateStats();
    } catch (error) {
      console.error("Error creating question:", error);
      alert("Error creating question: " + error.message);
    }
  }

  // Question creation
  showCreateQuestion() {
    document.getElementById("questionModalTitle").textContent =
      "Create New Question";
    document.getElementById("questionForm").reset();
    this.populateQuestionSubjects();

    // Auto-select current subject if available
    if (this.currentFilter.subjectId) {
      document.getElementById("questionSubject").value =
        this.currentFilter.subjectId;
      this.updateQuestionTopics(this.currentFilter.subjectId);

      // Auto-select topic if only one is selected
      if (this.currentFilter.topicNames.length === 1) {
        setTimeout(() => {
          document.getElementById("questionTopic").value =
            this.currentFilter.topicNames[0];
        }, 100);
      }
    }

    this.showModal("questionModal");
  }

  populateQuestionSubjects() {
    const select = document.getElementById("questionSubject");
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }

    this.subjects.forEach((subject) => {
      const option = new Option(subject.name, subject._id);
      select.appendChild(option);
    });
  }

  async updateQuestionTopics(subjectId) {
    const select = document.getElementById("questionTopic");
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }

    const subject = this.subjects.find((s) => s._id === subjectId);
    if (subject && subject.topics) {
      subject.topics.forEach((topic) => {
        const option = new Option(topic.name, topic.name);
        select.appendChild(option);
      });
    }
  }

  async handleQuestionSubmit(e) {
    e.preventDefault();
    console.log("Question form submitted");

    const data = {
      text: document.getElementById("questionText").value,
      subject: document.getElementById("questionSubject").value,
      topicName: document.getElementById("questionTopic").value,
    };

    console.log("Question data:", data);

    try {
      const result = await this.createQuestion(data);
      console.log("Question created:", result);
      await this.loadData();
      this.hideModal("questionModal");
      this.renderHome();
      this.updateStats();
    } catch (error) {
      console.error("Error creating question:", error);
      alert("Error creating question: " + error.message);
    }
  }

  // Bind event handlers
  bindEvents() {
    // Header buttons
    document
      .getElementById("subjectBtn")
      ?.addEventListener("click", () => this.showSubjectsPage());
    document
      .getElementById("importantBtn")
      ?.addEventListener("click", () => this.showImportantPage());
    document
      .getElementById("randomizeBtn")
      ?.addEventListener("click", () => this.toggleRandomization());
    document.getElementById("appLogo")?.addEventListener("click", () => {
      this.clearSubjectFilter();
      this.renderHome();
    });

    // Navigation buttons
    document.getElementById("backToHome")?.addEventListener("click", () => {
      this.showHomePage();
      this.renderHome();
    });
    document
      .getElementById("backToSubjects")
      ?.addEventListener("click", () => this.showSubjectsPage());
    document.getElementById("backToTopics")?.addEventListener("click", () => {
      if (this.currentFilter.subjectId) {
        this.currentFilter.topicNames = [];
        this.selectedTopics.clear();
        this.showTopicsPage(this.currentFilter.subjectId);
      }
    });
    document
      .getElementById("backToHomeFromImportant")
      ?.addEventListener("click", () => {
        this.showingImportant = false;
        this.showHomePage();
        this.renderHome();
      });

    // Question subject change for topic population
    document
      .getElementById("questionSubject")
      ?.addEventListener("change", (e) => {
        this.updateQuestionTopics(e.target.value);
      });

    // Modal events
    document.querySelectorAll(".modal-close, .modal-cancel").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Form submissions
    document
      .getElementById("subjectForm")
      ?.addEventListener("submit", (e) => this.handleSubjectSubmit(e));
    document
      .getElementById("topicForm")
      ?.addEventListener("submit", (e) => this.handleTopicSubmit(e));
    document
      .getElementById("questionForm")
      ?.addEventListener("submit", (e) => this.handleQuestionSubmit(e));

    // Question interactions
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("rating-btn")) {
        const questionId = e.target.dataset.questionId;
        const rating = e.target.dataset.rating;
        this.handleRateQuestion(questionId, rating);
      }

      if (e.target.classList.contains("star-btn")) {
        const questionId = e.target.dataset.questionId;
        this.toggleImportant(questionId);
      }
    });

    // Close modals when clicking outside
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.hideModal(e.target.id);
      }
    });
  }
}

// Initialize the app
const app = new QuestRecallApp();
