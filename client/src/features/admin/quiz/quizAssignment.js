'use strict';

var quizAssignmentInitialized = false;

export function initQuizAssignment() {
  if (quizAssignmentInitialized) return;
  quizAssignmentInitialized = true;

  loadGradeFilter();
  loadQuizSelect();
  setupFilterListeners();
}

function loadGradeFilter() {
  var filter = document.getElementById('quizAssignmentGradeFilter');
  if (!filter) return;

  adminAPI.getGrades()
    .then(function(grades) {
      filter.innerHTML = '<option value="">-- Select a Grade --</option>';
      grades.forEach(function(g) {
        var opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        filter.appendChild(opt);
      });
    })
    .catch(function(err) {
      console.error('Failed to load grades:', err);
    });
}

function loadQuizSelect() {
  var select = document.getElementById('quizAssignmentQuizSelect');
  if (!select) return;

  adminAPI.getQuizzes()
    .then(function(quizzes) {
      select.innerHTML = '<option value="">-- Select a Quiz --</option>';
      quizzes.forEach(function(quiz) {
        var opt = document.createElement('option');
        opt.value = quiz.id;
        opt.textContent = quiz.title;
        select.appendChild(opt);
      });
    })
    .catch(function(err) {
      console.error('Failed to load quizzes:', err);
    });
}

function getCurrentSelection() {
  return {
    grade_id: document.getElementById('quizAssignmentGradeFilter').value,
    subject_id: document.getElementById('quizAssignmentSubjectFilter').value,
    content_id: document.getElementById('quizAssignmentContentFilter').value,
    subcontent_id: document.getElementById('quizAssignmentSubcontentFilter').value
  };
}

function getSelectedLevelLabel() {
  var sel = getCurrentSelection();
  var gradeSelect = document.getElementById('quizAssignmentGradeFilter');
  var subjectSelect = document.getElementById('quizAssignmentSubjectFilter');
  var contentSelect = document.getElementById('quizAssignmentContentFilter');
  var subcontentSelect = document.getElementById('quizAssignmentSubcontentFilter');

  if (sel.subcontent_id) return 'Subcontent: ' + subcontentSelect.options[subcontentSelect.selectedIndex].text;
  if (sel.content_id) return 'Content: ' + contentSelect.options[contentSelect.selectedIndex].text;
  if (sel.subject_id) return 'Subject: ' + subjectSelect.options[subjectSelect.selectedIndex].text;
  if (sel.grade_id) return 'Grade: ' + gradeSelect.options[gradeSelect.selectedIndex].text;
  return '';
}

function getAssignmentParams() {
  var sel = getCurrentSelection();
  var params = {};
  if (sel.grade_id) params.grade_id = sel.grade_id;
  if (sel.subject_id) params.subject_id = sel.subject_id;
  if (sel.content_id) params.content_id = sel.content_id;
  if (sel.subcontent_id) params.subcontent_id = sel.subcontent_id;
  return params;
}

