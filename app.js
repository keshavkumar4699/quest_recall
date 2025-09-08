// Data will be loaded from data.json
let questionBankData = null;

// Application state
let appState = {
  selectedSubject: null,
  selectedTopics: [],
  currentQuestions: [],
  markedQuestions: JSON.parse(localStorage.getItem("markedQuestions") || "[]"),
  questionLevels: JSON.parse(localStorage.getItem("questionLevels") || "{}"),
  isRandomized: false,
  isImportantMode: false,
  currentView: "subjects", // subjects, topics, questions, important
};

// Question levels
const QUESTION_LEVELS = {
  NOT_ATTEMPTED: 0,
  ATTEMPTED: 1,
  LEARNED: 2,
};

const LEVEL_LABELS = {
  0: "Not Attempted",
  1: "Attempted",
  2: "Learned",
};

// DOM elements
let elements = {};

// Initialize application
async function init() {
  console.log("Initializing Random Questions...");

  // Load data from data.json
  try {
    const response = await fetch("data.json");
    questionBankData = await response.json();
    console.log("Data loaded:", questionBankData);
  } catch (error) {
    console.error("Failed to load data.json:", error);
    alert("Failed to load question data. Please check if data.json exists.");
    return;
  }

  // Cache DOM elements
  cacheElements();

  // Load saved data from localStorage
  loadMarkedQuestions();
  loadQuestionLevels();

  // Update marked questions count
  updateMarkedCount();

  // Populate subject cards
  populateSubjectCards();

  // Bind event listeners
  bindEvents();

  // Show initial view
  showSubjectSelection();
}

// Cache DOM elements
function cacheElements() {
  elements = {
    // Subject selection
    subjectSelection: document.getElementById("subjectSelection"),
    subjectCards: document.getElementById("subjectCards"),

    // Topic selection
    topicSelection: document.getElementById("topicSelection"),
    selectedSubjectTitle: document.getElementById("selectedSubjectTitle"),
    questionCountInfo: document.getElementById("questionCountInfo"),
    topicGrid: document.getElementById("topicGrid"),
    selectAllTopicsBtn: document.getElementById("selectAllTopicsBtn"),
    deselectAllTopicsBtn: document.getElementById("deselectAllTopicsBtn"),
    startStudyingBtn: document.getElementById("startStudyingBtn"),

    // Questions
    questionsContainer: document.getElementById("questionsContainer"),
    questionsSubjectTitle: document.getElementById("questionsSubjectTitle"),
    questionStats: document.getElementById("questionStats"),
    questionsBox: document.getElementById("questionsBox"),

    // Important questions
    importantContainer: document.getElementById("importantContainer"),
    importantStats: document.getElementById("importantStats"),
    importantBox: document.getElementById("importantBox"),

    // Header
    toggleControls: document.getElementById("toggleControls"),
    randomizeToggle: document.getElementById("randomizeToggle"),
    importantModeToggle: document.getElementById("importantModeToggle"),
    markedQuestionsBtn: document.getElementById("markedQuestionsBtn"),
    markedCount: document.getElementById("markedCount"),

    // Navigation buttons
    backToSubjectsBtn: document.getElementById("backToSubjectsBtn"),
    backToTopicsBtn: document.getElementById("backToTopicsBtn"),
    backFromImportantBtn: document.getElementById("backFromImportantBtn"),
    randomizeMarkedBtn: document.getElementById("randomizeMarkedBtn"),

    // App logo
    appLogo: document.getElementById("appLogo"),
  };
}

// Bind event listeners
function bindEvents() {
  // Subject selection
  elements.backToSubjectsBtn?.addEventListener("click", showSubjectSelection);
  elements.appLogo?.addEventListener("click", showSubjectSelection);

  // Topic selection
  elements.selectAllTopicsBtn?.addEventListener("click", selectAllTopics);
  elements.deselectAllTopicsBtn?.addEventListener("click", deselectAllTopics);
  elements.startStudyingBtn?.addEventListener("click", showQuestions);
  elements.backToTopicsBtn?.addEventListener("click", showTopicSelection);

  // Important questions
  elements.backFromImportantBtn?.addEventListener("click", showQuestions);
  elements.randomizeMarkedBtn?.addEventListener(
    "click",
    randomizeMarkedQuestions
  );

  // Marked questions button
  elements.markedQuestionsBtn?.addEventListener(
    "click",
    showImportantQuestions
  );

  // Toggles
  elements.randomizeToggle?.addEventListener("change", handleRandomizeToggle);
  elements.importantModeToggle?.addEventListener(
    "change",
    handleImportantModeToggle
  );
}

// Load marked questions from localStorage
function loadMarkedQuestions() {
  const saved = localStorage.getItem("markedQuestions");
  if (saved) {
    appState.markedQuestions = JSON.parse(saved);
  }
}

