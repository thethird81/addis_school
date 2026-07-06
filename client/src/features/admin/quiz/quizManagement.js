'use strict';

var quizManagementInitialized = false;
var createQuizImportedData = null;

export function initQuizManagement() {
  if (quizManagementInitialized) return;
  quizManagementInitialized = true;

  var addBtn = document.getElementById('addQuizBtn');

  if (addBtn) addBtn.addEventListener('click', showCreateQuizModal);

  // Hide the old separate import button since it's now part of create quiz modal
  var importBtn = document.getElementById('importQuizBtn');
  if (importBtn) importBtn.style.display = 'none';

  loadQuizzes();
}

function loadQuizzes() {
  var tbody = document.getElementById('quizzesTableBody');
  var loading = document.getElementById('quizzesLoading');
  if (!tbody) return;

  if (loading) loading.textContent = 'Loading...';

  adminAPI.getQuizzes()
    .then(function(quizzes) {
      if (loading) loading.textContent = '';
      tbody.innerHTML = '';

      if (!quizzes || !quizzes.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No quizzes found</td></tr>';
        return;
      }

      quizzes.forEach(function(quiz) {
        var tr = document.createElement('tr');
        var questionCount = quiz._count ? quiz._count.questions : 0;
        var created = quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() : '-';

        tr.innerHTML =
          '<td>' + escapeHtml(quiz.title) + '</td>' +
          '<td>' + questionCount + '</td>' +
          '<td>' + (quiz.is_general ? 'Yes' : 'No') + '</td>' +
          '<td>' + created + '</td>' +
          '<td class="actions-cell">' +
            '<button class="btn-edit" data-id="' + quiz.id + '" data-title="' + escapeHtml(quiz.title) + '">Edit</button>' +
            '<button class="btn-delete" data-id="' + quiz.id + '">Delete</button>' +
          '</td>';

        tbody.appendChild(tr);
      });

      // Attach edit/delete events
      tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
          showEditQuizModal(this.getAttribute('data-id'), this.getAttribute('data-title'));
        });
      });

      tbody.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
          deleteQuiz(this.getAttribute('data-id'));
        });
      });
    })
    .catch(function(err) {
      if (loading) loading.textContent = 'Error loading quizzes';
      console.error(err);
    });
}

function showCreateQuizModal() {
  var modalOverlay = document.getElementById('modalOverlay');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var modalSave = document.getElementById('modalSave');

  if (!modalOverlay || !modalBody) return;

  // Reset state
  createQuizImportedData = null;

  modalTitle.textContent = 'Create Quiz';
  modalBody.innerHTML =
    '<div class="form-group">' +
      '<label>Quiz Title *</label>' +
      '<input type="text" id="quizTitleInput" class="form-input" placeholder="Enter quiz title">' +
    '</div>' +
    '<div class="form-group">' +
      '<h4 style="margin-bottom:8px;">Assign to Curriculum Position (optional)</h4>' +
      '<p style="font-size:12px;color:#888;margin-bottom:8px;">Leave unselected to create a general quiz (available in the "General" section).</p>' +
      '<div class="filter-bar" id="createQuizPositionSelectors">' +
        '<label>Grade:</label>' +
        '<select id="createQuizGradeSelect" class="form-select">' +
          '<option value="">-- Select Grade --</option>' +
        '</select>' +
        '<label>Subject:</label>' +
        '<select id="createQuizSubjectSelect" class="form-select" disabled>' +
          '<option value="">-- Select Subject --</option>' +
        '</select>' +
        '<label>Content:</label>' +
        '<select id="createQuizContentSelect" class="form-select" disabled>' +
          '<option value="">-- Select Content --</option>' +
        '</select>' +
        '<label>Subcontent:</label>' +
        '<select id="createQuizSubcontentSelect" class="form-select" disabled>' +
          '<option value="">-- Select Subcontent --</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Upload Questions JSON *</label>' +
      '<input type="file" id="createQuizJsonFile" accept=".json" class="form-input">' +
      '<p style="font-size:12px;color:#888;margin-top:4px;">Upload a .json file with question_text, options, and correct_answer fields.</p>' +
      '<div id="createQuizJsonPreview" style="display:none; margin-top:10px;">' +
        '<h4>Question Preview</h4>' +
        '<p>Quiz Title: <strong id="createQuizJsonPreviewTitle"></strong></p>' +
        '<p>Questions: <strong id="createQuizJsonPreviewCount"></strong></p>' +
        '<div style="max-height:200px;overflow-y:auto;">' +
          '<table class="admin-table">' +
            '<thead>' +
              '<tr><th>#</th><th>Question</th><th>Options</th><th>Difficulty</th></tr>' +
            '</thead>' +
            '<tbody id="createQuizJsonPreviewBody"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Load grades for position selector
  loadCreateQuizPositionSelectors();

  // Wire up JSON file input
  var fileInput = document.getElementById('createQuizJsonFile');
  fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      parseCreateQuizJSON(this.files[0]);
    } else {
      createQuizImportedData = null;
      document.getElementById('createQuizJsonPreview').style.display = 'none';
    }
  });

  modalOverlay.style.display = 'flex';

  // Remove old listeners by cloning
  var newSave = modalSave.cloneNode(true);
  modalSave.parentNode.replaceChild(newSave, modalSave);
  var currentSave = document.getElementById('modalSave');

  currentSave.addEventListener('click', function() {
    var title = document.getElementById('quizTitleInput').value.trim();
    if (!title) {
      adminAPI.showToast('Please enter a quiz title', 'error');
      return;
    }

    if (!createQuizImportedData || !createQuizImportedData.questions || !createQuizImportedData.questions.length) {
      adminAPI.showToast('Please upload a JSON file with questions', 'error');
      return;
    }

    var gradeId = document.getElementById('createQuizGradeSelect').value;
    var subjectId = document.getElementById('createQuizSubjectSelect').value;
    var contentId = document.getElementById('createQuizContentSelect').value;
    var subcontentId = document.getElementById('createQuizSubcontentSelect').value;

    var isGeneral = !gradeId;

    var quizData = {
      title: title,
      is_general: isGeneral,
      questions: createQuizImportedData.questions
    };

    if (!isGeneral) {
      quizData.grade_id = gradeId;
      quizData.subject_id = subjectId || null;
      quizData.content_id = contentId || null;
      quizData.subcontent_id = subcontentId || null;
    }

    currentSave.disabled = true;
    currentSave.textContent = 'Creating...';

    adminAPI.createQuiz(quizData)
      .then(function(result) {
        adminAPI.showToast('Quiz "' + result.quiz.title + '" created with ' + result.questionCount + ' questions', 'success');
        modalOverlay.style.display = 'none';
        loadQuizzes();
      })
      .catch(function(err) {
        adminAPI.showToast(err.message || 'Failed to create quiz', 'error');
        currentSave.disabled = false;
        currentSave.textContent = 'Save';
      });
  });

  // Cancel
  document.getElementById('modalCancel').onclick = function() {
    modalOverlay.style.display = 'none';
  };
  document.getElementById('modalClose').onclick = function() {
    modalOverlay.style.display = 'none';
  };
}

