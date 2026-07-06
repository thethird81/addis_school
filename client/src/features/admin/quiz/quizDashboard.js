// Quiz Dashboard - Quiz management, questions, and assignments for the new dashboard
(function() {
  'use strict';

  let quizManagementInitialized = false;
  let questionManagementInitialized = false;
  let quizAssignmentInitialized = false;
  let createQuizImportedData = null;

  // ==================== INIT ====================

  function init() {
    if (!quizManagementInitialized) {
      quizManagementInitialized = true;
      initQuizManagement();
    }
    if (!questionManagementInitialized) {
      questionManagementInitialized = true;
      initQuestionManagement();
    }
    if (!quizAssignmentInitialized) {
      quizAssignmentInitialized = true;
      initQuizAssignment();
    }
  }

  // ==================== QUIZ MANAGEMENT ====================

  function initQuizManagement() {
    const addBtn = document.getElementById('addQuizBtn');
    if (addBtn) addBtn.addEventListener('click', showCreateQuizModal);
    loadQuizzes();
  }

  function loadQuizzes() {
    const tbody = document.getElementById('quizzesTableBody');
    const loading = document.getElementById('quizzesLoading');
    if (!tbody) return;

    if (loading) loading.textContent = 'Loading...';

    window.adminServices.getQuizzes()
      .then(function(quizzes) {
        if (loading) loading.textContent = '';
        tbody.innerHTML = '';

        if (!quizzes || !quizzes.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No quizzes found</td></tr>';
          return;
        }

        quizzes.forEach(function(quiz) {
          const tr = document.createElement('tr');
          const questionCount = quiz._count ? quiz._count.questions : 0;
          const created = quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() : '-';

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
    const modalOverlay = document.getElementById('quizModal');
    const modalTitle = document.getElementById('quizModalTitle');
    const modalBody = document.getElementById('quizModalBody');
    const modalSave = document.getElementById('quizModalSave');

    if (!modalOverlay || !modalBody) return;

    createQuizImportedData = null;

    modalTitle.textContent = 'Create Quiz';
    modalBody.innerHTML =
      '<div class="form-group">' +
        '<label>Quiz Title *</label>' +
        '<input type="text" id="quizTitleInput" class="form-input" placeholder="Enter quiz title">' +
      '</div>' +
      '<div class="form-group">' +
        '<h4 style="margin-bottom:8px;">Assign to Curriculum Position (optional)</h4>' +
        '<p style="font-size:12px;color:#888;margin-bottom:8px;">Leave unselected to create a general quiz.</p>' +
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
              '<thead><tr><th>#</th><th>Question</th><th>Options</th><th>Difficulty</th></tr></thead>' +
              '<tbody id="createQuizJsonPreviewBody"></tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>';

    loadCreateQuizPositionSelectors();

    const fileInput = document.getElementById('createQuizJsonFile');
    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        parseCreateQuizJSON(this.files[0]);
      } else {
        createQuizImportedData = null;
        document.getElementById('createQuizJsonPreview').style.display = 'none';
      }
    });

    modalOverlay.style.display = 'flex';

    const newSave = modalSave.cloneNode(true);
    modalSave.parentNode.replaceChild(newSave, modalSave);
    const currentSave = document.getElementById('quizModalSave');

    currentSave.addEventListener('click', function() {
      const title = document.getElementById('quizTitleInput').value.trim();
      if (!title) {
        window.showToast('Please enter a quiz title', 'error');
        return;
      }

      if (!createQuizImportedData || !createQuizImportedData.questions || !createQuizImportedData.questions.length) {
        window.showToast('Please upload a JSON file with questions', 'error');
        return;
      }

      const gradeId = document.getElementById('createQuizGradeSelect').value;
      const subjectId = document.getElementById('createQuizSubjectSelect').value;
      const contentId = document.getElementById('createQuizContentSelect').value;
      const subcontentId = document.getElementById('createQuizSubcontentSelect').value;
      const isGeneral = !gradeId;

      const quizData = {
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

      window.adminServices.createQuiz(quizData)
        .then(function(result) {
          window.showToast('Quiz "' + result.quiz.title + '" created with ' + result.questionCount + ' questions', 'success');
          modalOverlay.style.display = 'none';
          loadQuizzes();
        })
        .catch(function(err) {
          window.showToast(err.message || 'Failed to create quiz', 'error');
          currentSave.disabled = false;
          currentSave.textContent = 'Save';
        });
    });

    document.getElementById('quizModalCancel').onclick = function() {
      modalOverlay.style.display = 'none';
    };
    document.getElementById('quizModalClose').onclick = function() {
      modalOverlay.style.display = 'none';
    };
  }

  function parseCreateQuizJSON(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.title || !Array.isArray(data.questions) || !data.questions.length) {
          window.showToast('Invalid JSON: must have "title" and "questions" array', 'error');
          createQuizImportedData = null;
          document.getElementById('createQuizJsonPreview').style.display = 'none';
          return;
        }

        data.questions = data.questions.map(function(q) {
          let correctAnswer = q.correct_answer;
          if (typeof correctAnswer === 'number' && Array.isArray(q.options)) {
            const optionIds = q.options.map(function(o) { return o.id; });
            correctAnswer = optionIds[correctAnswer] || optionIds[0] || 'a';
          }

          const cleanOptions = (q.options || []).map(function(opt) {
            const cleanOpt = { id: opt.id, text: opt.text };
            if (opt.option_image && opt.option_image.trim()) {
              cleanOpt.option_image = opt.option_image.trim();
            }
            return cleanOpt;
          });

          const questionImage = q.question_image && q.question_image.trim() ? q.question_image.trim() : null;

          return {
            question_text: q.question_text,
            question_image: questionImage,
            options: cleanOptions,
            correct_answer: correctAnswer,
            difficulty: q.difficulty || 'easy'
          };
        });

        const titleInput = document.getElementById('quizTitleInput');
        if (!titleInput.value.trim()) {
          titleInput.value = data.title;
        }

        createQuizImportedData = data;
        showCreateQuizJsonPreview(data);
      } catch (err) {
        window.showToast('Invalid JSON file: ' + err.message, 'error');
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

    const previewBody = document.getElementById('createQuizJsonPreviewBody');
    previewBody.innerHTML = '';

    data.questions.forEach(function(q, index) {
      const tr = document.createElement('tr');
      const optionCount = q.options ? q.options.length : 0;
      const difficulty = q.difficulty || 'easy';
      tr.innerHTML =
        '<td>' + (index + 1) + '</td>' +
        '<td>' + escapeHtml(q.question_text.substring(0, 60)) + (q.question_text.length > 60 ? '...' : '') + '</td>' +
        '<td>' + optionCount + '</td>' +
        '<td><span class="difficulty-badge difficulty-' + difficulty + '">' + difficulty + '</span></td>';
      previewBody.appendChild(tr);
    });
  }

  function loadCreateQuizPositionSelectors() {
    const gradeSelect = document.getElementById('createQuizGradeSelect');
    if (!gradeSelect) return;

    window.adminServices.getGrades()
      .then(function(grades) {
        gradeSelect.innerHTML = '<option value="">-- Select Grade --</option>';
        grades.forEach(function(g) {
          const opt = document.createElement('option');
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
    const gradeSelect = document.getElementById('createQuizGradeSelect');
    const subjectSelect = document.getElementById('createQuizSubjectSelect');
    const contentSelect = document.getElementById('createQuizContentSelect');
    const subcontentSelect = document.getElementById('createQuizSubcontentSelect');

    gradeSelect.addEventListener('change', function() {
      const gradeId = this.value;
      subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
      subjectSelect.disabled = !gradeId;
      contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
      contentSelect.disabled = true;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = true;

      if (!gradeId) return;

      window.adminServices.getSubjects(gradeId)
        .then(function(subjects) {
          subjects.forEach(function(s) {
            const opt = document.createElement('option');
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
      const subjectId = this.value;
      contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
      contentSelect.disabled = !subjectId;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = true;

      if (!subjectId) return;

      window.adminServices.getContents(subjectId)
        .then(function(contents) {
          contents.forEach(function(c) {
            const opt = document.createElement('option');
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
      const contentId = this.value;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = !contentId;

      if (!contentId) return;

      window.adminServices.getSubcontents(contentId)
        .then(function(subcontents) {
          subcontents.forEach(function(sc) {
            const opt = document.createElement('option');
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
    const modalOverlay = document.getElementById('quizModal');
    const modalTitle = document.getElementById('quizModalTitle');
    const modalBody = document.getElementById('quizModalBody');
    const modalSave = document.getElementById('quizModalSave');

    if (!modalOverlay || !modalBody) return;

    modalTitle.textContent = 'Edit Quiz';
    modalBody.innerHTML =
      '<div class="form-group">' +
        '<label>Quiz Title *</label>' +
        '<input type="text" id="quizTitleInput" class="form-input" value="' + escapeHtml(currentTitle) + '">' +
      '</div>';

    modalOverlay.style.display = 'flex';

    const newSave = modalSave.cloneNode(true);
    modalSave.parentNode.replaceChild(newSave, modalSave);
    const currentSave = document.getElementById('quizModalSave');

    currentSave.addEventListener('click', function() {
      const title = document.getElementById('quizTitleInput').value.trim();
      if (!title) {
        window.showToast('Please enter a quiz title', 'error');
        return;
      }

      window.adminServices.updateQuiz(id, { title: title })
        .then(function() {
          window.showToast('Quiz updated successfully', 'success');
          modalOverlay.style.display = 'none';
          loadQuizzes();
        })
        .catch(function(err) {
          window.showToast(err.message || 'Failed to update quiz', 'error');
        });
    });

    document.getElementById('quizModalCancel').onclick = function() {
      modalOverlay.style.display = 'none';
    };
    document.getElementById('quizModalClose').onclick = function() {
      modalOverlay.style.display = 'none';
    };
  }

  function deleteQuiz(id) {
    if (!confirm('Are you sure you want to delete this quiz? All questions will also be deleted.')) return;

    window.adminServices.deleteQuiz(id)
      .then(function() {
        window.showToast('Quiz deleted successfully', 'success');
        loadQuizzes();
      })
      .catch(function(err) {
        window.showToast(err.message || 'Failed to delete quiz', 'error');
      });
  }

  // ==================== QUESTION MANAGEMENT ====================

  function initQuestionManagement() {
    const addBtn = document.getElementById('addQuestionBtn');
    if (addBtn) addBtn.addEventListener('click', showCreateQuestionModal);

    loadQuizFilter();
    setupQuestionFilterListener();
  }

  function loadQuizFilter() {
    const filter = document.getElementById('questionQuizFilter');
    if (!filter) return;

    window.adminServices.getQuizzes()
      .then(function(quizzes) {
        filter.innerHTML = '<option value="">-- Select a Quiz --</option>';
        quizzes.forEach(function(quiz) {
          const opt = document.createElement('option');
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
    const filter = document.getElementById('questionQuizFilter');
    if (!filter) return;

    filter.addEventListener('change', function() {
      const quizId = this.value;
      if (quizId) {
        loadQuestions(quizId);
      } else {
        const tbody = document.getElementById('questionsTableBody');
        const loading = document.getElementById('questionsLoading');
        if (tbody) tbody.innerHTML = '';
        if (loading) loading.textContent = 'Select a quiz to view questions';
      }
    });
  }

  function loadQuestions(quizId) {
    const tbody = document.getElementById('questionsTableBody');
    const loading = document.getElementById('questionsLoading');
    if (!tbody) return;

    if (loading) loading.textContent = 'Loading...';

    window.adminServices.getQuestionsByQuiz(quizId)
      .then(function(questions) {
        if (loading) loading.textContent = '';
        tbody.innerHTML = '';

        if (!questions || !questions.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No questions in this quiz</td></tr>';
          return;
        }

        questions.forEach(function(q) {
          const tr = document.createElement('tr');
          const optionsText = q.options ? q.options.length + ' options' : '-';
          const difficulty = q.difficulty || 'easy';
          const hasImage = q.question_image ? 'Yes' : 'No';

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
    const quizFilter = document.getElementById('questionQuizFilter');
    const quizId = quizFilter ? quizFilter.value : '';
    if (!quizId) {
      window.showToast('Please select a quiz first', 'error');
      return;
    }

    showQuestionForm(null, quizId);
  }

  function showEditQuestionModal(questionId, quizId) {
    const loading = document.getElementById('questionsLoading');
    if (loading) loading.textContent = 'Loading question data...';

    window.adminServices.getQuestionsByQuiz(quizId)
      .then(function(questions) {
        const question = questions.find(function(q) { return q.id === questionId; });
        if (!question) {
          window.showToast('Question not found', 'error');
          return;
        }
        if (loading) loading.textContent = '';
        showQuestionForm(question, quizId);
      })
      .catch(function(err) {
        if (loading) loading.textContent = '';
        window.showToast('Failed to load question', 'error');
      });
  }

  function showQuestionForm(existingQuestion, quizId) {
    const modalOverlay = document.getElementById('questionModal');
    const modalTitle = document.getElementById('questionModalTitle');
    const modalBody = document.getElementById('questionModalBody');
    const modalSave = document.getElementById('questionModalSave');

    if (!modalOverlay || !modalBody) return;

    const isEdit = existingQuestion !== null;
    modalTitle.textContent = isEdit ? 'Edit Question' : 'Create Question';

    const q = existingQuestion || { question_text: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }], correct_answer: '', difficulty: 'easy', question_image: '' };

    let optionsHtml = '';
    (q.options || []).forEach(function(opt) {
      optionsHtml +=
        '<div class="option-row">' +
          '<span class="option-id-label">' + opt.id + '</span>' +
          '<input type="radio" name="correctOption" class="option-radio" value="' + opt.id + '" ' + (q.correct_answer === opt.id ? 'checked' : '') + '>' +
          '<input type="text" class="option-input" value="' + escapeHtml(opt.text) + '" placeholder="Option ' + opt.id + ' text">' +
          '<input type="text" class="option-image-input" value="' + escapeHtml(opt.option_image || '') + '" placeholder="Option image URL (optional)">' +
          '<button class="btn-remove-option" type="button">&times;</button>' +
        '</div>';
    });

    const nextId = String.fromCharCode(97 + (q.options || []).length);

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

    document.getElementById('addOptionBtn').addEventListener('click', function() {
      const container = document.getElementById('optionsContainer');
      const nextIdInput = document.getElementById('nextOptionId');
      const id = nextIdInput.value;

      const row = document.createElement('div');
      row.className = 'option-row';
      row.innerHTML =
        '<span class="option-id-label">' + id + '</span>' +
        '<input type="radio" name="correctOption" class="option-radio" value="' + id + '">' +
        '<input type="text" class="option-input" placeholder="Option ' + id + ' text">' +
        '<input type="text" class="option-image-input" placeholder="Option image URL (optional)">' +
        '<button class="btn-remove-option" type="button">&times;</button>';

      container.appendChild(row);

      const newChar = String.fromCharCode(id.charCodeAt(0) + 1);
      nextIdInput.value = newChar;

      row.querySelector('.btn-remove-option').addEventListener('click', function() {
        row.remove();
      });
    });

    document.querySelectorAll('.btn-remove-option').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const row = this.closest('.option-row');
        if (document.querySelectorAll('.option-row').length > 2) {
          row.remove();
        } else {
          window.showToast('A question must have at least 2 options', 'error');
        }
      });
    });

    const newSave = modalSave.cloneNode(true);
    modalSave.parentNode.replaceChild(newSave, modalSave);
    const currentSave = document.getElementById('questionModalSave');

    currentSave.addEventListener('click', function() {
      const questionText = document.getElementById('questionTextInput').value.trim();
      const questionImage = document.getElementById('questionImageInput').value.trim() || null;
      const difficulty = document.getElementById('questionDifficultyInput').value;

      if (!questionText) {
        window.showToast('Please enter question text', 'error');
        return;
      }

      const optionRows = document.querySelectorAll('.option-row');
      const options = [];
      let correctAnswer = null;

      optionRows.forEach(function(row) {
        const id = row.querySelector('.option-id-label').textContent;
        const text = row.querySelector('.option-input').value.trim();
        const isCorrect = row.querySelector('.option-radio').checked;
        const imageInput = row.querySelector('.option-image-input');
        const optionImage = imageInput ? imageInput.value.trim() || null : null;

        const optionData = { id: id, text: text };
        if (optionImage) optionData.option_image = optionImage;
        options.push(optionData);
        if (isCorrect) correctAnswer = id;
      });

      if (!correctAnswer) {
        window.showToast('Please select the correct answer', 'error');
        return;
      }

      const hasEmptyOption = options.some(function(o) { return !o.text; });
      if (hasEmptyOption) {
        window.showToast('Please fill in all option texts', 'error');
        return;
      }

      const data = {
        quiz_id: quizId,
        question_text: questionText,
        options: options,
        correct_answer: correctAnswer,
        difficulty: difficulty,
        question_image: questionImage
      };

      const apiCall = isEdit
        ? window.adminServices.updateQuestion(existingQuestion.id, data)
        : window.adminServices.createQuestion(data);

      apiCall
        .then(function() {
          window.showToast(isEdit ? 'Question updated' : 'Question created', 'success');
          modalOverlay.style.display = 'none';
          loadQuestions(quizId);
        })
        .catch(function(err) {
          window.showToast(err.message || 'Failed to save question', 'error');
        });
    });

    document.getElementById('questionModalCancel').onclick = function() {
      modalOverlay.style.display = 'none';
    };
    document.getElementById('questionModalClose').onclick = function() {
      modalOverlay.style.display = 'none';
    };
  }

  function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    window.adminServices.deleteQuestion(id)
      .then(function() {
        window.showToast('Question deleted', 'success');
        const quizId = document.getElementById('questionQuizFilter').value;
        if (quizId) loadQuestions(quizId);
      })
      .catch(function(err) {
        window.showToast(err.message || 'Failed to delete question', 'error');
      });
  }

  // ==================== QUIZ ASSIGNMENTS ====================

  function initQuizAssignment() {
    loadAssignmentGradeFilter();
    loadAssignmentQuizSelect();
    setupAssignmentFilterListeners();
  }

  function loadAssignmentGradeFilter() {
    const filter = document.getElementById('quizAssignmentGradeFilter');
    if (!filter) return;

    window.adminServices.getGrades()
      .then(function(grades) {
        filter.innerHTML = '<option value="">-- Select a Grade --</option>';
        grades.forEach(function(g) {
          const opt = document.createElement('option');
          opt.value = g.id;
          opt.textContent = g.name;
          filter.appendChild(opt);
        });
      })
      .catch(function(err) {
        console.error('Failed to load grades:', err);
      });
  }

  function loadAssignmentQuizSelect() {
    const select = document.getElementById('quizAssignmentQuizSelect');
    if (!select) return;

    window.adminServices.getQuizzes()
      .then(function(quizzes) {
        select.innerHTML = '<option value="">-- Select a Quiz --</option>';
        quizzes.forEach(function(quiz) {
          const opt = document.createElement('option');
          opt.value = quiz.id;
          opt.textContent = quiz.title;
          select.appendChild(opt);
        });
      })
      .catch(function(err) {
        console.error('Failed to load quizzes:', err);
      });
  }

  function getCurrentAssignmentSelection() {
    return {
      grade_id: document.getElementById('quizAssignmentGradeFilter').value,
      subject_id: document.getElementById('quizAssignmentSubjectFilter').value,
      content_id: document.getElementById('quizAssignmentContentFilter').value,
      subcontent_id: document.getElementById('quizAssignmentSubcontentFilter').value
    };
  }

  function getSelectedLevelLabel() {
    const sel = getCurrentAssignmentSelection();
    const gradeSelect = document.getElementById('quizAssignmentGradeFilter');
    const subjectSelect = document.getElementById('quizAssignmentSubjectFilter');
    const contentSelect = document.getElementById('quizAssignmentContentFilter');
    const subcontentSelect = document.getElementById('quizAssignmentSubcontentFilter');

    if (sel.subcontent_id) return 'Subcontent: ' + subcontentSelect.options[subcontentSelect.selectedIndex].text;
    if (sel.content_id) return 'Content: ' + contentSelect.options[contentSelect.selectedIndex].text;
    if (sel.subject_id) return 'Subject: ' + subjectSelect.options[subjectSelect.selectedIndex].text;
    if (sel.grade_id) return 'Grade: ' + gradeSelect.options[gradeSelect.selectedIndex].text;
    return '';
  }

  function getAssignmentParams() {
    const sel = getCurrentAssignmentSelection();
    const params = {};
    if (sel.grade_id) params.grade_id = sel.grade_id;
    if (sel.subject_id) params.subject_id = sel.subject_id;
    if (sel.content_id) params.content_id = sel.content_id;
    if (sel.subcontent_id) params.subcontent_id = sel.subcontent_id;
    return params;
  }

  function setupAssignmentFilterListeners() {
    const gradeSelect = document.getElementById('quizAssignmentGradeFilter');
    const subjectSelect = document.getElementById('quizAssignmentSubjectFilter');
    const contentSelect = document.getElementById('quizAssignmentContentFilter');
    const subcontentSelect = document.getElementById('quizAssignmentSubcontentFilter');
    const assignBtn = document.getElementById('assignQuizBtn');

    gradeSelect.addEventListener('change', function() {
      const gradeId = this.value;
      subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
      subjectSelect.disabled = !gradeId;
      contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
      contentSelect.disabled = true;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = true;
      updateAssignButtonState();

      if (!gradeId) {
        clearAssignedQuizzes();
        return;
      }

      loadAssignedQuizzes();
      updateAssignedQuizzesHeader('Grade');

      window.adminServices.getSubjects(gradeId)
        .then(function(subjects) {
          subjects.forEach(function(s) {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            subjectSelect.appendChild(opt);
          });
        });
    });

    subjectSelect.addEventListener('change', function() {
      const subjectId = this.value;
      contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
      contentSelect.disabled = !subjectId;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = true;
      updateAssignButtonState();

      if (!subjectId) {
        if (gradeSelect.value) {
          loadAssignedQuizzes();
          updateAssignedQuizzesHeader('Grade');
        } else {
          clearAssignedQuizzes();
        }
        return;
      }

      loadAssignedQuizzes();
      updateAssignedQuizzesHeader('Subject');

      window.adminServices.getContents(subjectId)
        .then(function(contents) {
          contents.forEach(function(c) {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            contentSelect.appendChild(opt);
          });
        });
    });

    contentSelect.addEventListener('change', function() {
      const contentId = this.value;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = !contentId;
      updateAssignButtonState();

      if (!contentId) {
        if (subjectSelect.value) {
          loadAssignedQuizzes();
          updateAssignedQuizzesHeader('Subject');
        } else if (gradeSelect.value) {
          loadAssignedQuizzes();
          updateAssignedQuizzesHeader('Grade');
        } else {
          clearAssignedQuizzes();
        }
        return;
      }

      loadAssignedQuizzes();
      updateAssignedQuizzesHeader('Content');

      window.adminServices.getSubcontents(contentId)
        .then(function(subcontents) {
          subcontents.forEach(function(sc) {
            const opt = document.createElement('option');
            opt.value = sc.id;
            opt.textContent = sc.name;
            subcontentSelect.appendChild(opt);
          });
        });
    });

    subcontentSelect.addEventListener('change', function() {
      updateAssignButtonState();
      if (this.value) {
        loadAssignedQuizzes();
        updateAssignedQuizzesHeader('Subcontent');
      } else if (contentSelect.value) {
        loadAssignedQuizzes();
        updateAssignedQuizzesHeader('Content');
      } else if (subjectSelect.value) {
        loadAssignedQuizzes();
        updateAssignedQuizzesHeader('Subject');
      } else if (gradeSelect.value) {
        loadAssignedQuizzes();
        updateAssignedQuizzesHeader('Grade');
      } else {
        clearAssignedQuizzes();
      }
    });

    if (assignBtn) {
      assignBtn.addEventListener('click', handleAssignQuiz);
    }
  }

  function updateAssignedQuizzesHeader(levelName) {
    const hint = document.getElementById('quizAssignmentList');
    if (hint) {
      hint.innerHTML = '<p class="hint">Showing quizzes assigned at the selected <strong>' + levelName + '</strong> level</p>';
    }
  }

  function clearAssignedQuizzes() {
    document.getElementById('quizAssignmentList').innerHTML = '<p class="hint">Select a grade/subject/content to see assigned quizzes</p>';
    document.getElementById('assignedQuizzesList').innerHTML = '<p class="hint">Select a position above to see assigned quizzes</p>';
  }

  function updateAssignButtonState() {
    const assignBtn = document.getElementById('assignQuizBtn');
    const quizSelect = document.getElementById('quizAssignmentQuizSelect');
    const sel = getCurrentAssignmentSelection();

    const hasPosition = sel.grade_id || sel.subject_id || sel.content_id || sel.subcontent_id;
    if (assignBtn) {
      assignBtn.disabled = !(quizSelect && quizSelect.value && hasPosition);
    }
  }

  function loadAssignedQuizzes() {
    const container = document.getElementById('assignedQuizzesList');
    if (!container) return;

    const params = getAssignmentParams();
    if (Object.keys(params).length === 0) {
      container.innerHTML = '<p class="hint">Select a position to see assigned quizzes</p>';
      return;
    }

    container.innerHTML = '<p style="text-align:center;color:#888;">Loading...</p>';

    window.adminServices.getQuizAssignments(params)
      .then(function(assignments) {
        if (!assignments || !assignments.length) {
          container.innerHTML = '<p class="hint">No quizzes assigned to this position</p>';
          return;
        }

        const levelLabel = getSelectedLevelLabel();
        container.innerHTML = '<h4 style="margin-bottom:10px;">Assigned Quizzes (' + assignments.length + ') at ' + levelLabel + '</h4>';

        assignments.forEach(function(a) {
          const div = document.createElement('div');
          div.className = 'quiz-assignment-item';
          const quiz = a.quizzes || {};
          const questionCount = quiz._count ? quiz._count.questions : 0;

          div.innerHTML =
            '<div class="quiz-assignment-info">' +
              '<h4>' + escapeHtml(quiz.title || 'Unknown Quiz') + '</h4>' +
              '<p>' + questionCount + ' questions</p>' +
            '</div>' +
            '<button class="btn-delete btn-sm" data-id="' + a.id + '">Remove</button>';

          div.querySelector('.btn-delete').addEventListener('click', function() {
            removeAssignment(this.getAttribute('data-id'));
          });

          container.appendChild(div);
        });
      })
      .catch(function(err) {
        container.innerHTML = '<p class="hint">Error loading assignments</p>';
        console.error(err);
      });
  }

  function handleAssignQuiz() {
    const quizSelect = document.getElementById('quizAssignmentQuizSelect');
    const sel = getCurrentAssignmentSelection();

    if (!quizSelect.value) {
      window.showToast('Please select a quiz', 'error');
      return;
    }

    if (!sel.grade_id) {
      window.showToast('Please select at least a grade position', 'error');
      return;
    }

    const data = {
      quiz_id: quizSelect.value,
      grade_id: sel.grade_id,
      subject_id: sel.subject_id || null,
      content_id: sel.content_id || null,
      subcontent_id: sel.subcontent_id || null
    };

    window.adminServices.assignQuizToSubcontent(data)
      .then(function() {
        window.showToast('Quiz assigned successfully at ' + getSelectedLevelLabel(), 'success');
        loadAssignedQuizzes();
      })
      .catch(function(err) {
        window.showToast(err.message || 'Failed to assign quiz', 'error');
      });
  }

  function removeAssignment(assignmentId) {
    if (!confirm('Remove this quiz assignment?')) return;

    window.adminServices.removeQuizAssignment(assignmentId)
      .then(function() {
        window.showToast('Quiz assignment removed', 'success');
        loadAssignedQuizzes();
      })
      .catch(function(err) {
        window.showToast(err.message || 'Failed to remove assignment', 'error');
      });
  }

  // ==================== UTILITY ====================

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Export
  window.quizDashboard = {
    init: init,
    loadQuizzes: loadQuizzes
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();