// Save marked questions to localStorage
function saveMarkedQuestions() {
  localStorage.setItem(
    "markedQuestions",
    JSON.stringify(appState.markedQuestions)
  );
  updateMarkedCount();
}

// Load question levels from localStorage
function loadQuestionLevels() {
  const saved = localStorage.getItem("questionLevels");
  if (saved) {
    appState.questionLevels = JSON.parse(saved);
  }
}

// Save question levels to localStorage
function saveQuestionLevels() {
  localStorage.setItem(
    "questionLevels",
    JSON.stringify(appState.questionLevels)
  );
}

// Update marked questions count
function updateMarkedCount() {
  const importantCount = appState.markedQuestions.filter(
    (q) => q.isImportant
  ).length;
  if (elements.markedCount) {
    elements.markedCount.textContent = importantCount;
  }
}

// Generate unique question ID
function generateQuestionId(subjectKey, topicKey, questionIndex) {
  return `${subjectKey}_${topicKey}_${questionIndex}`;
}

// Get question level
function getQuestionLevel(questionId) {
  return appState.questionLevels[questionId] || QUESTION_LEVELS.NOT_ATTEMPTED;
}

// Set question level
function setQuestionLevel(questionId, level) {
  appState.questionLevels[questionId] = level;
  saveQuestionLevels();
}

// Toggle question level (for click functionality)
function toggleQuestionLevel(questionId) {
  const currentLevel = getQuestionLevel(questionId);
  let newLevel;

  // Cycle through: Not Attempted -> Attempted -> Learned -> Not Attempted
  switch (currentLevel) {
    case QUESTION_LEVELS.NOT_ATTEMPTED:
      newLevel = QUESTION_LEVELS.ATTEMPTED;
      break;
    case QUESTION_LEVELS.ATTEMPTED:
      newLevel = QUESTION_LEVELS.LEARNED;
      break;
    case QUESTION_LEVELS.LEARNED:
      newLevel = QUESTION_LEVELS.NOT_ATTEMPTED;
      break;
    default:
      newLevel = QUESTION_LEVELS.NOT_ATTEMPTED;
  }

  setQuestionLevel(questionId, newLevel);

  // Re-sort and refresh questions
  generateQuestions();
  displayQuestions();
}

// Navigation functions
function showSubjectSelection() {
  hideAllViews();
  elements.subjectSelection?.classList.remove("hidden");
  elements.toggleControls?.classList.add("hidden");
  elements.markedQuestionsBtn?.classList.remove("hidden");
  appState.currentView = "subjects";
}

function showTopicSelection() {
  if (!appState.selectedSubject) return;

  hideAllViews();
  elements.topicSelection?.classList.remove("hidden");
  elements.markedQuestionsBtn?.classList.add("hidden");

  const subject = questionBankData.subjects[appState.selectedSubject];
  elements.selectedSubjectTitle.textContent = `${subject.icon} ${subject.name}`;

  // Calculate total questions
  const totalQuestions = Object.values(subject.topics).reduce(
    (total, topic) => {
      return total + (topic.questions ? topic.questions.length : 0);
    },
    0
  );

  elements.questionCountInfo.textContent = `${totalQuestions} questions available`;

  populateTopicGrid();
  appState.currentView = "topics";
}

function showQuestions() {
  if (appState.selectedTopics.length === 0) {
    alert("Please select at least one topic!");
    return;
  }

  hideAllViews();
  elements.questionsContainer?.classList.remove("hidden");
  elements.toggleControls?.classList.remove("hidden");
  elements.markedQuestionsBtn?.classList.add("hidden");

  // Generate questions
  generateQuestions();
  displayQuestions();
  appState.currentView = "questions";
}

function showImportantQuestions() {
  hideAllViews();
  elements.importantContainer?.classList.remove("hidden");
  elements.markedQuestionsBtn?.classList.add("hidden");
  displayImportantQuestions();
  appState.currentView = "important";
}

function hideAllViews() {
  const views = [
    elements.subjectSelection,
    elements.topicSelection,
    elements.questionsContainer,
    elements.importantContainer,
  ];
  views.forEach((view) => view?.classList.add("hidden"));
}

// Subject functions
function populateSubjectCards() {
  const subjectsHTML = Object.keys(questionBankData.subjects)
    .map((subjectKey) => {
      const subject = questionBankData.subjects[subjectKey];
      const topicCount = Object.keys(subject.topics).length;
      const questionCount = Object.values(subject.topics).reduce(
        (total, topic) => {
          return total + (topic.questions ? topic.questions.length : 0);
        },
        0
      );

      return `
        <div class="subject-card" onclick="selectSubject('${subjectKey}')">
          <div class="subject-icon">${subject.icon}</div>
          <h3 class="subject-name">${subject.name}</h3>
          <p class="subject-info">${topicCount} topics • ${questionCount} questions</p>
          <button class="subject-select-btn">Select Subject</button>
        </div>
      `;
    })
    .join("");

  if (elements.subjectCards) {
    elements.subjectCards.innerHTML = subjectsHTML;
  }
}