function setupFilterListeners() {
  var gradeSelect = document.getElementById('quizAssignmentGradeFilter');
  var subjectSelect = document.getElementById('quizAssignmentSubjectFilter');
  var contentSelect = document.getElementById('quizAssignmentContentFilter');
  var subcontentSelect = document.getElementById('quizAssignmentSubcontentFilter');
  var assignBtn = document.getElementById('assignQuizBtn');

  gradeSelect.addEventListener('change', function() {
    var gradeId = this.value;
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

    // Load assigned quizzes at grade level
    loadAssignedQuizzes();
    updateAssignedQuizzesHeader('Grade');

    // Load subjects for further drill-down
    adminAPI.getSubjectsByGrade(gradeId)
      .then(function(subjects) {
        subjects.forEach(function(s) {
          var opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = s.name;
          subjectSelect.appendChild(opt);
        });
      });
  });

  subjectSelect.addEventListener('change', function() {
    var subjectId = this.value;
    contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
    contentSelect.disabled = !subjectId;
    subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
    subcontentSelect.disabled = true;
    updateAssignButtonState();

    if (!subjectId) {
      // If no subject selected but grade is selected, show grade-level assignments
      if (gradeSelect.value) {
        loadAssignedQuizzes();
        updateAssignedQuizzesHeader('Grade');
      } else {
        clearAssignedQuizzes();
      }
      return;
    }

    // Load assigned quizzes at subject level
    loadAssignedQuizzes();
    updateAssignedQuizzesHeader('Subject');

    adminAPI.getContentsBySubject(subjectId)
      .then(function(contents) {
        contents.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          contentSelect.appendChild(opt);
        });
      });
  });

  contentSelect.addEventListener('change', function() {
    var contentId = this.value;
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

    // Load assigned quizzes at content level
    loadAssignedQuizzes();
    updateAssignedQuizzesHeader('Content');

    adminAPI.getSubcontentsByContent(contentId)
      .then(function(subcontents) {
        subcontents.forEach(function(sc) {
          var opt = document.createElement('option');
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
  var hint = document.getElementById('quizAssignmentList');
  if (hint) {
    hint.innerHTML = '<p class="hint">Showing quizzes assigned at the selected <strong>' + levelName + '</strong> level</p>';
  }
}

function clearAssignedQuizzes() {
  document.getElementById('quizAssignmentList').innerHTML = '<p class="hint">Select a grade/subject/content to see assigned quizzes</p>';
  document.getElementById('assignedQuizzesList').innerHTML = '<p class="hint">Select a position above to see assigned quizzes</p>';
}

function updateAssignButtonState() {
  var assignBtn = document.getElementById('assignQuizBtn');
  var quizSelect = document.getElementById('quizAssignmentQuizSelect');
  var sel = getCurrentSelection();

  // Enable if a quiz is selected AND at least one level is selected
  var hasPosition = sel.grade_id || sel.subject_id || sel.content_id || sel.subcontent_id;
  if (assignBtn) {
    assignBtn.disabled = !(quizSelect && quizSelect.value && hasPosition);
  }
}

function loadAssignedQuizzes() {
  var container = document.getElementById('assignedQuizzesList');
  if (!container) return;

  var params = getAssignmentParams();
  if (Object.keys(params).length === 0) {
    container.innerHTML = '<p class="hint">Select a position to see assigned quizzes</p>';
    return;
  }

  container.innerHTML = '<p style="text-align:center;color:#888;">Loading...</p>';

  adminAPI.getQuizAssignments(params)
    .then(function(assignments) {
      if (!assignments || !assignments.length) {
        container.innerHTML = '<p class="hint">No quizzes assigned to this position</p>';
        return;
      }

      var levelLabel = getSelectedLevelLabel();
      container.innerHTML = '<h4 style="margin-bottom:10px;">Assigned Quizzes (' + assignments.length + ') at ' + levelLabel + '</h4>';

      assignments.forEach(function(a) {
        var div = document.createElement('div');
        div.className = 'quiz-assignment-item';
        var quiz = a.quizzes || {};
        var questionCount = quiz._count ? quiz._count.questions : 0;

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
  var quizSelect = document.getElementById('quizAssignmentQuizSelect');
  var sel = getCurrentSelection();

  if (!quizSelect.value) {
    adminAPI.showToast('Please select a quiz', 'error');
    return;
  }

  if (!sel.grade_id) {
    adminAPI.showToast('Please select at least a grade position', 'error');
    return;
  }

  var data = {
    quiz_id: quizSelect.value,
    grade_id: sel.grade_id,
    subject_id: sel.subject_id || null,
    content_id: sel.content_id || null,
    subcontent_id: sel.subcontent_id || null
  };

  adminAPI.assignQuizToSubcontent(data)
    .then(function() {
      adminAPI.showToast('Quiz assigned successfully at ' + getSelectedLevelLabel(), 'success');
      loadAssignedQuizzes();
    })
    .catch(function(err) {
      adminAPI.showToast(err.message || 'Failed to assign quiz', 'error');
    });
}

function removeAssignment(assignmentId) {
  if (!confirm('Remove this quiz assignment?')) return;

  adminAPI.removeQuizAssignment(assignmentId)
    .then(function() {
      adminAPI.showToast('Quiz assignment removed', 'success');
      loadAssignedQuizzes();
    })
    .catch(function(err) {
      adminAPI.showToast(err.message || 'Failed to remove assignment', 'error');
    });
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}