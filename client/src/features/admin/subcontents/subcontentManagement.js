'use strict';

var api = window.adminAPI;
var subjectsCache = {};
var contentsCache = {};

function initSubcontentManagement() {
  document.getElementById('addSubcontentBtn').addEventListener('click', function() {
    var contentId = document.getElementById('subcontentContentFilter').value;
    if (!contentId) {
      api.showToast('Please select grade, subject, and content first', 'error');
      return;
    }
    showSubcontentModal(null, contentId);
  });

  document.getElementById('subcontentGradeFilter').addEventListener('change', function() {
    var gradeId = this.value;
    var subjectSelect = document.getElementById('subcontentSubjectFilter');
    var contentSelect = document.getElementById('subcontentContentFilter');
    subjectSelect.innerHTML = '<option value="">-- Select Subject First --</option>';
    subjectSelect.disabled = true;
    contentSelect.innerHTML = '<option value="">-- Select Content First --</option>';
    contentSelect.disabled = true;
    document.getElementById('subcontentsTableBody').innerHTML = '';
    document.getElementById('subcontentsLoading').textContent = 'Select grade, subject, and content to view subcontents';
    document.getElementById('subcontentsLoading').style.display = 'block';

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

  document.getElementById('subcontentSubjectFilter').addEventListener('change', function() {
    var subjectId = this.value;
    var contentSelect = document.getElementById('subcontentContentFilter');
    contentSelect.innerHTML = '<option value="">-- Select Content First --</option>';
    contentSelect.disabled = true;
    document.getElementById('subcontentsTableBody').innerHTML = '';
    document.getElementById('subcontentsLoading').textContent = 'Select a content to view subcontents';
    document.getElementById('subcontentsLoading').style.display = 'block';

    if (!subjectId) return;

    api.getContentsBySubject(subjectId).then(function(contents) {
      contentsCache[subjectId] = contents;
      contentSelect.innerHTML = '<option value="">-- Select Content --</option>' +
        contents.map(function(c) { return '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>'; }).join('');
      contentSelect.disabled = false;
    }).catch(function(err) {
      api.showToast(err.message, 'error');
    });
  });

  document.getElementById('subcontentContentFilter').addEventListener('change', function() {
    loadSubcontents(this.value);
  });
}

function loadSubcontents(contentId) {
  var loadingEl = document.getElementById('subcontentsLoading');
  var tbody = document.getElementById('subcontentsTableBody');

  if (!contentId) {
    loadingEl.textContent = 'Select a content to view subcontents';
    loadingEl.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }

  loadingEl.textContent = 'Loading...';
  loadingEl.style.display = 'block';

  api.getSubcontentsByContent(contentId).then(function(subcontents) {
    loadingEl.style.display = 'none';
    if (!subcontents || subcontents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No subcontents found</td></tr>';
      return;
    }

    var contentName = '';
    var subjectId = document.getElementById('subcontentSubjectFilter').value;
    var conts = contentsCache[subjectId] || [];
    var cont = conts.find(function(c) { return c.id === contentId; });
    if (cont) contentName = cont.name;

    tbody.innerHTML = subcontents.map(function(sc) {
      return '<tr>' +
        '<td>' + escapeHtml(sc.name) + '</td>' +
        '<td>' + escapeHtml(contentName) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn-edit" onclick="window.editSubcontent(\'' + sc.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="window.deleteSubcontent(\'' + sc.id + '\')">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }).catch(function(err) {
    loadingEl.textContent = 'Error loading subcontents';
    api.showToast(err.message, 'error');
  });
}

function showSubcontentModal(subcontent, contentId) {
  var isEdit = !!subcontent;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Subcontent' : 'Add Subcontent';
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group">' +
      '<label>Subcontent Name</label>' +
      '<input type="text" id="formSubcontentName" class="form-input" value="' + (subcontent ? escapeHtml(subcontent.name) : '') + '" placeholder="e.g. Lesson 1: Addition">' +
    '</div>';

  document.getElementById('modalOverlay').style.display = 'flex';

  document.getElementById('modalSave').onclick = function() {
    var name = document.getElementById('formSubcontentName').value.trim();
    if (!name) {
      api.showToast('Please enter a subcontent name', 'error');
      return;
    }

    var promise = isEdit
      ? api.updateSubcontent(subcontent.id, { name: name })
      : api.createSubcontent({ content_id: contentId, name: name });

    promise.then(function() {
      closeModal();
      api.showToast(isEdit ? 'Subcontent updated' : 'Subcontent created', 'success');
      loadSubcontents(document.getElementById('subcontentContentFilter').value);
    }).catch(function(err) {
      api.showToast(err.message, 'error');
    });
  };
}

window.editSubcontent = function(id) {
  var contentId = document.getElementById('subcontentContentFilter').value;
  api.getSubcontentsByContent(contentId).then(function(subcontents) {
    var sc = subcontents.find(function(s) { return s.id === id; });
    if (sc) showSubcontentModal(sc, contentId);
  });
};

window.deleteSubcontent = function(id) {
  if (!confirm('Are you sure you want to delete this subcontent?')) return;
  api.deleteSubcontent(id).then(function() {
    api.showToast('Subcontent deleted', 'success');
    loadSubcontents(document.getElementById('subcontentContentFilter').value);
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

export { initSubcontentManagement };