// Topic functions
function populateTopicGrid() {
  const subject = questionBankData.subjects[appState.selectedSubject];
  const topicsHTML = Object.keys(subject.topics)
    .map((topicKey) => {
      const topic = subject.topics[topicKey];
      const questionCount = topic.questions ? topic.questions.length : 0;
      const isSelected = appState.selectedTopics.includes(topicKey);

      return `
        <div class="topic-card">
          <div class="topic-checkbox">
            <input 
              type="checkbox" 
              id="topic_${topicKey}" 
              class="topic-input" 
              ${isSelected ? "checked" : ""}
              onchange="toggleTopic('${topicKey}')"
            />
            <label for="topic_${topicKey}" class="topic-label">
              <span class="topic-name">${topic.name}</span>
              <span class="topic-count">${questionCount} questions</span>
            </label>
          </div>
        </div>
      `;
    })
    .join("");

  if (elements.topicGrid) {
    elements.topicGrid.innerHTML = topicsHTML;
  }
}

// Question functions
function generateQuestions() {
  const subject = questionBankData.subjects[appState.selectedSubject];
  const questions = [];

  appState.selectedTopics.forEach((topicKey) => {
    const topic = subject.topics[topicKey];
    if (topic.questions) {
      topic.questions.forEach((question, index) => {
        const questionId = generateQuestionId(appState.selectedSubject, topicKey, index);
        
        // If in important mode, only include marked questions
        if (appState.isImportantMode && !isQuestionMarked(questionId)) {
          return;
        }
        
        questions.push({
          id: questionId,
          question,
          subjectKey: appState.selectedSubject,
          topicKey,
          topicName: topic.name,
          index,
          level: getQuestionLevel(questionId),
          isImportant: isQuestionMarked(questionId)
        });
      });
    }
  });

  // Sort questions: Not Attempted -> Attempted -> Learned
  questions.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    return 0; // Keep original order for same level
  });

  if (appState.isRandomized) {
    // Randomize within each level
    const levels = [
      QUESTION_LEVELS.NOT_ATTEMPTED,
      QUESTION_LEVELS.ATTEMPTED,
      QUESTION_LEVELS.LEARNED,
    ];
    const sortedQuestions = [];

    levels.forEach((level) => {
      const levelQuestions = questions.filter((q) => q.level === level);
      shuffleArray(levelQuestions);
      sortedQuestions.push(...levelQuestions);
    });

    appState.currentQuestions = sortedQuestions;
  } else {
    appState.currentQuestions = questions;
  }
}

function displayQuestions() {
  const subject = questionBankData.subjects[appState.selectedSubject];
  if (elements.questionsSubjectTitle) {
    elements.questionsSubjectTitle.textContent = `${subject.icon} ${subject.name} Questions`;
  }

  if (elements.questionStats) {
    elements.questionStats.textContent = `${appState.currentQuestions.length} questions selected`;
  }

  if (!elements.questionsBox) return;

  if (appState.currentQuestions.length === 0) {
    elements.questionsBox.innerHTML = `
      <div class="empty-state">
        <h3>No Questions Found</h3>
        <p>Please select topics with questions to study.</p>
        <button class="btn btn--primary" onclick="showTopicSelection()">Select Topics</button>
      </div>
    `;
    return;
  }

  const questionsHTML = appState.currentQuestions
    .map((q, index) => {
      const isMarked = isQuestionMarked(q.id);
      // Determine slider position based on question level
      let sliderPosition = "not-attempted";
      let sliderLabel = "Not Attempted";

      if (q.level === QUESTION_LEVELS.ATTEMPTED) {
        sliderPosition = "attempted";
        sliderLabel = "Attempted";
      } else if (q.level === QUESTION_LEVELS.LEARNED) {
        sliderPosition = "learned";
        sliderLabel = "Learned";
      }

      return `
        <div class="question-item" onclick="toggleQuestionLevel('${q.id}')">
          <div class="question-header">
            <div class="question-number">Q${index + 1}</div>

            <div class="status-controls">
              <div class="status-slider">
                <div class="slider-track">
                  <div class="slider-thumb ${sliderPosition}"></div>
                </div>
                <div class="slider-label">${sliderLabel}</div>
              </div>
            </div>

            <div class="question-actions">
              <button 
                class="star-btn ${isMarked ? "active" : ""}" 
                onclick="event.stopPropagation(); toggleQuestionMark('${q.id}')"
                title="${
                  isMarked ? "Remove from important" : "Mark as important"
                }"
              >
                ${isMarked ? "⭐" : "☆"}
              </button>
            </div>
          </div>
          <div class="question-content">
            <div class="question-text">${q.question}</div>
          </div>
        </div>
      `;
    })
    .join("");

  elements.questionsBox.innerHTML = questionsHTML;
}

