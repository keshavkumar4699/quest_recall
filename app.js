// Study Buddy - Question Bank Application

// Application state
let appState = {
    selectedSubject: null,
    selectedTopics: [],
    currentQuestions: [],
    reviewQuestions: JSON.parse(localStorage.getItem('reviewQuestions') || '[]'),
    isRandomized: false,
    isReviewMode: false,
    currentView: 'subjects', // subjects, topics, questions, review
    questionBankData: null // Will store loaded JSON data
};

// Subject metadata (icons and colors)
const subjectMetadata = {
    mathematics: {
        icon: "🧮",
        color: "#FF6B6B"
    },
    science: {
        icon: "🔬", 
        color: "#4ECDC4"
    },
    history: {
        icon: "📚",
        color: "#FFD93D"
    },
    english: {
        icon: "📖",
        color: "#6C5CE7"
    }
};

// DOM elements
let elements = {};

// Initialize application
async function init() {
    console.log('Initializing Study Buddy...');

    try {
        // Load JSON data
        await loadQuestionBankData();

        // Hide loading overlay
        hideLoadingOverlay();

        // Cache DOM elements
        cacheElements();

        // Load review questions from localStorage
        loadReviewQuestions();

        // Populate subject cards
        populateSubjectCards();

        // Bind event listeners
        bindEvents();

        // Show initial view
        showSubjectSelection();

    } catch (error) {
        console.error('Error initializing application:', error);
        hideLoadingOverlay();
        showError('Failed to load question data. Please refresh the page.');
    }
}

// Hide loading overlay
function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingIndicator');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    document.body.classList.add('data-loaded');
}

// Load JSON data from data.json file
async function loadQuestionBankData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        appState.questionBankData = await response.json();

        // Add metadata to the loaded data
        Object.keys(appState.questionBankData.subjects).forEach(subjectKey => {
            if (subjectMetadata[subjectKey]) {
                appState.questionBankData.subjects[subjectKey].icon = subjectMetadata[subjectKey].icon;
                appState.questionBankData.subjects[subjectKey].color = subjectMetadata[subjectKey].color;
            }
        });

        console.log('Question bank data loaded successfully');
    } catch (error) {
        console.error('Error loading question bank data:', error);
        throw error;
    }
}

