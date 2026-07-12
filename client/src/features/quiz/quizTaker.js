import './quizTaker.css';
import { getBaseUrl } from '../../utils/path.js';

const BASE_URL = getBaseUrl();

// ==================== STATE ====================

let allQuizzes = [];
let filteredQuizzes = [];
let currentQuiz = null;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionId: optionId }
let score = 0;
let hierarchyData = null;
let coinsAwarded = 0; // Track coins awarded in current quiz

// ==================== DOM ELEMENTS ====================

let modal, closeBtn, closeResultsBtn;
let selectionView, takingView, resultsView;
let subjectFilter, contentFilter, subcontentFilter, quizList;
let backToSelectionBtn, quizTitle, questionPosition, quizProgressBar;
let questionText, questionImage, answerOptions;
let explanationToggle, explanationContent, explanationText;
let prevQuestionBtn, nextQuestionBtn, submitQuizBtn;
let totalQuestionsEl, attemptedCountEl, correctCountEl, wrongCountEl;
let finalScore, scorePercentage, correctCount, wrongCount, skippedCount;
let retryQuizBtn, newQuizBtn;

// ==================== UTILITY FUNCTIONS ====================

function showModal() {
  if (!modal) return;
  modal.style.display = 'flex';
}

function hideModal() {
  if (!modal) return;
  modal.style.display = 'none';
  resetState();
}

function resetState() {
  currentQuiz = null;
  questions = [];
  currentQuestionIndex = 0;
  userAnswers = {};
  score = 0;
  hierarchyData = null;
  allQuizzes = [];
  filteredQuizzes = [];
  coinsAwarded = 0;
}

function showView(viewName) {
  if (!selectionView || !takingView || !resultsView) return;
  
  selectionView.style.display = 'none';
  takingView.style.display = 'none';
  resultsView.style.display = 'none';

  switch(viewName) {
    case 'selection':
      selectionView.style.display = 'flex';
      break;
    case 'taking':
      takingView.style.display = 'flex';
      break;
    case 'results':
      resultsView.style.display = 'flex';
      break;
  }
}

// ==================== COIN REWARD SYSTEM ====================

function awardCoin() {
  const activeProfile = JSON.parse(localStorage.getItem("activeProfile"));
  if (!activeProfile) return;
  
  // Update local storage
  activeProfile.coins = (activeProfile.coins || 0) + 1;
  localStorage.setItem("activeProfile", JSON.stringify(activeProfile));
  
  // Update profiles array in localStorage
  const profiles = JSON.parse(localStorage.getItem("profiles")) || [];
  const profileIndex = profiles.findIndex(p => p.id === activeProfile.id);
  if (profileIndex !== -1) {
    profiles[profileIndex].coins = activeProfile.coins;
    localStorage.setItem("profiles", JSON.stringify(profiles));
  }
  
  coinsAwarded++;
  
  // Update navbar coin display
  updateCoinDisplay();
}

function updateCoinDisplay() {
  const activeProfile = JSON.parse(localStorage.getItem("activeProfile"));
  if (!activeProfile) return;
  
  const coinCountEl = document.getElementById("coinCount");
  if (coinCountEl) {
    coinCountEl.textContent = activeProfile.coins || 0;
  }
}

