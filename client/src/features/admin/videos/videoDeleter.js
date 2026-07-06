'use strict';

import './videoAdmin.css';

var api = window.adminAPI;
var deleterInitialized = false;

export function initVideoDeleter() {
  if (deleterInitialized) return;
  deleterInitialized = true;

  loadGradeFilter();
  loadChannelFilter();

  document.getElementById('deleteGradeSelect').addEventListener('change', handleDeleteGradeChange);
  document.getElementById('deleteSubjectSelect').addEventListener('change', handleDeleteSubjectChange);
  document.getElementById('deleteContentSelect').addEventListener('change', handleDeleteContentChange);
  document.getElementById('deleteByPositionBtn').addEventListener('click', handleDeleteByPosition);
  document.getElementById('deleteByChannelBtn').addEventListener('click', handleDeleteByChannel);
}

function loadGradeFilter() {
  var select = document.getElementById('deleteGradeSelect');
  if (!select) return;

  api.getGrades().then(function(grades) {
    select.innerHTML = '<option value="">-- All Grades --</option>';
    grades.forEach(function(g) {
      var opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      select.appendChild(opt);
    });
  }).catch(function(err) {
    console.error('Failed to load grades:', err);
  });
}

function loadChannelFilter() {
  var select = document.getElementById('deleteChannelSelect');
  if (!select) return;

  api.getChannels().then(function(channels) {
    select.innerHTML = '<option value="">-- Select Channel --</option>';
    channels.forEach(function(ch) {
      var opt = document.createElement('option');
      opt.value = ch.id;
      var typeBadge = ch.type === 'advert' ? ' [ADVERT]' : ' [CURRICULAR]';
      opt.textContent = ch.name + typeBadge;
      select.appendChild(opt);
    });
  }).catch(function(err) {
    console.error('Failed to load channels:', err);
  });
}

function handleDeleteGradeChange() {
  var gradeId = this.value;
  var subjectSelect = document.getElementById('deleteSubjectSelect');
  var contentSelect = document.getElementById('deleteContentSelect');
  var subcontentSelect = document.getElementById('deleteSubcontentSelect');

  subjectSelect.innerHTML = '<option value="">-- All Subjects --</option>';
  subjectSelect.disabled = !gradeId;
  contentSelect.innerHTML = '<option value="">-- All Contents --</option>';
  contentSelect.disabled = true;
  subcontentSelect.innerHTML = '<option value="">-- All Subcontents --</option>';
  subcontentSelect.disabled = true;

  if (!gradeId) return;

  api.getSubjectsByGrade(gradeId).then(function(subjects) {
    subjects.forEach(function(s) {
      var opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      subjectSelect.appendChild(opt);
    });
  }).catch(function(err) {
    console.error('Failed to load subjects:', err);
  });
}

function handleDeleteSubjectChange() {
  var subjectId = this.value;
  var contentSelect = document.getElementById('deleteContentSelect');
  var subcontentSelect = document.getElementById('deleteSubcontentSelect');

  contentSelect.innerHTML = '<option value="">-- All Contents --</option>';
  contentSelect.disabled = !subjectId;
  subcontentSelect.innerHTML = '<option value="">-- All Subcontents --</option>';
  subcontentSelect.disabled = true;

  if (!subjectId) return;

  api.getContentsBySubject(subjectId).then(function(contents) {
    contents.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      contentSelect.appendChild(opt);
    });
  }).catch(function(err) {
    console.error('Failed to load contents:', err);
  });
}

function handleDeleteContentChange() {
  var contentId = this.value;
  var subcontentSelect = document.getElementById('deleteSubcontentSelect');

  subcontentSelect.innerHTML = '<option value="">-- All Subcontents --</option>';
  subcontentSelect.disabled = !contentId;

  if (!contentId) return;

  api.getSubcontentsByContent(contentId).then(function(subcontents) {
    subcontents.forEach(function(sc) {
      var opt = document.createElement('option');
      opt.value = sc.id;
      opt.textContent = sc.name;
      subcontentSelect.appendChild(opt);
    });
  }).catch(function(err) {
    console.error('Failed to load subcontents:', err);
  });
}

function handleDeleteByPosition() {
  var gradeId = document.getElementById('deleteGradeSelect').value;
  var subjectId = document.getElementById('deleteSubjectSelect').value;
  var contentId = document.getElementById('deleteContentSelect').value;
  var subcontentId = document.getElementById('deleteSubcontentSelect').value;

  if (!gradeId && !subjectId && !contentId && !subcontentId) {
    api.showToast('Please select at least one filter level', 'error');
    return;
  }

  var levelLabel = buildLevelLabel(gradeId, subjectId, contentId, subcontentId);

  showConfirmDialog(
    'Delete Videos by Position',
    'Are you sure you want to delete all videos assigned to <strong>' + escapeHtml(levelLabel) + '</strong>? This will also remove any orphaned videos. This action cannot be undone.',
    function() {
      executeDeleteByPosition(gradeId, subjectId, contentId, subcontentId);
    }
  );
}

function handleDeleteByChannel() {
  var channelId = document.getElementById('deleteChannelSelect').value;

  if (!channelId) {
    api.showToast('Please select a channel', 'error');
    return;
  }

  showConfirmDialog(
    'Delete Videos by Channel',
    'Are you sure you want to delete ALL videos from this channel? This will remove all assignments for this channel\'s videos and delete any orphaned video records. This action cannot be undone.',
    function() {
      executeDeleteByChannel(channelId);
    }
  );
}

