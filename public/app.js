// QuestRecall - Complete Multi-User App with Authentication
class QuestRecallApp {
  constructor() {
    this.questions = [];
    this.subjects = [];
    this.currentFilter = { subjectId: null, topicNames: [] };
    this.selectedTopics = new Set();
    this.isRandomized = false;
    this.randomizedOrder = [];
    this.currentQuestionId = null;
    this.showingImportant = false;
    this.currentSubjectId = null;
    this.user = null;
    this.token = this.loadToken();
    this.stats = { currentStats: {}, userStats: {} };
    this.editingQuestion = null;
    this.editingSubject = null;
    this.editingTopic = null;
    this.init();
  }

  // Token management
  loadToken() {
    return localStorage.getItem("questRecallToken");
  }

  saveToken(token) {
    localStorage.setItem("questRecallToken", token);
    this.token = token;
  }

  clearToken() {
    localStorage.removeItem("questRecallToken");
    this.token = null;
    this.user = null;
  }

  // Get auth headers
  getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Initialize the app
  async init() {
    try {
      if (this.token) {
        const verified = await this.verifyToken();
        if (verified && this.user) {
          await this.loadData();
          this.renderHome();
          this.updateStats();
          this.showMainApp();
        } else {
          this.showAuthPage();
        }
      } else {
        this.showAuthPage();
      }
      this.bindEvents();
    } catch (error) {
      console.error("Error during initialization:", error);
      this.showAuthPage();
    }
  }

  // Verify token and get user data
  async verifyToken() {
    try {
      const response = await fetch("/api/auth/profile", {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.stats.userStats = data.user.stats;
        this.stats.currentStats = data.user.currentStats;
        return true;
      } else {
        this.clearToken();
        return false;
      }
    } catch (error) {
      console.error("Token verification error:", error);
      this.clearToken();
      return false;
    }
  }

  // Show authentication page
  showAuthPage() {
    this.hideAllPages();
    document.getElementById("authPage").classList.add("active");
    document.querySelector(".header").style.display = "none";
    document.querySelector(".stats-dashboard").style.display = "none";
  }

  // Show main app
  showMainApp() {
    this.hideAllPages();
    document.getElementById("homePage").classList.add("active");
    document.querySelector(".header").style.display = "block";
    document.querySelector(".stats-dashboard").style.display = "block";
    this.updateUserDisplay();
  }

  // Authentication methods
  async register(email, password) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.saveToken(data.token);
        this.user = data.user;
        this.stats.userStats = data.user.stats;
        this.showMainApp();
        await this.loadData();
        this.renderHome();
        this.updateStats();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.saveToken(data.token);
        this.user = data.user;
        this.stats.userStats = data.user.stats;
        this.stats.currentStats = data.user.currentStats;
        this.showMainApp();
        await this.loadData();
        this.renderHome();
        this.updateStats();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  }

  logout() {
    this.clearToken();
    this.questions = [];
    this.subjects = [];
    this.stats = { currentStats: {}, userStats: {} };
    this.resetFilters();
    this.showAuthPage();
  }

