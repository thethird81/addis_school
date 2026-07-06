'use strict';

var api = window.adminAPI;
var gradesCache = [];

function initSubjectManagement() {
  loadGradeFilter();
  document.getElementById('addSubjectBtn').addEventListener('click', function() {
    var gradeId = document.getElementById('subjectGradeFilter').value;
    if (!gradeId) {
      api.showToast('Please select a grade first', 'error');
      return;
    }
    showSubjectModal(null, gradeId);
  });
  document.getElementById('subjectGradeFilter').addEventListener('change', function() {
    loadSubjects(this.value);
  });
}

function loadGradeFilter() {
  api.getGrades().then(function(grades) {
    gradesCache = grades;
    var selects = ['subjectGradeFilter', 'contentGradeFilter', 'subcontentGradeFilter', 'assignmentGradeFilter'];
    selects.forEach(function(id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      var currentVal = sel.value;
      sel.innerHTML = '<option value="">-- Select a Grade --</option>' +
        grades.map(function(g) { return '<option value="' + g.id + '">' + escapeHtml(g.name) + '</option>'; }).join('');
      if (currentVal) sel.value = currentVal;
    });
  }).catch(function(err) {
    api.showToast(err.message, 'error');
  });
}

function loadSubjects(gradeId) {
  var loadingEl = document.getElementById('subjectsLoading');
  var tbody = document.getElementById('subjectsTableBody');

  if (!gradeId) {
    loadingEl.textContent = 'Select a grade to view subjects';
    loadingEl.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }

  loadingEl.textContent = 'Loading...';
  loadingEl.style.display = 'block';

  api.getSubjectsByGrade(gradeId).then(function(subjects) {
    loadingEl.style.display = 'none';
    if (!subjects || subjects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No subjects found</td></tr>';
      return;
    }
    var gradeName = '';
    var g = gradesCache.find(function(gr) { return gr.id === gradeId; });
    if (g) gradeName = g.name;

    tbody.innerHTML = subjects.map(function(s) {
      return '<tr>' +
        '<td>' + escapeHtml(s.name) + '</td>' +
        '<td>' + escapeHtml(gradeName) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn-edit" onclick="window.editSubject(\'' + s.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="window.deleteSubject(\'' + s.id + '\')">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }).catch(function(err) {
    loadingEl.textContent = 'Error loading subjects';
    api.showToast(err.message, 'error');
  });
}

function showSubjectModal(subject, gradeId) {
  var isEdit = !!subject;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Subject' : 'Add Subject';
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group">' +
      '<label>Subject Name</label>' +
      '<input type="text" id="formSubjectName" class="form-input" value="' + (subject ? escapeHtml(subject.name) : '') + '" placeholder="e.g. Mathematics">' +
    '</div>';

  document.getElementById('modalOverlay').style.display = 'flex';

  document.getElementById('modalSave').onclick = function() {
    var name = document.getElementById('formSubjectName').value.trim();
    if (!name) {
      api.showToast('Please enter a subject name', 'error');
      return;
    }

    var promise = isEdit
      ? api.updateSubject(subject.id, { name: name })
      : api.createSubject({ grade_id: gradeId, name: name });

    promise.then(function() {
      closeModal();
      api.showToast(isEdit ? 'Subject updated' : 'Subject created', 'success');
      loadSubjects(document.getElementById('subjectGradeFilter').value);
    }).catch(function(err) {
      api.showToast(err.message, 'error');
    });
  };
}

window.editSubject = function(id) {
  var gradeId = document.getElementById('subjectGradeFilter').value;
  api.getSubjectsByGrade(gradeId).then(function(subjects) {
    var subject = subjects.find(function(s) { return s.id === id; });
    if (subject) showSubjectModal(subject, gradeId);
  });
};

window.deleteSubject = function(id) {
  if (!confirm('Are you sure you want to delete this subject?')) return;
  api.deleteSubject(id).then(function() {
    api.showToast('Subject deleted', 'success');
    loadSubjects(document.getElementById('subjectGradeFilter').value);
  }).catch(function(err) {
    api.showToast(err.message, 'error');
  });
};

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

export { initSubjectManagement, loadGradeFilter };