// ==================== API CALLS ====================

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("accessToken");
  let response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    const { refresh } = await import('../../utils/sharedFunctions.js');
    const newAccessToken = await refresh();
    if (!newAccessToken) throw new Error("Unable to refresh access token");
    
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newAccessToken}`,
        ...(options.headers || {}),
      },
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchQuizHierarchy(gradeId) {
  return fetchWithAuth(`${BASE_URL}/api/v1/sidebar/quizzes/${gradeId}`);
}

async function fetchQuestionsForQuiz(quizId) {
  // Use the public endpoint for getting questions by quiz
  return fetchWithAuth(`${BASE_URL}/api/v1/questions/quiz/${quizId}`);
}

// ==================== QUIZ SELECTION ====================

async function loadQuizSelection() {
  const activeProfile = JSON.parse(localStorage.getItem("activeProfile"));
  if (!activeProfile || !activeProfile.grade_id) {
    alert("No active profile found. Please sign in and select a profile.");
    return;
  }

  try {
    if (!quizList) return;
    quizList.innerHTML = '<div class="quiz-loading">Loading quizzes...</div>';
    hierarchyData = await fetchQuizHierarchy(activeProfile.grade_id);
    
    // Extract all quizzes into a flat array with metadata
    allQuizzes = [];
    
    // General quizzes (grade-level)
    if (hierarchyData.generalQuizzes && hierarchyData.generalQuizzes.length > 0) {
      hierarchyData.generalQuizzes.forEach(quiz => {
        allQuizzes.push({
          ...quiz,
          subjectName: 'General',
          contentName: null,
          subcontentName: null
        });
      });
    }
    
    // Subject-level quizzes
    if (hierarchyData.subjects) {
      hierarchyData.subjects.forEach(subject => {
        // Quizzes at subject level
        if (subject.quizzes && subject.quizzes.length > 0) {
          subject.quizzes.forEach(quiz => {
            allQuizzes.push({
              ...quiz,
              subjectName: subject.subjectName,
              contentName: null,
              subcontentName: null
            });
          });
        }
        
        // Content-level quizzes
        if (subject.contents) {
          subject.contents.forEach(content => {
            if (content.quizzes && content.quizzes.length > 0) {
              content.quizzes.forEach(quiz => {
                allQuizzes.push({
                  ...quiz,
                  subjectName: subject.subjectName,
                  contentName: content.contentName,
                  subcontentName: null
                });
              });
            }
            
            // Subcontent-level quizzes
            if (content.subcontents) {
              content.subcontents.forEach(subcontent => {
                if (subcontent.quizzes && subcontent.quizzes.length > 0) {
                  subcontent.quizzes.forEach(quiz => {
                    allQuizzes.push({
                      ...quiz,
                      subjectName: subject.subjectName,
                      contentName: content.contentName,
                      subcontentName: subcontent.subcontentName
                    });
                  });
                }
              });
            }
          });
        }
      });
    }

    // Populate subject filter
    if (subjectFilter) {
      const subjects = [...new Set(allQuizzes.map(q => q.subjectName))].sort();
      subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
      });
    }

    filteredQuizzes = allQuizzes;
    renderQuizList();
  } catch (error) {
    console.error("Error loading quizzes:", error);
    if (quizList) {
      quizList.innerHTML = '<div class="no-quizzes-message">Failed to load quizzes. Please try again.</div>';
    }
  }
}

function renderQuizList() {
  if (!quizList) return;
  
  quizList.innerHTML = '';
  
  if (filteredQuizzes.length === 0) {
    quizList.innerHTML = '<div class="no-quizzes-message">No quizzes available for the selected filters.</div>';
    return;
  }

  filteredQuizzes.forEach(quiz => {
    const item = document.createElement('div');
    item.className = 'quiz-list-item';
    item.dataset.quizId = quiz.quizId;
    
    const location = [quiz.subjectName, quiz.contentName, quiz.subcontentName]
      .filter(Boolean)
      .join(' > ');
    
    item.innerHTML = `
      <div class="quiz-list-icon">📝</div>
      <div class="quiz-list-info">
        <div class="quiz-list-title">${quiz.quizTitle}</div>
        <div class="quiz-list-meta">
          <span class="quiz-list-badge">📂 ${location}</span>
        </div>
      </div>
    `;
    
    item.addEventListener('click', () => startQuiz(quiz));
    quizList.appendChild(item);
  });
}

function applyFilters() {
  const selectedSubject = subjectFilter ? subjectFilter.value : '';
  const selectedContent = contentFilter ? contentFilter.value : '';
  const selectedSubcontent = subcontentFilter ? subcontentFilter.value : '';

  filteredQuizzes = allQuizzes.filter(quiz => {
    if (selectedSubject && quiz.subjectName !== selectedSubject) return false;
    if (selectedContent && quiz.contentName !== selectedContent) return false;
    if (selectedSubcontent && quiz.subcontentName !== selectedSubcontent) return false;
    return true;
  });

  renderQuizList();
}

// ==================== QUIZ TAKING ====================

async function startQuiz(quiz) {
  currentQuiz = quiz;
  
  try {
    questions = await fetchQuestionsForQuiz(quiz.quizId);
    
    if (!questions || questions.length === 0) {
      alert("This quiz has no questions available.");
      return;
    }

    // Shuffle questions
    questions = questions.sort(() => Math.random() - 0.5);
    
    // Initialize state
    currentQuestionIndex = 0;
    userAnswers = {};
    score = 0;
    
    // Update UI
    if (quizTitle) quizTitle.textContent = quiz.quizTitle;
    if (totalQuestionsEl) totalQuestionsEl.textContent = questions.length;
    showView('taking');
    displayQuestion();
  } catch (error) {
    console.error("Error loading quiz questions:", error);
    alert("Failed to load quiz questions. Please try again.");
  }
}

function displayQuestion() {
  if (!questionText || !answerOptions || !questionImage) return;
  
  const question = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  
  // Update position
  if (questionPosition) questionPosition.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
  
  // Update progress bar
  if (quizProgressBar) {
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    quizProgressBar.style.width = `${progress}%`;
  }
  
  // Calculate stats
  const attemptedCount = Object.keys(userAnswers).length;
  let correctCount = 0;
  let wrongCount = 0;
  
  Object.entries(userAnswers).forEach(([qId, answerId]) => {
    const q = questions.find(question => question.id === qId);
    if (q && answerId === q.correct_answer) {
      correctCount++;
    } else if (q) {
      wrongCount++;
    }
  });
  
  // Update score display
  if (totalQuestionsEl) totalQuestionsEl.textContent = totalQuestions;
  if (attemptedCountEl) attemptedCountEl.textContent = attemptedCount;
  if (correctCountEl) correctCountEl.textContent = correctCount;
  if (wrongCountEl) wrongCountEl.textContent = wrongCount;
  
  // Display question text
  questionText.innerHTML = question.question_text;
  
  // Display question image if exists
  questionImage.innerHTML = '';
  if (question.question_image) {
    const img = document.createElement('img');
    img.src = question.question_image;
    img.alt = 'Question Image';
    questionImage.appendChild(img);
  }
  
  // Display answer options
  answerOptions.innerHTML = '';
  const isAnswered = userAnswers[question.id] !== undefined;
  
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'answer-option';
    button.dataset.optionId = option.id;
    button.dataset.questionId = question.id;
    
    const selectedOptionId = userAnswers[question.id];
    const isCorrect = option.id === question.correct_answer;
    const isSelected = option.id === selectedOptionId;
    
    // Set button state
    if (isAnswered) {
      button.disabled = true;
      if (isCorrect) {
        button.classList.add('correct');
      } else if (isSelected && !isCorrect) {
        button.classList.add('wrong');
      }
    }
    
    button.innerHTML = `
      <span class="answer-option-label">${String.fromCharCode(65 + index)}</span>
      <span>${option.text}</span>
    `;
    
    if (!isAnswered) {
      button.addEventListener('click', () => selectAnswer(question.id, option.id));
    }
    
    answerOptions.appendChild(button);
  });
  
  // Reset explanation
  if (explanationToggle) {
    explanationToggle.textContent = '📖 Show Explanation';
  }
  if (explanationContent) {
    explanationContent.style.display = 'none';
  }
  
  // Update navigation buttons
  if (prevQuestionBtn) {
    prevQuestionBtn.disabled = currentQuestionIndex === 0;
  }
  
  // Enable Next only if question is answered and not on last question
  if (nextQuestionBtn) {
    if (currentQuestionIndex === totalQuestions - 1) {
      nextQuestionBtn.style.display = 'none';
      // Show submit button if all questions answered
      if (attemptedCount === totalQuestions) {
        submitQuizBtn.style.display = 'inline-block';
      } else {
        submitQuizBtn.style.display = 'none';
      }
    } else {
      nextQuestionBtn.style.display = 'inline-block';
      nextQuestionBtn.disabled = !isAnswered;
      submitQuizBtn.style.display = 'none';
    }
  }
  
}

function selectAnswer(questionId, optionId) {
  const question = questions[currentQuestionIndex];
  const isCorrect = optionId === question.correct_answer;
  
  // Save answer
  userAnswers[questionId] = optionId;
  
  // Award coin for correct answer
  if (isCorrect) {
    awardCoin();
  }
  
  // Re-display to show feedback and update button states
  displayQuestion();
  
  // Show explanation toggle button only after user clicks an option
  if (explanationToggle && question.explanation) {
    explanationToggle.style.display = 'block';
  }
}

function toggleExplanation() {
  if (!explanationContent || !explanationToggle) return;
  
  if (explanationContent.style.display === 'none') {
    explanationContent.style.display = 'block';
    explanationToggle.textContent = '📖 Hide Explanation';
  } else {
    explanationContent.style.display = 'none';
    explanationToggle.textContent = '📖 Show Explanation';
  }
}

function navigateQuestion(direction) {
  const newIndex = currentQuestionIndex + direction;
  
  if (newIndex >= 0 && newIndex < questions.length) {
    currentQuestionIndex = newIndex;
    displayQuestion();
  }
}

function submitQuiz() {
  // Calculate results
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  
  questions.forEach(q => {
    if (userAnswers[q.id] === undefined) {
      skipped++;
    } else if (userAnswers[q.id] === q.correct_answer) {
      correct++;
    } else {
      wrong++;
    }
  });
  
  // Display results
  if (finalScore) finalScore.textContent = `${correct}/${questions.length}`;
  const percentage = Math.round((correct / questions.length) * 100);
  if (scorePercentage) scorePercentage.textContent = `${percentage}%`;
  if (correctCount) correctCount.textContent = correct;
  if (wrongCount) wrongCount.textContent = wrong;
  if (skippedCount) skippedCount.textContent = skipped;
  
  showView('results');
}

// ==================== EVENT LISTENERS ====================

function attachEventListeners() {
  if (!modal || !closeBtn) return;
  
  closeBtn.addEventListener('click', hideModal);
  if (closeResultsBtn) {
    closeResultsBtn.addEventListener('click', hideModal);
  }

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  // Filters
  if (subjectFilter) {
    subjectFilter.addEventListener('change', () => {
      const selectedSubject = subjectFilter.value;
      
      // Populate content filter based on selected subject
      if (contentFilter) contentFilter.innerHTML = '<option value="">All Content</option>';
      if (subcontentFilter) subcontentFilter.innerHTML = '<option value="">All Subcontents</option>';
      if (contentFilter) contentFilter.disabled = true;
      if (subcontentFilter) subcontentFilter.disabled = true;
      
      if (selectedSubject && hierarchyData && hierarchyData.subjects) {
        const subject = hierarchyData.subjects.find(s => s.subjectName === selectedSubject);
        if (subject && subject.contents) {
          const contents = [...new Set(subject.contents.map(c => c.contentName))].sort();
          contents.forEach(content => {
            const option = document.createElement('option');
            option.value = content;
            option.textContent = content;
            if (contentFilter) contentFilter.appendChild(option);
          });
          if (contentFilter) contentFilter.disabled = false;
        }
      }
      
      applyFilters();
    });
  }

  if (contentFilter) {
    contentFilter.addEventListener('change', () => {
      const selectedSubject = subjectFilter ? subjectFilter.value : '';
      const selectedContent = contentFilter.value;
      
      // Populate subcontent filter
      if (subcontentFilter) subcontentFilter.innerHTML = '<option value="">All Subcontents</option>';
      if (subcontentFilter) subcontentFilter.disabled = true;
      
      if (selectedSubject && selectedContent && hierarchyData && hierarchyData.subjects) {
        const subject = hierarchyData.subjects.find(s => s.subjectName === selectedSubject);
        if (subject && subject.contents) {
          const content = subject.contents.find(c => c.contentName === selectedContent);
          if (content && content.subcontents) {
            const subcontents = content.subcontents.map(sc => sc.subcontentName).sort();
            subcontents.forEach(subcontent => {
              const option = document.createElement('option');
              option.value = subcontent;
              option.textContent = subcontent;
              if (subcontentFilter) subcontentFilter.appendChild(option);
            });
            if (subcontentFilter) subcontentFilter.disabled = false;
          }
        }
      }
      
      applyFilters();
    });
  }

  if (subcontentFilter) {
    subcontentFilter.addEventListener('change', applyFilters);
  }

  // Quiz taking navigation
  if (backToSelectionBtn) {
    backToSelectionBtn.addEventListener('click', () => {
      resetState();
      showView('selection');
    });
  }

  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener('click', () => navigateQuestion(-1));
  }
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', () => navigateQuestion(1));
  }
  if (submitQuizBtn) {
    submitQuizBtn.addEventListener('click', submitQuiz);
  }
  if (explanationToggle) {
    explanationToggle.addEventListener('click', toggleExplanation);
  }

  if (retryQuizBtn) {
    retryQuizBtn.addEventListener('click', () => {
      resetState();
      startQuiz(currentQuiz);
    });
  }

  if (newQuizBtn) {
    newQuizBtn.addEventListener('click', () => {
      resetState();
      showView('selection');
      loadQuizSelection();
    });
  }
}

// ==================== INITIALIZATION ====================

function initializeDOMElements() {
  modal = document.getElementById('quizTakerModal');
  closeBtn = document.getElementById('closeQuizTaker');
  closeResultsBtn = document.getElementById('closeQuizTakerResults');

  selectionView = document.getElementById('quizSelectionView');
  takingView = document.getElementById('quizTakingView');
  resultsView = document.getElementById('quizResultsView');

  subjectFilter = document.getElementById('subjectFilter');
  contentFilter = document.getElementById('contentFilter');
  subcontentFilter = document.getElementById('subcontentFilter');
  quizList = document.getElementById('quizList');

  backToSelectionBtn = document.getElementById('backToSelection');
  quizTitle = document.getElementById('quizTitle');
  questionPosition = document.getElementById('questionPosition');
  quizProgressBar = document.getElementById('quizProgressBar');
  questionText = document.getElementById('questionText');
  questionImage = document.getElementById('questionImage');
  answerOptions = document.getElementById('answerOptions');
  explanationToggle = document.getElementById('explanationToggle');
  explanationContent = document.getElementById('explanationContent');
  explanationText = document.getElementById('explanationText');
  prevQuestionBtn = document.getElementById('prevQuestion');
  nextQuestionBtn = document.getElementById('nextQuestion');
  submitQuizBtn = document.getElementById('submitQuiz');

  // Score display elements
  totalQuestionsEl = document.getElementById('totalQuestions');
  attemptedCountEl = document.getElementById('attemptedCount');
  correctCountEl = document.getElementById('correctCount');
  wrongCountEl = document.getElementById('wrongCount');

  // Results elements
  finalScore = document.getElementById('finalScore');
  scorePercentage = document.getElementById('scorePercentage');
  correctCount = document.getElementById('correctCount');
  wrongCount = document.getElementById('wrongCount');
  skippedCount = document.getElementById('skippedCount');
  retryQuizBtn = document.getElementById('retryQuiz');
  newQuizBtn = document.getElementById('newQuiz');
  
  attachEventListeners();
}

// ==================== MODAL INJECTION ====================

function injectQuizModal() {
  if (document.getElementById('quizTakerModal')) {
    return; // Modal already exists
  }
  
  const modalHTML = `
    <!-- Quiz Taker Modal -->
    <div id="quizTakerModal" class="quiz-taker-overlay" style="display:none;">
      <div class="quiz-taker-container">
        <!-- Quiz Selection View -->
        <div id="quizSelectionView" class="quiz-taker-view">
          <div class="quiz-taker-header">
            <h2>📚 Take Quiz</h2>
            <button class="quiz-taker-close" id="closeQuizTaker">&times;</button>
          </div>
          
          <!-- Filters -->
          <div class="quiz-filters">
            <div class="filter-group">
              <label for="subjectFilter">Subject:</label>
              <select id="subjectFilter" class="quiz-filter-select">
                <option value="">All Subjects</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="contentFilter">Content:</label>
              <select id="contentFilter" class="quiz-filter-select" disabled>
                <option value="">All Content</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="subcontentFilter">Subcontent:</label>
              <select id="subcontentFilter" class="quiz-filter-select" disabled>
                <option value="">All Subcontents</option>
              </select>
            </div>
          </div>

          <!-- Quiz List -->
          <div id="quizList" class="quiz-list"></div>
        </div>

        <!-- Quiz Taking View -->
        <div id="quizTakingView" class="quiz-taker-view" style="display:none;">
          <div class="quiz-taker-header">
            <button class="quiz-back-btn" id="backToSelection">← Back</button>
            <h2 id="quizTitle">Quiz Title</h2>
            <div class="quiz-header-stats">
              <span id="questionPosition">Question 1 of 10</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="quiz-progress-container">
            <div class="quiz-progress-bar" id="quizProgressBar"></div>
          </div>

          <!-- Question Area -->
          <div class="quiz-question-area">
            <div id="questionText" class="question-text"></div>
            <div id="questionImage" class="question-image-container"></div>
            <div id="answerOptions" class="answer-options"></div>
            
            <!-- Score Display -->
            <div class="score-display">
              <span class="score-item">Total: <span id="totalQuestions">10</span></span>
              <span class="score-item">Attempted: <span id="attemptedCount">0</span></span>
              <span class="score-item correct">✓ <span id="correctCount">0</span></span>
              <span class="score-item wrong">✗ <span id="wrongCount">0</span></span>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="quiz-navigation">
            <button id="prevQuestion" class="quiz-nav-btn" disabled>← Previous</button>
            <button id="nextQuestion" class="quiz-nav-btn" disabled>Next →</button>
            <button id="submitQuiz" class="quiz-nav-btn quiz-submit-btn" style="display:none;">Submit Quiz ✓</button>
          </div>

          <!-- Explanation (Collapsible, Below Navigation) -->
          <div class="explanation-container">
            <button class="explanation-toggle" id="explanationToggle" style="display:none;">
              📖 Show Explanation
            </button>
            <div id="explanationContent" class="explanation-content" style="display:none;">
              <p id="explanationText"></p>
            </div>
          </div>
        </div>

        <!-- Results View -->
        <div id="quizResultsView" class="quiz-taker-view" style="display:none;">
          <div class="quiz-taker-header">
            <h2>🎉 Quiz Complete!</h2>
            <button class="quiz-taker-close" id="closeQuizTakerResults">&times;</button>
          </div>

          <div class="results-container">
            <div class="results-score-circle">
              <div class="score-inner">
                <span id="finalScore">0/0</span>
                <span id="scorePercentage">0%</span>
              </div>
            </div>

            <div class="results-breakdown">
              <div class="result-item correct">
                <span class="result-icon">✓</span>
                <span class="result-label">Correct:</span>
                <span id="correctCount" class="result-value">0</span>
              </div>
              <div class="result-item wrong">
                <span class="result-icon">✗</span>
                <span class="result-label">Wrong:</span>
                <span id="wrongCount" class="result-value">0</span>
              </div>
              <div class="result-item skipped">
                <span class="result-icon">⊘</span>
                <span class="result-label">Skipped:</span>
                <span id="skippedCount" class="result-value">0</span>
              </div>
            </div>

            <div class="results-actions">
              <button id="retryQuiz" class="result-btn">🔄 Retry Quiz</button>
              <button id="newQuiz" class="result-btn primary">📚 Take Another Quiz</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ==================== PUBLIC API ====================

export async function openQuizTaker() {
  // Inject modal HTML if it doesn't exist
  injectQuizModal();
  
  // Initialize DOM elements
  if (!modal) {
    initializeDOMElements();
  }
  
  if (!modal) {
    console.error('Quiz taker modal not found');
    return;
  }
  
  showModal();
  showView('selection');
  await loadQuizSelection();
}

export function hideQuizTaker() {
  hideModal();
}

// Make functions available globally when module is loaded
window.openQuizTaker = openQuizTaker;
window.hideQuizTaker = hideQuizTaker;

// Initialize DOM elements when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDOMElements);
} else {
  initializeDOMElements();
}