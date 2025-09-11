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

  init() {
    this.loadSubjectsData();
    this.generateQuestions();
    this.loadQuestionStates();
    this.renderHome();
    this.renderSubjects();
    this.updateStats();
    this.bindEvents();
  }

  // Load subjects data from the provided JSON
  loadSubjectsData() {
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
          keyMovements: {
            name: "Key Movements",
            questions: [
              "What were the main features of the Non-Cooperation Movement?",
              "Describe the events of the Salt Satyagraha",
              "Explain the Quit India Movement and its consequences",
              "What was the significance of the Swadeshi Movement?",
            ],
          },
          prominentLeaders: {
            name: "Prominent Leaders",
            questions: [
              "Describe Mahatma Gandhi's philosophy of Satyagraha",
              "What was Subhas Chandra Bose's contribution to the freedom struggle?",
              "Explain Jawaharlal Nehru's vision for independent India",
              "What role did Bhagat Singh play in the Indian independence movement?",
            ],
          },
        },
      },
      artCulture: {
        name: "Art and Culture",
        icon: "🎨",
        color: "#ff9ff3",
        topics: {
          indianArchitecture: {
            name: "Indian Architecture",
            questions: [
              "Describe the key features of Mughal architecture",
              "What are the distinguishing characteristics of Dravidian architecture?",
              "Explain the significance of temple architecture in ancient India",
              "How did colonial rule influence Indian architecture?",
            ],
          },
          performingArts: {
            name: "Performing Arts",
            questions: [
              "Describe the eight classical dance forms of India",
              "What are the key elements of Indian classical music?",
              "Explain the history and significance of Sanskrit theater",
              "How are folk performing arts different from classical forms?",
            ],
          },
          visualArts: {
            name: "Visual Arts",
            questions: [
              "Describe the evolution of Indian painting styles",
              "What are the key characteristics of Madhubani painting?",
              "Explain the significance of cave paintings at Ajanta and Ellora",
              "How has contemporary Indian art evolved from traditional forms?",
            ],
          },
        },
      },
      currentAffairs: {
        name: "Current Affairs",
        icon: "📰",
        color: "#54a0ff",
        topics: {
          internationalNews: {
            name: "International News",
            questions: [
              "What are the current major global environmental concerns?",
              "Describe recent developments in international space exploration",
              "Explain the impact of recent trade agreements on global economy",
              "What are the key issues being discussed in current UN meetings?",
            ],
          },
          nationalNews: {
            name: "National News",
            questions: [
              "What is the name of the AI app launched to preserve tribal languages? and which ministry launched it?",
              "Which technology will be used in Census 2027 for geo-tagging all buildings?",
              "What are the recent economic reforms introduced in India?",
              "Describe the current government initiatives for digital India",
              "Explain recent changes in education policy",
              "What are the key infrastructure projects currently underway?",
            ],
          },
          businessEconomy: {
            name: "Business & Economy",
            questions: [
              "What is the current state of India's GDP growth?",
              "Describe recent trends in the Indian stock market",
              "Explain the impact of recent RBI policies on inflation",
              "What are the current challenges facing India's manufacturing sector?",
            ],
          },
        },
      },
      economics: {
        name: "Economics",
        icon: "💹",
        color: "#1dd1a1",
        topics: {
          basicsOfEconomics: {
            name: "Basics of Economics",
            questions: [
              "What is the difference between microeconomics and macroeconomics?",
              "What do you understand by Primary, Secondary and Tertiary sectors of economy? Give examples.",
              "What is law of Supply and Demand?",
              "How Demand, Supply and Price are related to each other?",
            ],
          },
          nationalIncome: {
            name: "National Income",
            questions: [
              "What are factors of production?",
              "What does the factors of production get in return?",
              "What is the complete production process?",
              "What are the factors of consumption?",
            ],
          },
          money: {
            name: "Money",
            questions: [
              "Describe the flow of money in an economy.",
              "What is monetary policy?",
              "What does it mean to have tight and loose monetary policy?",
              "What are the effects of tight and loose monetary policy?",
            ],
          },
          banking: {
            name: "Banking",
            questions: [
              "What are the functions of commercial banks?",
              "Describe the role of the Reserve Bank of India",
              "Explain the concept of credit creation by banks",
              "What are the different types of bank accounts?",
            ],
          },
          microeconomics: {
            name: "Microeconomics",
            questions: [
              "Explain the law of demand and its exceptions",
              "What is price elasticity of demand and how is it measured?",
              "Describe the different market structures in microeconomics",
              "How do firms determine their optimal output level?",
            ],
          },
          macroeconomics: {
            name: "Macroeconomics",
            questions: [
              "What are the components of GDP and how are they calculated?",
              "Explain the Phillips Curve and its implications",
              "Describe the tools of monetary policy used by central banks",
              "What is fiscal policy and how does it affect the economy?",
            ],
          },
          indianEconomy: {
            name: "Indian Economy",
            questions: [
              "Describe the structure of India's GDP by sector",
              "What are the major challenges facing Indian agriculture?",
              "Explain the impact of GST on the Indian economy",
              "What are the key initiatives under 'Make in India'?",
            ],
          },
        },
      },
      polity: {
        name: "Polity",
        icon: "🏛️",
        color: "#f368e0",
        topics: {
          historicalBackground: {
            name: "Historical Background",
            questions: [
              "what was the first step taken by the British to establish their control on East India Company? and when?",
              "What were the two main provisions of the Regulating Act of 1773?",
              "When was the Supreme Court of Calcutta established with how many judges?",
              "What was the other name of Act of 1781?",
            ],
          },
          makingOfConstitution: {
            name: "Making of the Constitution of India",
            questions: [
              "Who gave the idea of a Constituent Assembly for India and when?",
              "When was the demand for Constituent Assembly was raised by the Indian National Congress?",
              "What was idea for formation of Constituent Assembly given by Nehru?",
              "When was the Constituent Assembly for India demand was accepted by the British government and what was it named?",
            ],
          },
          salientFeatures: {
            name: "Salient Features of the Constitution",
            questions: [
              "How are three pillars of democracy are established through the constitution and how they are related to each other?",
              "How British Parliamentary sytem is different from Indian Parliamentary system?",
              "What is the other name of Parliamentary form of government?",
              "How Indian judiciary is different from American judiciary?",
            ],
          },
          preamble: {
            name: "Preamble",
            questions: [
              "What does the Preamble of the Constitution reflect?",
              "When was it amended and what was amended?",
              "What is meaning of word 'Sovereign' in the Preamble?",
              "What is meaning of word 'Socialist' in the Preamble? And when was it added?",
            ],
          },
          unionAndItsTerritory: {
            name: "Union and its Territory",
            questions: [
              "What does Article 1 of the Constitution state?",
              "What are two reasons for which India is called a 'Union of States' not 'Federation of States'?",
              "Under which article of the constitution the territory of India is defined? and what does it include?",
              "What is given in the First Schedule of the Constitution?",
            ],
          },
          citizenship: {
            name: "Citizenship",
            questions: [
              "What are the different ways in which a person can acquire Indian citizenship?",
              "What are the rights and duties of Indian citizens as per the Constitution?",
              "How can Indian citizenship be terminated or revoked?",
              "What is the significance of the Citizenship Amendment Act, 2019?",
            ],
          },
          fundamentalRights: {
            name: "Fundamental Rights",
            questions: [
              "What are the six fundamental rights guaranteed by the Indian Constitution?",
              "Explain the significance of the Right to Equality (Articles 14-18)",
              "Describe the Right to Freedom (Articles 19-22) and its limitations",
              "What is the Right against Exploitation (Articles 23-24) and how does it protect citizens?",
            ],
          },
          governance: {
            name: "Governance",
            questions: [
              "What are the key features of the Panchayati Raj system?",
              "Describe the role of the Central Vigilance Commission",
              "Explain the significance of the Right to Information Act",
              "What are the recent reforms in Indian governance?",
            ],
          },
        },
      },
      accountingAuditing: {
        name: "Accounting and Auditing",
        icon: "📊",
        color: "#ff9f43",
        topics: {
          financialAccounting: {
            name: "Financial Accounting",
            questions: [
              "Explain the accounting equation and its components",
              "What are the generally accepted accounting principles (GAAP)?",
              "Describe the process of preparing financial statements",
              "How are assets valued and depreciated in accounting?",
            ],
          },
          auditingStandards: {
            name: "Auditing Standards",
            questions: [
              "What are the generally accepted auditing standards (GAAS)?",
              "Describe the different types of audit opinions",
              "Explain the auditor's responsibility for detecting fraud",
              "What is the process of internal control evaluation?",
            ],
          },
          corporateAccounting: {
            name: "Corporate Accounting",
            questions: [
              "How are corporate financial statements different from other entities?",
              "Describe the process of merger and acquisition accounting",
              "Explain the concept of goodwill and its accounting treatment",
              "What are the accounting requirements for public companies?",
            ],
          },
        },
      },
      computerApplications: {
        name: "Computer Applications",
        icon: "💻",
        color: "#0abde3",
        topics: {
          basicsOfComputers: {
            name: "Basics of Computers",
            questions: [
              "What is MAR?",
              "What is MDR?",
              "What is GPR",
              "What is EPROM",
              "What is EEEROM",
              "What is SRAM",
              "What is DRAM",
            ],
          },
          softwareApplications: {
            name: "Software Applications",
            questions: [
              "Describe the different types of application software",
              "What are the key features of office productivity suites?",
              "Explain the difference between proprietary and open source software",
              "How do database management systems work?",
            ],
          },
          webTechnologies: {
            name: "Web Technologies",
            questions: [
              "What are the main components of web development?",
              "Describe the difference between front-end and back-end development",
              "Explain how responsive web design works",
              "What are the current trends in web technologies?",
            ],
          },
          mobileApplications: {
            name: "Mobile Applications",
            questions: [
              "What are the different approaches to mobile app development?",
              "Describe the app development lifecycle",
              "Explain the difference between native and hybrid apps",
              "What are the key considerations for mobile UI/UX design?",
            ],
          },
        },
      },
      reasoning: {
        name: "Reasoning",
        icon: "🧠",
        color: "#a55eea",
        topics: {
          logicalReasoning: {
            name: "Logical Reasoning",
            questions: [
              "Explain the different types of logical fallacies",
              "What are the components of a valid argument?",
              "Describe the process of deductive reasoning",
              "How is inductive reasoning different from deductive reasoning?",
            ],
          },
          analyticalReasoning: {
            name: "Analytical Reasoning",
            questions: [
              "How do you approach solving seating arrangement problems?",
              "Describe strategies for solving blood relation problems",
              "Explain how to solve coding-decoding questions",
              "What are the techniques for solving direction sense problems?",
            ],
          },
          verbalReasoning: {
            name: "Verbal Reasoning",
            questions: [
              "What are the different types of verbal analogies?",
              "Describe strategies for solving sentence completion questions",
              "Explain how to approach critical reasoning questions",
              "What are the common patterns in verbal classification?",
            ],
          },
        },
      },
      mathematics: {
        name: "Mathematics",
        icon: "🧮",
        color: "#10ac84",
        topics: {
          algebra: {
            name: "Algebra",
            questions: [
              "Solve for x: 2x + 5 = 15",
              "Factor the expression: x² - 4",
              "Simplify: (3x²y)(4xy³)",
              "Solve the system: 2x + y = 7, x - y = -1",
            ],
          },
          geometry: {
            name: "Geometry",
            questions: [
              "Calculate the area of a circle with radius 5",
              "Find the volume of a cylinder with radius 3 and height 8",
              "Prove the Pythagorean theorem",
              "Calculate the angles of a triangle with sides 3, 4, 5",
            ],
          },
          calculus: {
            name: "Calculus",
            questions: [
              "Find the derivative of f(x) = 3x² + 2x - 5",
              "Calculate the integral of ∫(2x + 3) dx",
              "Find the limit as x approaches 0 of (sin x)/x",
              "Solve the differential equation: dy/dx = 2y",
            ],
          },
        },
      },
      labourLaws: {
        name: "Labour Laws, Industrial Relations and Social Security",
        icon: "⚖️",
        color: "#ee5253",
        topics: {
          labourLegislation: {
            name: "Labour Legislation",
            questions: [
              "What are the key provisions of the Industrial Disputes Act?",
              "Describe the minimum wage laws in India",
              "Explain the provisions of the Factories Act regarding working hours",
              "What are the rights of workers under the Trade Unions Act?",
            ],
          },
          industrialRelations: {
            name: "Industrial Relations",
            questions: [
              "What are the causes of industrial disputes?",
              "Describe the process of collective bargaining",
              "Explain the role of conciliation in resolving industrial disputes",
              "What are the different methods of worker participation in management?",
            ],
          },
          socialSecurity: {
            name: "Social Security",
            questions: [
              "Describe the social security schemes available for organized sector workers",
              "What are the benefits provided under the Employees' Provident Fund scheme?",
              "Explain the provisions of the Employees' State Insurance Act",
              "What social security measures exist for unorganized sector workers?",
            ],
          },
        },
      },
      science: {
        name: "Science",
        icon: "🔬",
        color: "#66bb6a",
        topics: {
          physics: {
            name: "Physics",
            questions: [
              "State Newton's three laws of motion",
              "Calculate the force needed to accelerate a 5kg object at 3m/s²",
              "Explain the difference between kinetic and potential energy",
              "Describe the photoelectric effect",
            ],
          },
          chemistry: {
            name: "Chemistry",
            questions: [
              "Balance the equation: H₂ + O₂ → H₂O",
              "Explain the difference between ionic and covalent bonds",
              "Describe the process of electrolysis",
              "What is the pH of a 0.01M HCl solution?",
            ],
          },
          biology: {
            name: "Biology",
            questions: [
              "Explain the process of photosynthesis",
              "Describe the structure of DNA",
              "What is the difference between mitosis and meiosis?",
              "Explain how enzymes work as biological catalysts?",
            ],
          },
        },
      },
    };
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
            nextReview: new Date(),
            rating: null, // null means never attempted, then 'again', 'hard', 'medium', 'easy'
            important: false,
            lastReviewed: null,
            createdAt: new Date(),
          });
        });
      });
    });
  }

  // Get question state with fallback for new questions
  getQuestionState(questionId) {
    const question = this.questions.find((q) => q.id === questionId);
    return (
      question || {
        rating: null,
        important: false,
      }
    );
  }

  // Calculate next review with fixed spaced repetition intervals
  calculateNextReview(question, rating) {
    const now = new Date();
    let { easeFactor, repetitions, interval } = question;

    // Fixed intervals as requested
    const intervals = {
      again: 0, // Same day (instantly)
      hard: 1, // Next day
      medium: 2, // 2 days later
      easy: 4, // 4 days later
    };

    const daysToAdd = intervals[rating];
    const nextReview = new Date(
      now.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );

    // Update other SRS properties for compatibility
    if (rating === "easy" || rating === "medium") {
      repetitions++;
    } else {
      repetitions = 0;
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

  // Load stats from localStorage
  loadStats() {
    const saved = localStorage.getItem("questRecallStats");
    if (saved) {
      const stats = JSON.parse(saved);
      if (stats.lastStudyDate) {
        stats.lastStudyDate = new Date(stats.lastStudyDate);
      }
      return stats;
    }
    return {
      streak: 0,
      cardsCompletedToday: 0,
      totalCardsCompleted: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      lastStudyDate: null,
    };
  }

  // Save stats to localStorage
  saveStats() {
    localStorage.setItem("questRecallStats", JSON.stringify(this.stats));
  }

  // Get due questions
  getDueQuestions() {
    const now = new Date();
    return this.questions.filter((q) => {
      if (this.currentFilter && q.subjectKey !== this.currentFilter) {
        return false;
      }
      return q.nextReview <= now;
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

  // Update statistics
  updateStats() {
    const now = new Date();
    const today = now.toDateString();

    // Check if it's a new day
    if (
      !this.stats.lastStudyDate ||
      this.stats.lastStudyDate.toDateString() !== today
    ) {
      if (this.stats.lastStudyDate) {
        const daysDiff = Math.floor(
          (now - this.stats.lastStudyDate) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff === 1) {
          this.stats.streak++;
        } else if (daysDiff > 1) {
          this.stats.streak = 0;
        }
      }
      this.stats.cardsCompletedToday = 0;
      this.stats.lastStudyDate = now;
    }

    // Calculate due questions - questions that have never been attempted
    const dueQuestionsCount = this.questions.filter((q) => {
      return !q.rating; // No rating = never attempted
    }).length;

    // Update UI
    const cardsDueToday = this.getDueQuestions().length;
    const retention =
      this.stats.totalAnswers > 0
        ? Math.round(
            (this.stats.correctAnswers / this.stats.totalAnswers) * 100
          )
        : 0;

    document.getElementById("cardsDue").textContent = cardsDueToday;
    document.getElementById("streak").textContent = this.stats.streak;
    document.getElementById("cardsCompleted").textContent =
      this.stats.cardsCompletedToday;
    document.getElementById("dueQuestions").textContent = dueQuestionsCount;

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
      currentSubjectText.textContent = this.subjects[this.currentFilter].name;
      clearFilter.classList.remove("hidden");
    } else {
      currentSubjectText.textContent = "All Subjects";
      clearFilter.classList.add("hidden");
    }

    const questionGroups = this.getQuestionsByRating();
    const totalDue = Object.values(questionGroups).reduce(
      (sum, group) => sum + group.length,
      0
    );

    if (totalDue === 0) {
      container.innerHTML = "";
      noQuestions.classList.remove("hidden");
      return;
    }

    noQuestions.classList.add("hidden");
    container.innerHTML = "";

    // Render questions by rating priority
    const ratingOrder = ["again", "hard", "medium", "easy"];
    ratingOrder.forEach((rating) => {
      if (questionGroups[rating].length > 0) {
        questionGroups[rating].forEach((question) => {
          const card = this.createQuestionCard(question);
          container.appendChild(card);
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
      container.innerHTML = "";
      noQuestions.classList.remove("hidden");
      return;
    }

    noQuestions.classList.add("hidden");
    container.innerHTML = "";

    importantQuestions.forEach((question) => {
      const card = this.createQuestionCard(question);
      container.appendChild(card);
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
                }" data-question-id="${question.id}">⭐</button>
            </div>
            <div class="question-text">${question.text}</div>
            <div class="rating-buttons">
                <button class="rating-btn rating-again" data-rating="again" data-question-id="${
                  question.id
                }">
                    Again<br><span class="rating-time">Same day</span>
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

    modalSubject.textContent = question.subject;
    modalQuestion.textContent = question.text;
    modalStarBtn.className = `star-btn ${
      question.important ? "important" : ""
    }`;
    modalStarBtn.dataset.questionId = question.id;

    modal.classList.remove("hidden");
  }

  // Hide question modal
  hideQuestionModal() {
    const modal = document.getElementById("ratingModal");
    modal.classList.add("hidden");
    this.currentQuestionId = null;
  }

  // Rate question
  rateQuestion(questionId, rating) {
    const question = this.questions.find((q) => q.id == questionId);
    if (!question) return;

    // Calculate next review using fixed intervals
    const srsData = this.calculateNextReview(question, rating);
    Object.assign(question, srsData);

    // Update statistics
    this.stats.cardsCompletedToday++;
    this.stats.totalCardsCompleted++;
    this.stats.totalAnswers++;

    if (rating === "medium" || rating === "easy") {
      this.stats.correctAnswers++;
    }

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
  }

  // Toggle important status
  toggleImportant(questionId) {
    const question = this.questions.find((q) => q.id == questionId);
    if (question) {
      question.important = !question.important;
      this.saveQuestionStates();

      // Update star button immediately with visual feedback
      const starBtns = document.querySelectorAll(
        `[data-question-id="${questionId}"].star-btn`
      );
      starBtns.forEach((btn) => {
        if (question.important) {
          btn.classList.add("important");
          btn.style.filter = "grayscale(0%)";
          btn.style.transform = "scale(1.1)";
        } else {
          btn.classList.remove("important");
          btn.style.filter = "grayscale(100%)";
          btn.style.transform = "scale(1)";
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
                <div class="subject-count">${dueCount} due • ${subjectQuestions.length} total</div>
            `;

      card.addEventListener("click", () => {
        this.setSubjectFilter(key);
      });

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
    allCard.addEventListener("click", () => {
      this.clearSubjectFilter();
    });
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
    document.getElementById("homePage").classList.add("active");
    document.getElementById("subjectPage").classList.remove("active");
    document.getElementById("importantPage").classList.remove("active");
  }

  // Show subjects page
  showSubjectsPage() {
    this.showingImportant = false;
    this.renderSubjects();
    document.getElementById("homePage").classList.remove("active");
    document.getElementById("subjectPage").classList.add("active");
    document.getElementById("importantPage").classList.remove("active");
  }

  // Show important questions page
  showImportantPage() {
    this.showingImportant = true;
    this.renderImportantQuestions();
    document.getElementById("homePage").classList.remove("active");
    document.getElementById("subjectPage").classList.remove("active");
    document.getElementById("importantPage").classList.add("active");
  }

  // Toggle randomization
  toggleRandomization() {
    this.isRandomized = !this.isRandomized;
    const btn = document.getElementById("randomizeBtn");
    btn.textContent = this.isRandomized ? "🎲 Ordered" : "🎲 Randomize";
    if (this.showingImportant) {
      this.renderImportantQuestions();
    } else {
      this.renderHome();
    }
  }

  // Practice more functionality - shows only Again and Hard questions
  practiceMore() {
    const now = new Date();
    const practiceQuestions = this.getPracticeQuestions();

    if (practiceQuestions.length === 0) {
      alert('No questions rated as "Again" or "Hard" available for practice!');
      return;
    }

    // Make practice questions due immediately
    practiceQuestions.forEach((q) => {
      q.nextReview = now;
    });

    this.renderHome();
    this.updateStats();
    this.saveQuestionStates();
  }

  // Bind event handlers
  bindEvents() {
    // Header buttons
    document.getElementById("subjectBtn").addEventListener("click", () => {
      this.showSubjectsPage();
    });

    document.getElementById("randomizeBtn").addEventListener("click", () => {
      this.toggleRandomization();
    });

    document.getElementById("importantBtn").addEventListener("click", () => {
      this.showImportantPage();
    });

    // Subject page back button
    document.getElementById("backToHome").addEventListener("click", () => {
      this.showHomePage();
    });

    // Important page back button
    document
      .getElementById("backToHomeFromImportant")
      .addEventListener("click", () => {
        this.showHomePage();
      });

    // Clear filter button
    document.getElementById("clearFilter").addEventListener("click", () => {
      this.clearSubjectFilter();
    });

    // Rating buttons (event delegation)
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("rating-btn")) {
        e.stopPropagation();
        const rating = e.target.dataset.rating;
        const questionId = e.target.dataset.questionId;
        this.rateQuestion(questionId, rating);
      }

      if (e.target.classList.contains("star-btn")) {
        e.stopPropagation();
        const questionId = e.target.dataset.questionId;
        this.toggleImportant(questionId);
      }
    });

    // Modal events
    document.getElementById("ratingModal").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        this.hideQuestionModal();
      }
    });

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
    document.getElementById("modalStarBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      const questionId = e.target.dataset.questionId;
      this.toggleImportant(questionId);
    });

    // Add more button - Practice More with fixed logic
    document.getElementById("addMoreBtn").addEventListener("click", () => {
      this.practiceMore();
    });

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