function parseCreateQuizJSON(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!data.title || !Array.isArray(data.questions) || !data.questions.length) {
        adminAPI.showToast('Invalid JSON: must have "title" and "questions" array', 'error');
        createQuizImportedData = null;
        document.getElementById('createQuizJsonPreview').style.display = 'none';
        return;
      }

      // Normalize questions: handle numeric correct_answer, clean empty strings
      data.questions = data.questions.map(function(q) {
        // Convert correct_answer from numeric index to option id if needed
        var correctAnswer = q.correct_answer;
        if (typeof correctAnswer === 'number' && Array.isArray(q.options)) {
          var optionIds = q.options.map(function(o) { return o.id; });
          correctAnswer = optionIds[correctAnswer] || optionIds[0] || 'a';
        }

        // Clean option_image empty strings and filter them out
        var cleanOptions = (q.options || []).map(function(opt) {
          var cleanOpt = { id: opt.id, text: opt.text };
          if (opt.option_image && opt.option_image.trim()) {
            cleanOpt.option_image = opt.option_image.trim();
          }
          return cleanOpt;
        });

        // Clean question_image empty string
        var questionImage = q.question_image && q.question_image.trim() ? q.question_image.trim() : null;

        return {
          question_text: q.question_text,
          question_image: questionImage,
          options: cleanOptions,
          correct_answer: correctAnswer,
          difficulty: q.difficulty || 'easy'
        };
      });

      // Auto-fill the title from JSON if empty
      var titleInput = document.getElementById('quizTitleInput');
      if (!titleInput.value.trim()) {
        titleInput.value = data.title;
      }

      createQuizImportedData = data;
      showCreateQuizJsonPreview(data);
    } catch (err) {
      adminAPI.showToast('Invalid JSON file: ' + err.message, 'error');
      createQuizImportedData = null;
      document.getElementById('createQuizJsonPreview').style.display = 'none';
    }
  };
  reader.readAsText(file);
}

function showCreateQuizJsonPreview(data) {
  document.getElementById('createQuizJsonPreviewTitle').textContent = data.title;
  document.getElementById('createQuizJsonPreviewCount').textContent = data.questions.length;
  document.getElementById('createQuizJsonPreview').style.display = '';

  var previewBody = document.getElementById('createQuizJsonPreviewBody');
  previewBody.innerHTML = '';

  data.questions.forEach(function(q, index) {
    var tr = document.createElement('tr');
    var optionCount = q.options ? q.options.length : 0;
    var difficulty = q.difficulty || 'easy';
    tr.innerHTML =
      '<td>' + (index + 1) + '</td>' +
      '<td>' + escapeHtml(q.question_text.substring(0, 60)) + (q.question_text.length > 60 ? '...' : '') + '</td>' +
      '<td>' + optionCount + '</td>' +
      '<td><span class="difficulty-badge difficulty-' + difficulty + '">' + difficulty + '</span></td>';
    previewBody.appendChild(tr);
  });
}

