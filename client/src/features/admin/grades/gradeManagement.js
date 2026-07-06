'use strict';

var api = window.adminAPI;

function initGradeManagement() {
  loadGrades();

  document.getElementById('addGradeBtn').addEventListener('click', function() {
    showGradeModal(null);
  });
}

function loadGrades() {
  var loadingEl = document.getElementById('gradesLoading');
  var tbody = document.getElementById('gradesTableBody');

  loadingEl.textContent = 'Loading...';
  loadingEl.style.display = 'block';

  api.getGrades().then(function(grades) {
    loadingEl.style.display = 'none';
    if (!grades || grades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No grades found</td></tr>';
      return;
    }
    tbody.innerHTML = grades.map(function(g) {
      return '<tr>' +
        '<td>' + escapeHtml(g.name) + '</td>' +
        '<td>' + g.sort_order + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn-edit" onclick="window.editGrade(\'' + g.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="window.deleteGrade(\'' + g.id + '\')">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }).catch(function(err) {
    loadingEl.textContent = 'Error loading grades';
    api.showToast(err.message, 'error');
  });
}

function showGradeModal(grade) {
  var isEdit = !!grade;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Grade' : 'Add Grade';
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group">' +
      '<label>Grade Name</label>' +
      '<input type="text" id="formGradeName" class="form-input" value="' + (grade ? escapeHtml(grade.name) : '') + '" placeholder="e.g. Grade 1">' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Sort Order</label>' +
      '<input type="number" id="formGradeOrder" class="form-input" value="' + (grade ? grade.sort_order : '') + '" placeholder="e.g. 1">' +
    '</div>';

  document.getElementById('modalOverlay').style.display = 'flex';

  document.getElementById('modalSave').onclick = function() {
    var name = document.getElementById('formGradeName').value.trim();
    var sortOrder = parseInt(document.getElementById('formGradeOrder').value);

    if (!name || isNaN(sortOrder)) {
      api.showToast('Please fill all fields', 'error');
      return;
    }

    var promise = isEdit
      ? api.updateGrade(grade.id, { name: name, sort_order: sortOrder })
      : api.createGrade({ name: name, sort_order: sortOrder });

    promise.then(function() {
      closeModal();
      api.showToast(isEdit ? 'Grade updated' : 'Grade created', 'success');
      loadGrades();
    }).catch(function(err) {
      api.showToast(err.message, 'error');
    });
  };
}

window.editGrade = function(id) {
  api.getGrades().then(function(grades) {
    var grade = grades.find(function(g) { return g.id === id; });
    if (grade) showGradeModal(grade);
  });
};

window.deleteGrade = function(id) {
  if (!confirm('Are you sure you want to delete this grade?')) return;
  api.deleteGrade(id).then(function() {
    api.showToast('Grade deleted', 'success');
    loadGrades();
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

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

export { initGradeManagement, loadGrades };