function executeDeleteByPosition(gradeId, subjectId, contentId, subcontentId) {
  var btn = document.getElementById('deleteByPositionBtn');
  var resultsEl = document.getElementById('deleteResults');

  btn.disabled = true;
  btn.textContent = 'Deleting...';
  resultsEl.classList.remove('show', 'success');
  resultsEl.style.display = 'none';

  var BASE_URL = (function() {
    var isProduction = (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost');
    return isProduction ? 'https://api.abrhote.com/api/v1/admin' : 'http://127.0.0.1:5001/api/v1/admin';
  })();

  var token = localStorage.getItem('accessToken');

  fetch(BASE_URL + '/videos/bulk', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    },
    body: JSON.stringify({
      grade_id: gradeId || null,
      subject_id: subjectId || null,
      content_id: contentId || null,
      subcontent_id: subcontentId || null
    })
  })
    .then(function(response) {
      if (!response.ok) {
        return response.json().then(function(err) {
          throw new Error(err.error || 'Failed to delete videos');
        });
      }
      return response.json();
    })
    .then(function(result) {
      resultsEl.className = 'delete-results show success';
      resultsEl.style.display = 'block';
      resultsEl.innerHTML =
        '<h4>✅ Deletion Complete</h4>' +
        '<div class="stats-summary">' +
          '<div class="stat-item">' +
            '<span class="stat-number">' + result.deletedAssignments + '</span>' +
            '<span class="stat-label">Assignments Removed</span>' +
          '</div>' +
          '<div class="stat-item">' +
            '<span class="stat-number">' + result.deletedVideos + '</span>' +
            '<span class="stat-label">Videos Deleted</span>' +
          '</div>' +
        '</div>';
      api.showToast('Videos deleted successfully', 'success');
    })
    .catch(function(err) {
      resultsEl.className = 'delete-results show';
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = '<h4>❌ Error</h4><p>' + escapeHtml(err.message) + '</p>';
      api.showToast(err.message, 'error');
    })
    .finally(function() {
      btn.disabled = false;
      btn.textContent = '🗑️ Delete Videos by Position';
    });
}

function executeDeleteByChannel(channelId) {
  var btn = document.getElementById('deleteByChannelBtn');
  var resultsEl = document.getElementById('deleteResults');

  btn.disabled = true;
  btn.textContent = 'Deleting...';
  resultsEl.classList.remove('show', 'success');
  resultsEl.style.display = 'none';

  var BASE_URL = (function() {
    var isProduction = (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost');
    return isProduction ? 'https://api.abrhote.com/api/v1/admin' : 'http://127.0.0.1:5001/api/v1/admin';
  })();

  var token = localStorage.getItem('accessToken');

  fetch(BASE_URL + '/videos/bulk', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    },
    body: JSON.stringify({
      channel_id: channelId
    })
  })
    .then(function(response) {
      if (!response.ok) {
        return response.json().then(function(err) {
          throw new Error(err.error || 'Failed to delete videos');
        });
      }
      return response.json();
    })
    .then(function(result) {
      resultsEl.className = 'delete-results show success';
      resultsEl.style.display = 'block';
      resultsEl.innerHTML =
        '<h4>✅ Channel Videos Deleted</h4>' +
        '<div class="stats-summary">' +
          '<div class="stat-item">' +
            '<span class="stat-number">' + result.deletedAssignments + '</span>' +
            '<span class="stat-label">Assignments Removed</span>' +
          '</div>' +
          '<div class="stat-item">' +
            '<span class="stat-number">' + result.deletedVideos + '</span>' +
            '<span class="stat-label">Videos Deleted</span>' +
          '</div>' +
        '</div>';
      api.showToast('Channel videos deleted successfully', 'success');
    })
    .catch(function(err) {
      resultsEl.className = 'delete-results show';
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = '<h4>❌ Error</h4><p>' + escapeHtml(err.message) + '</p>';
      api.showToast(err.message, 'error');
    })
    .finally(function() {
      btn.disabled = false;
      btn.textContent = '🗑️ Delete All Videos from Channel';
    });
}

function buildLevelLabel(gradeId, subjectId, contentId, subcontentId) {
  var parts = [];
  var gradeSelect = document.getElementById('deleteGradeSelect');
  var subjectSelect = document.getElementById('deleteSubjectSelect');
  var contentSelect = document.getElementById('deleteContentSelect');
  var subcontentSelect = document.getElementById('deleteSubcontentSelect');

  if (subcontentId && subcontentSelect.selectedIndex >= 0) {
    parts.push('Subcontent: ' + subcontentSelect.options[subcontentSelect.selectedIndex].text);
  } else if (contentId && contentSelect.selectedIndex >= 0) {
    parts.push('Content: ' + contentSelect.options[contentSelect.selectedIndex].text);
  } else if (subjectId && subjectSelect.selectedIndex >= 0) {
    parts.push('Subject: ' + subjectSelect.options[subjectSelect.selectedIndex].text);
  } else if (gradeId && gradeSelect.selectedIndex >= 0) {
    parts.push('Grade: ' + gradeSelect.options[gradeSelect.selectedIndex].text);
  }

  return parts.join(' > ') || 'Selected Position';
}

function showConfirmDialog(title, message, onConfirm) {
  var overlay = document.getElementById('confirmOverlay');
  if (!overlay) return;

  overlay.querySelector('.confirm-title').textContent = title;
  overlay.querySelector('.confirm-message').innerHTML = message;
  overlay.classList.add('show');

  var confirmBtn = overlay.querySelector('.confirm-yes');
  var cancelBtn = overlay.querySelector('.confirm-no');

  // Remove old listeners by cloning
  var newConfirm = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
  var newCancel = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  newConfirm.addEventListener('click', function() {
    overlay.classList.remove('show');
    if (onConfirm) onConfirm();
  });

  newCancel.addEventListener('click', function() {
    overlay.classList.remove('show');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}