function displayImportantQuestions() {
  const importantQuestions = appState.markedQuestions.filter(
    (q) => q.isImportant
  );

  if (elements.importantStats) {
    elements.importantStats.textContent = `${importantQuestions.length} important questions`;
  }

  if (!elements.importantBox) return;

  if (importantQuestions.length === 0) {
    elements.importantBox.innerHTML = `
      <div class="empty-state">
        <h3>No Important Questions</h3>
        <p>Mark some questions as important to see them here.</p>
        <button class="btn btn--primary" onclick="showSubjectSelection()">Browse Questions</button>
      </div>
    `;
    return;
  }

  const questionsHTML = importantQuestions
    .map((q, index) => {
      const level = getQuestionLevel(q.id);
      const levelText = LEVEL_LABELS[level];

      return `
        <div class="question-item" onclick="toggleQuestionLevel('${q.id}')">
          <div class="question-header">
            <div class="question-number">Q${index + 1}</div>

            <div class="level-control">
              <div class="level-slider-container">
                <div class="level-text">${levelText}</div>
              </div>
            </div>

            <div class="question-actions">
              <button 
                class="star-btn active" 
                onclick="event.stopPropagation(); toggleQuestionMark('${q.id}')"
                title="Remove from important"
              >
                ⭐
              </button>
            </div>
          </div>
          <div class="question-content">
            <div class="question-text">${q.question}</div>
          </div>
        </div>
      `;
    })
    .join("");

  elements.importantBox.innerHTML = questionsHTML;
}

// Question marking functions
function isQuestionMarked(questionId) {
  return appState.markedQuestions.some(
    (q) => q.id === questionId && q.isImportant
  );
}

function toggleQuestionMark(questionId) {
  const questionIndex = appState.markedQuestions.findIndex(
    (q) => q.id === questionId
  );

  if (questionIndex >= 0) {
    // Question exists, toggle important status
    const question = appState.markedQuestions[questionIndex];
    if (question.isImportant) {
      // Remove from important
      appState.markedQuestions.splice(questionIndex, 1);
    } else {
      // Mark as important
      question.isImportant = true;
    }
  } else {
    // Question doesn't exist, add as important
    const currentQuestion = appState.currentQuestions.find(
      (q) => q.id === questionId
    );
    if (currentQuestion) {
      appState.markedQuestions.push({
        id: questionId,
        question: currentQuestion.question,
        subjectKey: currentQuestion.subjectKey,
        topicKey: currentQuestion.topicKey,
        topicName: currentQuestion.topicName,
        isImportant: true,
      });
    }
  }

  saveMarkedQuestions();

  // Refresh current view
  if (appState.currentView === "questions") {
    displayQuestions();
  } else if (appState.currentView === "important") {
    displayImportantQuestions();
  }
}

// Topic selection functions
function selectSubject(subjectKey) {
  appState.selectedSubject = subjectKey;
  appState.selectedTopics = [];
  showTopicSelection();
}

function toggleTopic(topicKey) {
  const index = appState.selectedTopics.indexOf(topicKey);
  if (index >= 0) {
    appState.selectedTopics.splice(index, 1);
  } else {
    appState.selectedTopics.push(topicKey);
  }
}

function selectAllTopics() {
  const subject = questionBankData.subjects[appState.selectedSubject];
  appState.selectedTopics = Object.keys(subject.topics);
  populateTopicGrid();
}

function deselectAllTopics() {
  appState.selectedTopics = [];
  populateTopicGrid();
}

// Toggle functions
function handleRandomizeToggle(event) {
  appState.isRandomized = event.target.checked;
  if (appState.currentView === "questions") {
    generateQuestions();
    displayQuestions();
  }
}

function handleImportantModeToggle(event) {
  appState.isImportantMode = event.target.checked;
  if (appState.currentView === "questions") {
    generateQuestions();
    displayQuestions();
  }
}

function randomizeMarkedQuestions() {
  if (appState.currentView === "important") {
    const importantQuestions = appState.markedQuestions.filter(
      (q) => q.isImportant
    );
    shuffleArray(importantQuestions);

    // Update the markedQuestions array to maintain the new order
    appState.markedQuestions = appState.markedQuestions.filter(
      (q) => !q.isImportant
    );
    appState.markedQuestions.push(...importantQuestions);

    displayImportantQuestions();
  }
}

// Utility functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
