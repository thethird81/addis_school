'use strict';

var api = window.adminAPI;
var subjectsCache = {};

function initContentManagement() {
  document.getElementById('addContentBtn').addEventListener('click', function() {
    var subjectId = document.getElementById('contentSubjectFilter').value;
    if (!subjectId) {
      api.showToast('Please select a grade and subject first', 'error');
      return;
    }
    showContentModal(null, subjectId);
  });

  document.getElementById('contentGradeFilter').addEventListener('change', function() {
    var gradeId = this.value;
    var subjectSelect = document.getElementById('contentSubjectFilter');
    subjectSelect.innerHTML = '<option value="">-- Select Subject First --</option>';
    subjectSelect.disabled = true;
    document.getElementById('contentsTableBody').innerHTML = '';
    document.getElementById('contentsLoading').textContent = 'Select a grade and subject to view contents';
    document.getElementById('contentsLoading').style.display = 'block';

    if (!gradeId) return;

    api.getSubjectsByGrade(gradeId).then(function(subjects) {
      subjectsCache[gradeId] = subjects;
      subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>' +
        subjects.map(function(s) { return '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>'; }).join('');
      subjectSelect.disabled = false;
    }).catch(function(err) {
      api.showToast(err.message, 'error');
    });
  });

  document.getElementById('contentSubjectFilter').addEventListener('change', function() {
    loadContents(this.value);
  });
}

function loadContents(subjectId) {
  var loadingEl = document.getElementById('contentsLoading');
  var tbody = document.getElementById('contentsTableBody');

  if (!subjectId) {
    loadingEl.textContent = 'Select a grade and subject to view contents';
    loadingEl.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }

  loadingEl.textContent = 'Loading...';
  loadingEl.style.display = 'block';

  api.getContentsBySubject(subjectId).then(function(contents) {
    loadingEl.style.display = 'none';
    if (!contents || contents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No contents found</td></tr>';
      return;
    }

    var subjectName = '';
    var gradeId = document.getElementById('contentGradeFilter').value;
    var subs = subjectsCache[gradeId] || [];
    var subj = subs.find(function(s) { return s.id === subjectId; });
    if (subj) subjectName = subj.name;

    tbody.innerHTML = contents.map(function(c) {
      return '<tr>' +
        '<td>' + escapeHtml(c.name) + '</td>' +
        '<td>' + escapeHtml(subjectName) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn-edit" onclick="window.editContent(\'' + c.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="window.deleteContent(\'' + c.id + '\')">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }).catch(function(err) {
    loadingEl.textContent = 'Error loading contents';
    api.showToast(err.message, 'error');
  });
}

function showContentModal(content, subjectId) {
  var isEdit = !!content;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Content' : 'Add Content';
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group">' +
      '<label>Content Name</label>' +
      '<input type="text" id="formContentName" class="form-input" value="' + (content ? escapeHtml(content.name) : '') + '" placeholder="e.g. Chapter 1: Numbers">' +
    '</div>';

  document.getElementById('modalOverlay').style.display = 'flex';

  document.getElementById('modalSave').onclick = function() {
    var name = document.getElementById('formContentName').value.trim();
    if (!name) {
      api.showToast('Please enter a content name', 'error');
      return;
    }

    var promise = isEdit
      ? api.updateContent(content.id, { name: name })
      : api.createContent({ subject_id: subjectId, name: name });

    promise.then(function() {
      closeModal();
      api.showToast(isEdit ? 'Content updated' : 'Content created', 'success');
      loadContents(document.getElementById('contentSubjectFilter').value);
    }).catch(function(err) {
      api.showToast(err.message, 'error');
    });
  };
}

window.editContent = function(id) {
  var subjectId = document.getElementById('contentSubjectFilter').value;
  api.getContentsBySubject(subjectId).then(function(contents) {
    var content = contents.find(function(c) { return c.id === id; });
    if (content) showContentModal(content, subjectId);
  });
};

window.deleteContent = function(id) {
  if (!confirm('Are you sure you want to delete this content?')) return;
  api.deleteContent(id).then(function() {
    api.showToast('Content deleted', 'success');
    loadContents(document.getElementById('contentSubjectFilter').value);
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

export { initContentManagement };