function loadCreateQuizPositionSelectors() {
  var gradeSelect = document.getElementById('createQuizGradeSelect');
  if (!gradeSelect) return;

  adminAPI.getGrades()
    .then(function(grades) {
      gradeSelect.innerHTML = '<option value="">-- Select Grade --</option>';
      grades.forEach(function(g) {
        var opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        gradeSelect.appendChild(opt);
      });
    })
    .catch(function(err) {
      console.error('Failed to load grades:', err);
    });

  setupCreateQuizPositionListeners();
}

function setupCreateQuizPositionListeners() {
  var gradeSelect = document.getElementById('createQuizGradeSelect');
  var subjectSelect = document.getElementById('createQuizSubjectSelect');
  var contentSelect = document.getElementById('createQuizContentSelect');
  var subcontentSelect = document.getElementById('createQuizSubcontentSelect');

  gradeSelect.addEventListener('change', function() {
    var gradeId = this.value;
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    subjectSelect.disabled = !gradeId;
    contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
    contentSelect.disabled = true;
    subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
    subcontentSelect.disabled = true;

    if (!gradeId) return;

    adminAPI.getSubjectsByGrade(gradeId)
      .then(function(subjects) {
        subjects.forEach(function(s) {
          var opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = s.name;
          subjectSelect.appendChild(opt);
        });
      })
      .catch(function(err) {
        console.error('Failed to load subjects:', err);
      });
  });

  subjectSelect.addEventListener('change', function() {
    var subjectId = this.value;
    contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
    contentSelect.disabled = !subjectId;
    subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
    subcontentSelect.disabled = true;

    if (!subjectId) return;

    adminAPI.getContentsBySubject(subjectId)
      .then(function(contents) {
        contents.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          contentSelect.appendChild(opt);
        });
      })
      .catch(function(err) {
        console.error('Failed to load contents:', err);
      });
  });

  contentSelect.addEventListener('change', function() {
    var contentId = this.value;
    subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
    subcontentSelect.disabled = !contentId;

    if (!contentId) return;

    adminAPI.getSubcontentsByContent(contentId)
      .then(function(subcontents) {
        subcontents.forEach(function(sc) {
          var opt = document.createElement('option');
          opt.value = sc.id;
          opt.textContent = sc.name;
          subcontentSelect.appendChild(opt);
        });
      })
      .catch(function(err) {
        console.error('Failed to load subcontents:', err);
      });
  });
}

function showEditQuizModal(id, currentTitle) {
  var modalOverlay = document.getElementById('modalOverlay');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var modalSave = document.getElementById('modalSave');

  if (!modalOverlay || !modalBody) return;

  modalTitle.textContent = 'Edit Quiz';
  modalBody.innerHTML =
    '<div class="form-group">' +
      '<label>Quiz Title *</label>' +
      '<input type="text" id="quizTitleInput" class="form-input" value="' + escapeHtml(currentTitle) + '">' +
    '</div>';

  modalOverlay.style.display = 'flex';

  var newSave = modalSave.cloneNode(true);
  modalSave.parentNode.replaceChild(newSave, modalSave);
  var currentSave = document.getElementById('modalSave');

  currentSave.addEventListener('click', function() {
    var title = document.getElementById('quizTitleInput').value.trim();
    if (!title) {
      adminAPI.showToast('Please enter a quiz title', 'error');
      return;
    }

    adminAPI.updateQuiz(id, { title: title })
      .then(function() {
        adminAPI.showToast('Quiz updated successfully', 'success');
        modalOverlay.style.display = 'none';
        loadQuizzes();
      })
      .catch(function(err) {
        adminAPI.showToast(err.message || 'Failed to update quiz', 'error');
      });
  });

  document.getElementById('modalCancel').onclick = function() {
    modalOverlay.style.display = 'none';
  };
  document.getElementById('modalClose').onclick = function() {
    modalOverlay.style.display = 'none';
  };
}

function deleteQuiz(id) {
  if (!confirm('Are you sure you want to delete this quiz? All questions will also be deleted.')) return;

  adminAPI.deleteQuiz(id)
    .then(function() {
      adminAPI.showToast('Quiz deleted successfully', 'success');
      loadQuizzes();
    })
    .catch(function(err) {
      adminAPI.showToast(err.message || 'Failed to delete quiz', 'error');
    });
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}