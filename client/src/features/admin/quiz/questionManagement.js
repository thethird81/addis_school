'use strict';

var questionManagementInitialized = false;

export function initQuestionManagement() {
  if (questionManagementInitialized) return;
  questionManagementInitialized = true;

  var addBtn = document.getElementById('addQuestionBtn');
  if (addBtn) addBtn.addEventListener('click', showCreateQuestionModal);

  loadQuizFilter();
  setupQuestionFilterListener();
}

function loadQuizFilter() {
  var filter = document.getElementById('questionQuizFilter');
  if (!filter) return;

  adminAPI.getQuizzes()
    .then(function(quizzes) {
      filter.innerHTML = '<option value="">-- Select a Quiz --</option>';
      quizzes.forEach(function(quiz) {
        var opt = document.createElement('option');
        opt.value = quiz.id;
        opt.textContent = quiz.title;
        filter.appendChild(opt);
      });
    })
    .catch(function(err) {
      console.error('Failed to load quizzes:', err);
    });
}

function setupQuestionFilterListener() {
  var filter = document.getElementById('questionQuizFilter');
  if (!filter) return;

  filter.addEventListener('change', function() {
    var quizId = this.value;
    if (quizId) {
      loadQuestions(quizId);
    } else {
      var tbody = document.getElementById('questionsTableBody');
      var loading = document.getElementById('questionsLoading');
      if (tbody) tbody.innerHTML = '';
      if (loading) loading.textContent = 'Select a quiz to view questions';
    }
  });
}

function loadQuestions(quizId) {
  var tbody = document.getElementById('questionsTableBody');
  var loading = document.getElementById('questionsLoading');
  if (!tbody) return;

  if (loading) loading.textContent = 'Loading...';

  adminAPI.getQuestionsByQuiz(quizId)
    .then(function(questions) {
      if (loading) loading.textContent = '';
      tbody.innerHTML = '';

      if (!questions || !questions.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No questions in this quiz</td></tr>';
        return;
      }

      questions.forEach(function(q) {
        var tr = document.createElement('tr');
        var optionsText = q.options ? q.options.length + ' options' : '-';
        var difficulty = q.difficulty || 'easy';
        var hasImage = q.question_image ? 'Yes' : 'No';

        tr.innerHTML =
          '<td>' + escapeHtml(q.question_text.substring(0, 80)) + (q.question_text.length > 80 ? '...' : '') + '</td>' +
          '<td>' + optionsText + '</td>' +
          '<td><span class="difficulty-badge difficulty-' + difficulty + '">' + difficulty + '</span></td>' +
          '<td>' + hasImage + '</td>' +
          '<td class="actions-cell">' +
            '<button class="btn-edit" data-id="' + q.id + '" data-quiz-id="' + quizId + '">Edit</button>' +
            '<button class="btn-delete" data-id="' + q.id + '">Delete</button>' +
          '</td>';

        tbody.appendChild(tr);
      });

      // Attach events
      tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
          showEditQuestionModal(this.getAttribute('data-id'), this.getAttribute('data-quiz-id'));
        });
      });

      tbody.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
          deleteQuestion(this.getAttribute('data-id'));
        });
      });
    })
    .catch(function(err) {
      if (loading) loading.textContent = 'Error loading questions';
      console.error(err);
    });
}

function showCreateQuestionModal() {
  var quizFilter = document.getElementById('questionQuizFilter');
  var quizId = quizFilter ? quizFilter.value : '';
  if (!quizId) {
    adminAPI.showToast('Please select a quiz first', 'error');
    return;
  }

  showQuestionForm(null, quizId);
}

function showEditQuestionModal(questionId, quizId) {
  var loading = document.getElementById('questionsLoading');
  if (loading) loading.textContent = 'Loading question data...';

  adminAPI.getQuestionsByQuiz(quizId)
    .then(function(questions) {
      var question = questions.find(function(q) { return q.id === questionId; });
      if (!question) {
        adminAPI.showToast('Question not found', 'error');
        return;
      }
      if (loading) loading.textContent = '';
      showQuestionForm(question, quizId);
    })
    .catch(function(err) {
      if (loading) loading.textContent = '';
      adminAPI.showToast('Failed to load question', 'error');
    });
}