// Show error message
function showError(message) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <h2>⚠️ Error</h2>
                <p>${message}</p>
                <button class="btn btn--primary" onclick="location.reload()">Reload Page</button>
            </div>
        `;
    }
}

// Cache DOM elements
function cacheElements() {
    elements = {
        // Subject selection
        subjectSelection: document.getElementById('subjectSelection'),
        subjectCards: document.getElementById('subjectCards'),

        // Topic selection
        topicSelection: document.getElementById('topicSelection'),
        selectedSubjectTitle: document.getElementById('selectedSubjectTitle'),
        topicGrid: document.getElementById('topicGrid'),
        selectAllTopicsBtn: document.getElementById('selectAllTopicsBtn'),
        deselectAllTopicsBtn: document.getElementById('deselectAllTopicsBtn'),
        startStudyingBtn: document.getElementById('startStudyingBtn'),

        // Questions
        questionsContainer: document.getElementById('questionsContainer'),
        questionsSubjectTitle: document.getElementById('questionsSubjectTitle'),
        questionStats: document.getElementById('questionStats'),
        questionsList: document.getElementById('questionsList'),

        // Review
        reviewContainer: document.getElementById('reviewContainer'),
        reviewStats: document.getElementById('reviewStats'),
        reviewList: document.getElementById('reviewList'),

        // Header
        headerSearchContainer: document.getElementById('headerSearchContainer'),
        headerSubjectSelect: document.getElementById('headerSubjectSelect'),
        toggleControls: document.getElementById('toggleControls'),
        randomizeToggle: document.getElementById('randomizeToggle'),
        reviewModeToggle: document.getElementById('reviewModeToggle'),

        // Navigation buttons
        backToSubjectsBtn: document.getElementById('backToSubjectsBtn'),
        backToTopicsBtn: document.getElementById('backToTopicsBtn'),
        backFromReviewBtn: document.getElementById('backFromReviewBtn'),
        changeSubjectBtn: document.getElementById('changeSubjectBtn')
    };
}

// Bind event listeners
function bindEvents() {
    // Subject selection
    elements.backToSubjectsBtn?.addEventListener('click', showSubjectSelection);
    elements.changeSubjectBtn?.addEventListener('click', showSubjectSelection);

    // Topic selection
    elements.selectAllTopicsBtn?.addEventListener('click', selectAllTopics);
    elements.deselectAllTopicsBtn?.addEventListener('click', deselectAllTopics);
    elements.startStudyingBtn?.addEventListener('click', showQuestions);
    elements.backToTopicsBtn?.addEventListener('click', showTopicSelection);

    // Review
    elements.backFromReviewBtn?.addEventListener('click', showQuestions);

    // Header subject select
    elements.headerSubjectSelect?.addEventListener('change', handleHeaderSubjectChange);

    // Toggles
    elements.randomizeToggle?.addEventListener('change', handleRandomizeToggle);
    elements.reviewModeToggle?.addEventListener('change', handleReviewModeToggle);
}

// Navigation functions
function showSubjectSelection() {
    hideAllViews();
    elements.subjectSelection?.classList.remove('hidden');
    elements.headerSearchContainer?.classList.add('hidden');
    elements.toggleControls?.classList.add('hidden');
    appState.currentView = 'subjects';
}

function showTopicSelection() {
    if (!appState.selectedSubject || !appState.questionBankData) return;

    hideAllViews();
    elements.topicSelection?.classList.remove('hidden');

    const subject = appState.questionBankData.subjects[appState.selectedSubject];
    elements.selectedSubjectTitle.textContent = 
        `${subject.icon || '📚'} ${subject.name} Topics`;

    populateTopicGrid();
    appState.currentView = 'topics';
}

function showQuestions() {
    if (appState.selectedTopics.length === 0) {
        alert('Please select at least one topic!');
        return;
    }

    hideAllViews();
    elements.questionsContainer?.classList.remove('hidden');
    elements.headerSearchContainer?.classList.remove('hidden');
    elements.toggleControls?.classList.remove('hidden');

    // Update header with current subject
    populateHeaderSubjects();

    // Generate questions
    generateQuestions();
    displayQuestions();
    appState.currentView = 'questions';
}

function showReviewQuestions() {
    hideAllViews();
    elements.reviewContainer?.classList.remove('hidden');
    displayReviewQuestions();
    appState.currentView = 'review';
}

function hideAllViews() {
    const views = [
        elements.subjectSelection,
        elements.topicSelection, 
        elements.questionsContainer,
        elements.reviewContainer
    ];
    views.forEach(view => view?.classList.add('hidden'));
}

// Subject functions
function populateSubjectCards() {
    if (!appState.questionBankData) return;

    const subjectsHTML = Object.keys(appState.questionBankData.subjects).map(subjectKey => {
        const subject = appState.questionBankData.subjects[subjectKey];
        const topicCount = Object.keys(subject.topics).length;
        const icon = subject.icon || '📚';
        const color = subject.color || '#4ECDC4';

        return `
            <div class="subject-card" data-subject="${subjectKey}" style="--subject-color: ${color}">
                <div class="subject-icon">${icon}</div>
                <h3 class="subject-name">${subject.name}</h3>
                <p class="subject-info">${topicCount} topics available</p>
                <button class="subject-select-btn">Select Subject</button>
            </div>
        `;
    }).join('');

    elements.subjectCards.innerHTML = subjectsHTML;

    // Bind subject card clicks
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const subjectKey = card.dataset.subject;
            selectSubject(subjectKey);
        });
    });
}

function selectSubject(subjectKey) {
    appState.selectedSubject = subjectKey;
    appState.selectedTopics = [];
    showTopicSelection();
}

// Topic functions
function populateTopicGrid() {
    if (!appState.selectedSubject || !appState.questionBankData) return;

    const subject = appState.questionBankData.subjects[appState.selectedSubject];
    const topicsHTML = Object.keys(subject.topics).map(topicKey => {
        const topic = subject.topics[topicKey];
        const questionCount = topic.questions.length;

        return `
            <div class="topic-card" data-topic="${topicKey}">
                <div class="topic-checkbox">
                    <input type="checkbox" id="topic-${topicKey}" class="topic-input" value="${topicKey}">
                    <label for="topic-${topicKey}" class="topic-label">
                        <span class="topic-name">${topic.name}</span>
                        <span class="topic-count">${questionCount} questions</span>
                    </label>
                </div>
            </div>
        `;
    }).join('');

    elements.topicGrid.innerHTML = topicsHTML;

    // Bind topic selection
    document.querySelectorAll('.topic-input').forEach(input => {
        input.addEventListener('change', handleTopicSelection);
    });
}

function handleTopicSelection() {
    const checkedTopics = document.querySelectorAll('.topic-input:checked');
    appState.selectedTopics = Array.from(checkedTopics).map(input => input.value);

    // Update start button state
    elements.startStudyingBtn.disabled = appState.selectedTopics.length === 0;
}

function selectAllTopics() {
    document.querySelectorAll('.topic-input').forEach(input => {
        input.checked = true;
    });
    handleTopicSelection();
}

function deselectAllTopics() {
    document.querySelectorAll('.topic-input').forEach(input => {
        input.checked = false;
    });
    handleTopicSelection();
}

// Question functions
function generateQuestions() {
    if (!appState.selectedSubject || appState.selectedTopics.length === 0 || !appState.questionBankData) return;

    const subject = appState.questionBankData.subjects[appState.selectedSubject];
    appState.currentQuestions = [];

    // Collect questions from selected topics
    appState.selectedTopics.forEach(topicKey => {
        const topic = subject.topics[topicKey];
        if (topic && topic.questions) {
            topic.questions.forEach((questionText, index) => {
                const questionId = `${appState.selectedSubject}-${topicKey}-${index}`;
                appState.currentQuestions.push({
                    id: questionId,
                    question: questionText,
                    topic: topic.name,
                    topicKey: topicKey,
                    subjectKey: appState.selectedSubject
                });
            });
        }
    });

    // Randomize if enabled
    if (appState.isRandomized) {
        appState.currentQuestions = shuffleArray([...appState.currentQuestions]);
    }
}

function displayQuestions() {
    if (!appState.questionBankData) return;

    const subject = appState.questionBankData.subjects[appState.selectedSubject];
    elements.questionsSubjectTitle.textContent = `${subject.icon || '📚'} ${subject.name} Questions`;

    let questionsToShow = appState.currentQuestions;

    // Filter for review mode
    if (appState.isReviewMode) {
        questionsToShow = appState.currentQuestions.filter(q => 
            appState.reviewQuestions.includes(q.id)
        );

        if (questionsToShow.length === 0) {
            elements.questionsList.innerHTML = `
                <div class="empty-state">
                    <h3>No questions marked for review yet!</h3>
                    <p>Mark some questions as review to see them here.</p>
                </div>
            `;
            elements.questionStats.textContent = '0 questions in review mode';
            return;
        }
    }

    elements.questionStats.textContent = `${questionsToShow.length} questions`;

    const questionsHTML = questionsToShow.map((question, index) => {
        const isReviewed = appState.reviewQuestions.includes(question.id);

        return `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-header">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="question-topic">${question.topic}</span>
                    <button class="review-btn ${isReviewed ? 'active' : ''}" 
                            data-question-id="${question.id}"
                            title="${isReviewed ? 'Remove from review' : 'Mark for review'}">
                        ${isReviewed ? '📌' : '📍'}
                    </button>
                </div>
                <div class="question-content">
                    <p class="question-text">${question.question}</p>
                </div>
            </div>
        `;
    }).join('');

    elements.questionsList.innerHTML = questionsHTML;

    // Bind review buttons
    document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', handleReviewToggle);
    });
}

function displayReviewQuestions() {
    if (!appState.questionBankData) return;

    if (appState.reviewQuestions.length === 0) {
        elements.reviewList.innerHTML = `
            <div class="empty-state">
                <h3>No questions marked for review yet!</h3>
                <p>Start studying and mark questions for review to build your collection.</p>
                <button class="btn btn--primary" onclick="showSubjectSelection()">Start Studying</button>
            </div>
        `;
        elements.reviewStats.textContent = '0 questions marked for review';
        return;
    }

    elements.reviewStats.textContent = `${appState.reviewQuestions.length} questions marked for review`;

    // Get full question data for review questions
    const reviewQuestionsData = [];
    appState.reviewQuestions.forEach(questionId => {
        const [subjectKey, topicKey, questionIndex] = questionId.split('-');
        const subject = appState.questionBankData.subjects[subjectKey];
        if (subject && subject.topics[topicKey]) {
            const topic = subject.topics[topicKey];
            const questionText = topic.questions[parseInt(questionIndex)];
            if (questionText) {
                reviewQuestionsData.push({
                    id: questionId,
                    question: questionText,
                    topic: topic.name,
                    subject: subject.name,
                    subjectIcon: subject.icon || '📚'
                });
            }
        }
    });

    const reviewHTML = reviewQuestionsData.map((question, index) => `
        <div class="question-card review-question">
            <div class="question-header">
                <span class="question-number">R${index + 1}</span>
                <span class="question-subject">${question.subjectIcon} ${question.subject}</span>
                <span class="question-topic">${question.topic}</span>
                <button class="review-btn active" 
                        data-question-id="${question.id}"
                        title="Remove from review">
                    📌
                </button>
            </div>
            <div class="question-content">
                <p class="question-text">${question.question}</p>
            </div>
        </div>
    `).join('');

    elements.reviewList.innerHTML = reviewHTML;

    // Bind review buttons
    document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', handleReviewToggle);
    });
}

// Review functionality
function handleReviewToggle(event) {
    event.stopPropagation();
    const questionId = event.target.dataset.questionId;

    if (appState.reviewQuestions.includes(questionId)) {
        // Remove from review
        appState.reviewQuestions = appState.reviewQuestions.filter(id => id !== questionId);
        event.target.classList.remove('active');
        event.target.textContent = '📍';
        event.target.title = 'Mark for review';
    } else {
        // Add to review
        appState.reviewQuestions.push(questionId);
        event.target.classList.add('active');
        event.target.textContent = '📌';
        event.target.title = 'Remove from review';
    }

    // Save to localStorage
    saveReviewQuestions();

    // If in review mode, refresh display
    if (appState.currentView === 'review') {
        displayReviewQuestions();
    } else if (appState.isReviewMode) {
        displayQuestions();
    }
}

function saveReviewQuestions() {
    localStorage.setItem('reviewQuestions', JSON.stringify(appState.reviewQuestions));
}

function loadReviewQuestions() {
    appState.reviewQuestions = JSON.parse(localStorage.getItem('reviewQuestions') || '[]');
}

// Header functions
function populateHeaderSubjects() {
    if (!appState.questionBankData) return;

    const subjectOptions = Object.keys(appState.questionBankData.subjects).map(key => {
        const subject = appState.questionBankData.subjects[key];
        const selected = key === appState.selectedSubject ? 'selected' : '';
        return `<option value="${key}" ${selected}>${subject.icon || '📚'} ${subject.name}</option>`;
    }).join('');

    elements.headerSubjectSelect.innerHTML = '<option value="">Choose a different subject...</option>' + subjectOptions;
}

function handleHeaderSubjectChange() {
    const selectedSubject = elements.headerSubjectSelect.value;
    if (selectedSubject && selectedSubject !== appState.selectedSubject) {
        selectSubject(selectedSubject);
    }
}

// Toggle functions
function handleRandomizeToggle() {
    appState.isRandomized = elements.randomizeToggle.checked;
    if (appState.currentView === 'questions') {
        generateQuestions();
        displayQuestions();
    }
}

function handleReviewModeToggle() {
    appState.isReviewMode = elements.reviewModeToggle.checked;

    if (appState.isReviewMode) {
        // Switch to review mode - show only review questions
        displayQuestions();
    } else {
        // Switch back to normal mode - show all questions
        displayQuestions();
    }
}

// Utility functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);