  // Load all data from API
  async loadData() {
    try {
      const [subjectsRes, questionsRes, statsRes] = await Promise.all([
        fetch("/api/subjects", { headers: this.getAuthHeaders() }),
        fetch("/api/questions", { headers: this.getAuthHeaders() }),
        fetch("/api/auth/stats", { headers: this.getAuthHeaders() }),
      ]);

      if (subjectsRes.ok && questionsRes.ok && statsRes.ok) {
        this.subjects = await subjectsRes.json();
        this.questions = await questionsRes.json();
        const statsData = await statsRes.json();
        this.stats.userStats = statsData.stats;
        this.stats.currentStats = statsData.currentStats;
      } else {
        // Handle auth errors
        if (
          subjectsRes.status === 401 ||
          questionsRes.status === 401 ||
          statsRes.status === 401
        ) {
          this.clearToken();
          this.showAuthPage();
          return;
        }
        throw new Error("Failed to load data");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      if (this.token) {
        this.clearToken();
        this.showAuthPage();
      }
    }
  }

  // API Methods with authentication
  async handleApiResponse(response) {
    if (response.status === 401) {
      this.clearToken();
      this.showAuthPage();
      throw new Error("Authentication required");
    }
    return response;
  }

  async createSubject(data) {
    const response = await fetch("/api/subjects", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create subject");
    }
    return response.json();
  }

  async updateSubject(id, data) {
    const response = await fetch(`/api/subjects/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update subject");
    }
    return response.json();
  }

  async deleteSubject(id) {
    const response = await fetch(`/api/subjects/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete subject");
    }
    return response.json();
  }

  async addTopicToSubject(subjectId, topicName) {
    const response = await fetch(`/api/subjects/${subjectId}/topics`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name: topicName }),
    });

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create topic");
    }
    return response.json();
  }

  async updateTopic(subjectId, oldTopicName, newTopicName) {
    const response = await fetch(
      `/api/subjects/${subjectId}/topics/${encodeURIComponent(oldTopicName)}`,
      {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name: newTopicName }),
      }
    );

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update topic");
    }
    return response.json();
  }

  async deleteTopic(subjectId, topicName) {
    const response = await fetch(
      `/api/subjects/${subjectId}/topics/${encodeURIComponent(topicName)}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete topic");
    }
    return response.json();
  }

  async createQuestion(data) {
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create question");
    }
    return response.json();
  }

  async updateQuestion(id, data) {
    const response = await fetch(`/api/questions/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update question");
    }
    return response.json();
  }

  async deleteQuestion(id) {
    const response = await fetch(`/api/questions/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete question");
    }
    return response.json();
  }

  async rateQuestion(id, rating) {
    const response = await fetch(`/api/questions/${id}/rate`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ rating }),
    });

    await this.handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to rate question");
    }
    return response.json();
  }

  // Utility methods
  resetFilters() {
    this.currentFilter = { subjectId: null, topicNames: [] };
    this.selectedTopics.clear();
    this.currentSubjectId = null;
    this.showingImportant = false;
    this.resetRandomization();
  }

  resetRandomization() {
    this.isRandomized = false;
    this.randomizedOrder = [];
    const randomizeBtn = document.getElementById("randomizeBtn");
    if (randomizeBtn) {
      randomizeBtn.textContent = "🎲 Randomize";
      randomizeBtn.classList.remove("active");
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Get filtered questions
  getFilteredQuestions() {
    return this.questions.filter((q) => {
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
  }

  getDueQuestions() {
    const now = new Date();
    return this.getFilteredQuestions().filter((q) => {
      return new Date(q.nextReview) <= now || q.rating === null;
    });
  }

  getImportantQuestions() {
    return this.getFilteredQuestions().filter((q) => q.important);
  }

  // Update statistics display
  updateStats() {
    if (!this.stats.currentStats) return;

    const { dueToday, dueOverall, retention, progress } =
      this.stats.currentStats;

    const cardsDueTodayEl = document.getElementById("cardsDueToday");
    const dueOverallEl = document.getElementById("dueOverall");
    const retentionEl = document.getElementById("retention");
    const progressEl = document.getElementById("progress");

    if (cardsDueTodayEl) cardsDueTodayEl.textContent = dueToday || 0;
    if (dueOverallEl) dueOverallEl.textContent = dueOverall || 0;
    if (retentionEl) retentionEl.textContent = (retention || 0) + "%";
    if (progressEl) {
      const progressValue = progress || 0;
      progressEl.textContent =
        progressValue >= 0 ? "+" + progressValue : progressValue.toString();
    }
  }

  updateUserDisplay() {
    const userEmailEl = document.getElementById("userEmail");
    if (userEmailEl && this.user) {
      userEmailEl.textContent = this.user.email;
    }
  }

  // Page navigation methods
  hideAllPages() {
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
    });
  }

  showHomePage() {
    this.showingImportant = false;
    this.hideAllPages();
    document.getElementById("homePage").classList.add("active");
  }

  showSubjectsPage() {
    this.hideAllPages();
    document.getElementById("subjectPage").classList.add("active");
    this.renderSubjects();
  }

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

  showImportantPage() {
    if (this.showingImportant) {
      this.showingImportant = false;
      this.showHomePage();
      this.renderHome();
    } else {
      this.showingImportant = true;
      this.hideAllPages();
      document.getElementById("importantPage").classList.add("active");
      this.renderImportantQuestions();
    }
  }

  clearSubjectFilter() {
    this.resetFilters();
    this.showHomePage();
    this.renderHome();
    this.updateStats();
  }

  // Render methods
  renderHome() {
    const container = document.getElementById("questionsContainer");
    const noQuestions = document.getElementById("noQuestions");
    const currentSubjectText = document.getElementById("currentSubjectText");
    const backToTopics = document.getElementById("backToTopics");

    this.hideAllPages();
    document.getElementById("homePage").classList.add("active");
    this.updateUserDisplay();

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

    if (container) container.innerHTML = "";

    // Add "Create New Question" card
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

    // Handle no questions case
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
    const questionGroups = { again: [], hard: [], medium: [], easy: [] };

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

  createQuestionCard(question) {
    const card = document.createElement("div");
    const rating = question.rating || "again";
    card.className = `question-card rating-${rating}`;
    card.dataset.questionId = question._id;

    card.innerHTML = `
      <div class="question-header">
        <span class="subject-badge">${question.subjectName}</span>
        <div class="question-actions">
          <button class="star-btn ${question.important ? "important" : ""}" 
                  data-question-id="${question._id}">
            ${question.important ? "🌟" : "⭐"}
          </button>
          <button class="edit-btn" data-question-id="${
            question._id
          }" title="Edit Question">
            ✏️
          </button>
          <button class="delete-btn" data-question-id="${
            question._id
          }" title="Delete Question">
            🗑️
          </button>
        </div>
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

  renderSubjects() {
    const container = document.getElementById("subjectsGrid");
    if (!container) return;

    container.innerHTML = "";

    // Add "Create New Subject" card
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
        <div class="subject-actions">
          <button class="edit-btn subject-edit-btn" data-subject-id="${subject._id}" title="Edit Subject">
            ✏️
          </button>
          <button class="delete-btn subject-delete-btn" data-subject-id="${subject._id}" title="Delete Subject">
            🗑️
          </button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (
          !e.target.classList.contains("edit-btn") &&
          !e.target.classList.contains("delete-btn")
        ) {
          this.showTopicsPage(subject._id);
        }
      });
      container.appendChild(card);
    });
  }

  renderTopics(subjectId) {
    const container = document.getElementById("topicsGrid");
    if (!container) return;

    container.innerHTML = "";

    const subject = this.subjects.find((s) => s._id === subjectId);
    if (!subject) return;

    // Add "Create New Topic" card
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
          <div class="topic-actions">
            <button class="edit-btn topic-edit-btn" data-topic-name="${topic.name}" title="Edit Topic">
              ✏️
            </button>
            <button class="delete-btn topic-delete-btn" data-topic-name="${topic.name}" title="Delete Topic">
              🗑️
            </button>
          </div>
        `;

        card.addEventListener("click", (e) => {
          if (
            !e.target.classList.contains("edit-btn") &&
            !e.target.classList.contains("delete-btn")
          ) {
            this.currentFilter.subjectId = subjectId;
            this.currentFilter.topicNames = [topic.name];
            this.resetRandomization();
            this.showHomePage();
            this.renderHome();
            this.updateStats();
          }
        });

        container.appendChild(card);
      });
    }
  }

  getSubjectQuestionCount(subjectId) {
    return this.questions.filter((q) => q.subject._id === subjectId).length;
  }

  renderImportantQuestions() {
    const container = document.getElementById("importantQuestionsContainer");
    const noQuestions = document.getElementById("noImportantQuestions");

    let importantQuestions = this.getImportantQuestions();

    if (importantQuestions.length === 0) {
      if (container) container.innerHTML = "";
      if (noQuestions) noQuestions.classList.remove("hidden");
      return;
    }

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

  toggleRandomization() {
    this.isRandomized = !this.isRandomized;
    const btn = document.getElementById("randomizeBtn");

    if (this.isRandomized) {
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
      this.randomizedOrder = [];
      if (btn) {
        btn.textContent = "🎲 Randomize";
        btn.classList.remove("active");
      }
    }

    if (this.showingImportant) {
      this.renderImportantQuestions();
    } else {
      this.renderHome();
    }
  }

  // Event handlers
  async handleRateQuestion(questionId, rating) {
    try {
      await this.rateQuestion(questionId, rating);
      await this.loadData();

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
    } catch (error) {
      console.error("Error rating question:", error);
      if (error.message === "Authentication required") {
        return;
      }
      alert("Error rating question: " + error.message);
    }
  }

  async toggleImportant(questionId) {
    try {
      const question = this.questions.find((q) => q._id === questionId);
      if (question) {
        await this.updateQuestion(questionId, {
          important: !question.important,
        });
        await this.loadData();

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
      if (error.message === "Authentication required") {
        return;
      }
      alert("Error updating question: " + error.message);
    }
  }

  // Modal methods
  showModal(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
  }

  // Create/Edit Subject
  showCreateSubject() {
    this.editingSubject = null;
    document.getElementById("subjectModalTitle").textContent =
      "Create New Subject";
    document.getElementById("subjectId").value = "";
    document.getElementById("subjectName").value = "";
    document.getElementById("subjectIcon").value = "";
    document.getElementById("subjectColor").value = "#218085";
    document.getElementById("deleteSubjectBtn").classList.add("hidden");
    this.showModal("subjectModal");
  }

  showEditSubject(subjectId) {
    const subject = this.subjects.find((s) => s._id === subjectId);
    if (!subject) return;

    this.editingSubject = subject;
    document.getElementById("subjectModalTitle").textContent = "Edit Subject";
    document.getElementById("subjectId").value = subject._id;
    document.getElementById("subjectName").value = subject.name;
    document.getElementById("subjectIcon").value = subject.icon;
    document.getElementById("subjectColor").value = subject.color || "#218085";
    document.getElementById("deleteSubjectBtn").classList.remove("hidden");
    this.showModal("subjectModal");
  }

  // Create/Edit Topic
  showCreateTopic() {
    this.editingTopic = null;
    document.getElementById("topicModalTitle").textContent = "Create New Topic";
    document.getElementById("topicSubjectId").value = this.currentSubjectId;
    document.getElementById("originalTopicName").value = "";
    document.getElementById("topicName").value = "";
    document.getElementById("deleteTopicBtn").classList.add("hidden");
    this.showModal("topicModal");
  }

  showEditTopic(topicName) {
    this.editingTopic = topicName;
    document.getElementById("topicModalTitle").textContent = "Edit Topic";
    document.getElementById("topicSubjectId").value = this.currentSubjectId;
    document.getElementById("originalTopicName").value = topicName;
    document.getElementById("topicName").value = topicName;
    document.getElementById("deleteTopicBtn").classList.remove("hidden");
    this.showModal("topicModal");
  }

  // Create/Edit Question
  showCreateQuestion() {
    this.editingQuestion = null;
    document.getElementById("questionModalTitle").textContent =
      "Create New Question";
    document.getElementById("questionId").value = "";
    document.getElementById("questionText").value = "";
    document.getElementById("deleteQuestionBtn").classList.add("hidden");
    this.populateSubjectDropdown();
    this.showModal("questionModal");
  }

  showEditQuestion(questionId) {
    const question = this.questions.find((q) => q._id === questionId);
    if (!question) return;

    this.editingQuestion = question;
    document.getElementById("questionModalTitle").textContent = "Edit Question";
    document.getElementById("questionId").value = question._id;
    document.getElementById("questionText").value = question.text;
    document.getElementById("deleteQuestionBtn").classList.remove("hidden");
    this.populateSubjectDropdown();

    // Set subject and topic
    setTimeout(() => {
      document.getElementById("questionSubject").value = question.subject._id;
      this.populateTopicDropdown(question.subject._id);
      setTimeout(() => {
        document.getElementById("questionTopic").value = question.topicName;
      }, 100);
    }, 100);

    this.showModal("questionModal");
  }

  populateSubjectDropdown() {
    const select = document.getElementById("questionSubject");
    select.innerHTML =
      '<option value="" disabled selected>Choose a subject</option>';

    this.subjects.forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject._id;
      option.textContent = subject.name;
      select.appendChild(option);
    });

    // Pre-select current subject if available
    if (this.currentSubjectId) {
      select.value = this.currentSubjectId;
      this.populateTopicDropdown(this.currentSubjectId);
    }
  }

  populateTopicDropdown(subjectId) {
    const select = document.getElementById("questionTopic");
    select.innerHTML =
      '<option value="" disabled selected>Choose a topic</option>';

    if (!subjectId) return;

    const subject = this.subjects.find((s) => s._id === subjectId);
    if (subject && subject.topics) {
      subject.topics.forEach((topic) => {
        const option = document.createElement("option");
        option.value = topic.name;
        option.textContent = topic.name;
        select.appendChild(option);
      });
    }
  }

  showPracticeMoreQuestions() {
    const allQuestions = this.getFilteredQuestions();
    if (allQuestions.length === 0) return;

    // Temporarily show all questions for practice
    const container = document.getElementById("questionsContainer");
    if (!container) return;

    // Clear existing content
    container.innerHTML = "";

    // Add "Create New Question" card
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
    container.appendChild(createCard);

    // Show all questions for practice
    allQuestions.forEach((question) => {
      const card = this.createQuestionCard(question);
      container.appendChild(card);
    });
  }

  // Confirmation modal
  showConfirmation(title, message, onConfirm) {
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;

    const confirmBtn = document.getElementById("confirmAction");
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener("click", () => {
      this.hideModal("confirmModal");
      onConfirm();
    });

    this.showModal("confirmModal");
  }

  // Event binding
  bindEvents() {
    // Auth tab switching
    document.getElementById("loginTab")?.addEventListener("click", () => {
      document.getElementById("loginTab").classList.add("active");
      document.getElementById("registerTab").classList.remove("active");
      document.getElementById("loginForm").classList.add("active");
      document.getElementById("registerForm").classList.remove("active");
    });

    document.getElementById("registerTab")?.addEventListener("click", () => {
      document.getElementById("registerTab").classList.add("active");
      document.getElementById("loginTab").classList.remove("active");
      document.getElementById("registerForm").classList.add("active");
      document.getElementById("loginForm").classList.remove("active");
    });

    // Auth forms
    document
      .getElementById("loginFormElement")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const result = await this.login(email, password);
        this.showAuthMessage(
          result.message,
          result.success ? "success" : "error"
        );
      });

    document
      .getElementById("registerFormElement")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        const confirmPassword =
          document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
          this.showAuthMessage("Passwords do not match", "error");
          return;
        }

        const result = await this.register(email, password);
        this.showAuthMessage(
          result.message,
          result.success ? "success" : "error"
        );
      });

    // Header buttons
    document.getElementById("appLogo")?.addEventListener("click", () => {
      this.clearSubjectFilter();
    });

    document.getElementById("randomizeBtn")?.addEventListener("click", () => {
      this.toggleRandomization();
    });

    document.getElementById("importantBtn")?.addEventListener("click", () => {
      this.showImportantPage();
    });

    document.getElementById("subjectBtn")?.addEventListener("click", () => {
      this.showSubjectsPage();
    });

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      this.logout();
    });

    // Navigation buttons
    document.getElementById("backToHome")?.addEventListener("click", () => {
      this.clearSubjectFilter();
    });

    document.getElementById("backToSubjects")?.addEventListener("click", () => {
      this.showSubjectsPage();
    });

    document.getElementById("backToTopics")?.addEventListener("click", () => {
      if (this.currentSubjectId) {
        this.showTopicsPage(this.currentSubjectId);
      }
    });

    document
      .getElementById("backToHomeFromImportant")
      ?.addEventListener("click", () => {
        this.clearSubjectFilter();
      });

    document.getElementById("editSubjectBtn")?.addEventListener("click", () => {
      if (this.currentSubjectId) {
        this.showEditSubject(this.currentSubjectId);
      }
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

    // Click outside modal to close
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Subject form
    document
      .getElementById("subjectForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleSubjectSubmit();
      });

    // Topic form
    document
      .getElementById("topicForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleTopicSubmit();
      });

    // Question form
    document
      .getElementById("questionForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleQuestionSubmit();
      });

    // Subject dropdown change
    document
      .getElementById("questionSubject")
      ?.addEventListener("change", (e) => {
        this.populateTopicDropdown(e.target.value);
      });

    // Delete buttons
    document
      .getElementById("deleteSubjectBtn")
      ?.addEventListener("click", () => {
        if (this.editingSubject) {
          this.showConfirmation(
            "Delete Subject",
            `Are you sure you want to delete "${this.editingSubject.name}"? This will also delete all questions in this subject.`,
            () => this.handleDeleteSubject()
          );
        }
      });

    document.getElementById("deleteTopicBtn")?.addEventListener("click", () => {
      if (this.editingTopic) {
        this.showConfirmation(
          "Delete Topic",
          `Are you sure you want to delete "${this.editingTopic}"? This will also delete all questions in this topic.`,
          () => this.handleDeleteTopic()
        );
      }
    });

    document
      .getElementById("deleteQuestionBtn")
      ?.addEventListener("click", () => {
        if (this.editingQuestion) {
          this.showConfirmation(
            "Delete Question",
            "Are you sure you want to delete this question?",
            () => this.handleDeleteQuestion()
          );
        }
      });

    // Dynamic event delegation for question cards
    document.addEventListener("click", async (e) => {
      // Rating buttons
      if (e.target.classList.contains("rating-btn")) {
        const questionId = e.target.dataset.questionId;
        const rating = e.target.dataset.rating;
        if (questionId && rating) {
          await this.handleRateQuestion(questionId, rating);
        }
      }

      // Star buttons
      if (e.target.classList.contains("star-btn")) {
        const questionId = e.target.dataset.questionId;
        if (questionId) {
          await this.toggleImportant(questionId);
        }
      }

      // Edit question buttons
      if (
        e.target.classList.contains("edit-btn") &&
        e.target.dataset.questionId
      ) {
        const questionId = e.target.dataset.questionId;
        this.showEditQuestion(questionId);
      }

      // Delete question buttons
      if (
        e.target.classList.contains("delete-btn") &&
        e.target.dataset.questionId
      ) {
        const questionId = e.target.dataset.questionId;
        const question = this.questions.find((q) => q._id === questionId);
        if (question) {
          this.showConfirmation(
            "Delete Question",
            "Are you sure you want to delete this question?",
            async () => {
              try {
                await this.deleteQuestion(questionId);
                await this.loadData();
                if (this.showingImportant) {
                  this.renderImportantQuestions();
                } else {
                  this.renderHome();
                }
                this.updateStats();
              } catch (error) {
                console.error("Error deleting question:", error);
                alert("Error deleting question: " + error.message);
              }
            }
          );
        }
      }

      // Edit topic buttons
      if (e.target.classList.contains("topic-edit-btn")) {
        const topicName = e.target.dataset.topicName;
        if (topicName) {
          this.showEditTopic(topicName);
        }
      }

      // Delete topic buttons
      if (e.target.classList.contains("topic-delete-btn")) {
        const topicName = e.target.dataset.topicName;
        if (topicName) {
          this.showConfirmation(
            "Delete Topic",
            `Are you sure you want to delete "${topicName}"? This will also delete all questions in this topic.`,
            async () => {
              try {
                await this.deleteTopic(this.currentSubjectId, topicName);
                await this.loadData();
                this.renderTopics(this.currentSubjectId);
              } catch (error) {
                console.error("Error deleting topic:", error);
                alert("Error deleting topic: " + error.message);
              }
            }
          );
        }
      }
    });
  }

  // Form handlers
  async handleSubjectSubmit() {
    try {
      const name = document.getElementById("subjectName").value.trim();
      const icon = document.getElementById("subjectIcon").value.trim();
      const color = document.getElementById("subjectColor").value;

      if (!name || !icon) {
        alert("Please fill in all required fields");
        return;
      }

      const subjectData = { name, icon, color };

      if (this.editingSubject) {
        await this.updateSubject(this.editingSubject._id, subjectData);
      } else {
        await this.createSubject(subjectData);
      }

      await this.loadData();
      this.hideModal("subjectModal");

      if (this.editingSubject) {
        this.renderTopics(this.editingSubject._id);
      } else {
        this.renderSubjects();
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      alert("Error saving subject: " + error.message);
    }
  }

  async handleTopicSubmit() {
    try {
      const name = document.getElementById("topicName").value.trim();
      const subjectId = document.getElementById("topicSubjectId").value;

      if (!name || !subjectId) {
        alert("Please fill in all required fields");
        return;
      }

      if (this.editingTopic) {
        const originalName = document.getElementById("originalTopicName").value;
        await this.updateTopic(subjectId, originalName, name);
      } else {
        await this.addTopicToSubject(subjectId, name);
      }

      await this.loadData();
      this.hideModal("topicModal");
      this.renderTopics(subjectId);
    } catch (error) {
      console.error("Error saving topic:", error);
      alert("Error saving topic: " + error.message);
    }
  }

  async handleQuestionSubmit() {
    try {
      const text = document.getElementById("questionText").value.trim();
      const subjectId = document.getElementById("questionSubject").value;
      const topicName = document.getElementById("questionTopic").value;

      if (!text || !subjectId || !topicName) {
        alert("Please fill in all required fields");
        return;
      }

      const questionData = {
        text,
        subject: subjectId,
        topicName,
        important: false,
      };

      if (this.editingQuestion) {
        await this.updateQuestion(this.editingQuestion._id, questionData);
      } else {
        await this.createQuestion(questionData);
      }

      await this.loadData();
      this.hideModal("questionModal");

      if (this.showingImportant) {
        this.renderImportantQuestions();
      } else {
        this.renderHome();
      }
      this.updateStats();
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Error saving question: " + error.message);
    }
  }

  async handleDeleteSubject() {
    try {
      if (this.editingSubject) {
        await this.deleteSubject(this.editingSubject._id);
        await this.loadData();
        this.hideModal("subjectModal");
        this.showSubjectsPage();
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      alert("Error deleting subject: " + error.message);
    }
  }

  async handleDeleteTopic() {
    try {
      if (this.editingTopic && this.currentSubjectId) {
        await this.deleteTopic(this.currentSubjectId, this.editingTopic);
        await this.loadData();
        this.hideModal("topicModal");
        this.renderTopics(this.currentSubjectId);
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
      alert("Error deleting topic: " + error.message);
    }
  }

  async handleDeleteQuestion() {
    try {
      if (this.editingQuestion) {
        await this.deleteQuestion(this.editingQuestion._id);
        await this.loadData();
        this.hideModal("questionModal");

        if (this.showingImportant) {
          this.renderImportantQuestions();
        } else {
          this.renderHome();
        }
        this.updateStats();
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Error deleting question: " + error.message);
    }
  }

  showAuthMessage(message, type = "info") {
    const messageEl = document.getElementById("authMessage");
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `auth-message ${type}`;
      messageEl.classList.remove("hidden");

      setTimeout(() => {
        messageEl.classList.add("hidden");
      }, 5000);
    }
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  new QuestRecallApp();
});