function showQuestionForm(existingQuestion, quizId) {
  var modalOverlay = document.getElementById('modalOverlay');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var modalSave = document.getElementById('modalSave');

  if (!modalOverlay || !modalBody) return;

  var isEdit = existingQuestion !== null;
  modalTitle.textContent = isEdit ? 'Edit Question' : 'Create Question';

  var q = existingQuestion || { question_text: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }], correct_answer: '', difficulty: 'easy', question_image: '' };

  var optionsHtml = '';
  (q.options || []).forEach(function(opt, index) {
    optionsHtml +=
      '<div class="option-row">' +
        '<span class="option-id-label">' + opt.id + '</span>' +
        '<input type="radio" name="correctOption" class="option-radio" value="' + opt.id + '" ' + (q.correct_answer === opt.id ? 'checked' : '') + '>' +
        '<input type="text" class="option-input" value="' + escapeHtml(opt.text) + '" placeholder="Option ' + opt.id + ' text">' +
        '<input type="text" class="option-image-input" value="' + escapeHtml(opt.option_image || '') + '" placeholder="Option image URL (optional)">' +
        '<button class="btn-remove-option" type="button">&times;</button>' +
      '</div>';
  });

  var nextId = String.fromCharCode(97 + (q.options || []).length); // a, b, c, d...

  modalBody.innerHTML =
    '<div class="form-group">' +
      '<label>Question Text *</label>' +
      '<textarea id="questionTextInput" class="form-input" rows="3" placeholder="Enter question text">' + escapeHtml(q.question_text) + '</textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Question Image URL (optional)</label>' +
      '<input type="text" id="questionImageInput" class="form-input" value="' + (q.question_image || '') + '" placeholder="https://example.com/image.jpg">' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Difficulty</label>' +
      '<select id="questionDifficultyInput" class="form-select">' +
        '<option value="easy"' + (q.difficulty === 'easy' ? ' selected' : '') + '>Easy</option>' +
        '<option value="medium"' + (q.difficulty === 'medium' ? ' selected' : '') + '>Medium</option>' +
        '<option value="hard"' + (q.difficulty === 'hard' ? ' selected' : '') + '>Hard</option>' +
      '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Options (select the radio button for the correct answer)</label>' +
      '<div id="optionsContainer">' + optionsHtml + '</div>' +
      '<button class="btn-add-option" type="button" id="addOptionBtn">+ Add Option</button>' +
    '</div>' +
    '<input type="hidden" id="nextOptionId" value="' + nextId + '">';

  modalOverlay.style.display = 'flex';

  // Add option button
  document.getElementById('addOptionBtn').addEventListener('click', function() {
    var container = document.getElementById('optionsContainer');
    var nextIdInput = document.getElementById('nextOptionId');
    var id = nextIdInput.value;

    var row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML =
      '<span class="option-id-label">' + id + '</span>' +
      '<input type="radio" name="correctOption" class="option-radio" value="' + id + '">' +
      '<input type="text" class="option-input" placeholder="Option ' + id + ' text">' +
      '<input type="text" class="option-image-input" placeholder="Option image URL (optional)">' +
      '<button class="btn-remove-option" type="button">&times;</button>';

    container.appendChild(row);

    // Update next ID
    var newChar = String.fromCharCode(id.charCodeAt(0) + 1);
    nextIdInput.value = newChar;

    // Remove option handler
    row.querySelector('.btn-remove-option').addEventListener('click', function() {
      row.remove();
    });
  });

  // Remove option handlers
  document.querySelectorAll('.btn-remove-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var row = this.closest('.option-row');
      if (document.querySelectorAll('.option-row').length > 2) {
        row.remove();
      } else {
        adminAPI.showToast('A question must have at least 2 options', 'error');
      }
    });
  });

  // Save
  var newSave = modalSave.cloneNode(true);
  modalSave.parentNode.replaceChild(newSave, modalSave);
  var currentSave = document.getElementById('modalSave');

  currentSave.addEventListener('click', function() {
    var questionText = document.getElementById('questionTextInput').value.trim();
    var questionImage = document.getElementById('questionImageInput').value.trim() || null;
    var difficulty = document.getElementById('questionDifficultyInput').value;

    if (!questionText) {
      adminAPI.showToast('Please enter question text', 'error');
      return;
    }

    var optionRows = document.querySelectorAll('.option-row');
    var options = [];
    var correctAnswer = null;

    optionRows.forEach(function(row) {
      var id = row.querySelector('.option-id-label').textContent;
      var text = row.querySelector('.option-input').value.trim();
      var isCorrect = row.querySelector('.option-radio').checked;
      var imageInput = row.querySelector('.option-image-input');
      var optionImage = imageInput ? imageInput.value.trim() || null : null;

      var optionData = { id: id, text: text };
      if (optionImage) optionData.option_image = optionImage;
      options.push(optionData);
      if (isCorrect) correctAnswer = id;
    });

    if (!correctAnswer) {
      adminAPI.showToast('Please select the correct answer', 'error');
      return;
    }

    var hasEmptyOption = options.some(function(o) { return !o.text; });
    if (hasEmptyOption) {
      adminAPI.showToast('Please fill in all option texts', 'error');
      return;
    }

    var data = {
      quiz_id: quizId,
      question_text: questionText,
      options: options,
      correct_answer: correctAnswer,
      difficulty: difficulty,
      question_image: questionImage
    };

    var apiCall = isEdit
      ? adminAPI.updateQuestion(existingQuestion.id, data)
      : adminAPI.createQuestion(data);

    apiCall
      .then(function() {
        adminAPI.showToast(isEdit ? 'Question updated' : 'Question created', 'success');
        modalOverlay.style.display = 'none';
        loadQuestions(quizId);
      })
      .catch(function(err) {
        adminAPI.showToast(err.message || 'Failed to save question', 'error');
      });
  });

  document.getElementById('modalCancel').onclick = function() {
    modalOverlay.style.display = 'none';
  };
  document.getElementById('modalClose').onclick = function() {
    modalOverlay.style.display = 'none';
  };
}

function deleteQuestion(id) {
  if (!confirm('Are you sure you want to delete this question?')) return;

  adminAPI.deleteQuestion(id)
    .then(function() {
      adminAPI.showToast('Question deleted', 'success');
      var quizId = document.getElementById('questionQuizFilter').value;
      if (quizId) loadQuestions(quizId);
    })
    .catch(function(err) {
      adminAPI.showToast(err.message || 'Failed to delete question', 'error');
    });
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}