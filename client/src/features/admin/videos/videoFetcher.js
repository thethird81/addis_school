'use strict';

import './videoAdmin.css';

var api = window.adminAPI;
var fetcherInitialized = false;

// Curricular state
var curricularState = {
  gradeId: null,
  selectedSubcontent: null, // { id, name, subjectId, subjectName, contentId, contentName }
};

export function initVideoFetcher() {
  if (fetcherInitialized) return;
  fetcherInitialized = true;

  // Advert form
  loadAdvertGradeFilter();
  document.getElementById('advertGradeSelect').addEventListener('change', handleAdvertGradeChange);
  document.getElementById('advertSubjectSelect').addEventListener('change', handleAdvertSubjectChange);
  document.getElementById('advertContentSelect').addEventListener('change', handleAdvertContentChange);
  document.getElementById('advertFetchBtn').addEventListener('click', handleAdvertFetchVideos);

  // Curricular form
  document.getElementById('curricularGradeSelect').addEventListener('change', handleCurricularGradeChange);
  document.getElementById('curricularFetchBtn').addEventListener('click', handleCurricularFetchVideos);
}

// ==================== ADVERT FORM ====================

function loadChannelsForGrade(gradeId) {
  var select = document.getElementById('advertChannelSelect');
  if (!select) return;

  select.innerHTML = '<option value="">Loading channels...</option>';
  select.disabled = true;

  if (!gradeId) {
    select.innerHTML = '<option value="">-- Select a Grade First --</option>';
    select.disabled = true;
    return;
  }

  api.getGradeChannels(gradeId).then(function(channels) {
    if (!channels || channels.length === 0) {
      select.innerHTML = '<option value="">No channels assigned to this grade. Assign channels in the Assignments tab.</option>';
      select.disabled = true;
      return;
    }
    select.innerHTML = '<option value="">-- Select a Channel --</option>';
    channels.forEach(function(ch) {
      var opt = document.createElement('option');
      opt.value = ch.id;
      var typeLabel = ch.type === 'advert' ? ' [ADVERT]' : ' [CURRICULAR]';
      opt.textContent = ch.name + typeLabel + ' (' + ch.id + ')';
      select.appendChild(opt);
    });
    select.disabled = false;
  }).catch(function(err) {
    console.error('Failed to load channels for grade:', err);
    select.innerHTML = '<option value="">Error loading channels</option>';
    select.disabled = true;
  });
}

function loadAdvertGradeFilter() {
  var select = document.getElementById('advertGradeSelect');
  if (!select) return;

  api.getGrades().then(function(grades) {
    select.innerHTML = '<option value="">-- Select Grade --</option>';
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

function handleAdvertGradeChange() {
  var gradeId = this.value;
  var subjectSelect = document.getElementById('advertSubjectSelect');
  var contentSelect = document.getElementById('advertContentSelect');
  var subcontentSelect = document.getElementById('advertSubcontentSelect');

  subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
  subjectSelect.disabled = !gradeId;
  contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
  contentSelect.disabled = true;
  subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
  subcontentSelect.disabled = true;

  loadChannelsForGrade(gradeId);

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

function handleAdvertSubjectChange() {
  var subjectId = this.value;
  var contentSelect = document.getElementById('advertContentSelect');
  var subcontentSelect = document.getElementById('advertSubcontentSelect');

  contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
  contentSelect.disabled = !subjectId;
  subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
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

function handleAdvertContentChange() {
  var contentId = this.value;
  var subcontentSelect = document.getElementById('advertSubcontentSelect');

  subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
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

function handleAdvertFetchVideos() {
  var channelId = document.getElementById('advertChannelSelect').value;
  var gradeId = document.getElementById('advertGradeSelect').value;
  var subjectId = document.getElementById('advertSubjectSelect').value;
  var contentId = document.getElementById('advertContentSelect').value;
  var subcontentId = document.getElementById('advertSubcontentSelect').value;
  var resultsEl = document.getElementById('advertFetchResults');

  if (!channelId) {
    api.showToast('Please select an advert channel', 'error');
    return;
  }
  if (!gradeId) {
    api.showToast('Please select at least a grade', 'error');
    return;
  }

  var btn = document.getElementById('advertFetchBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'Fetching...';
  resultsEl.classList.remove('show', 'error');
  resultsEl.style.display = 'none';

  var data = {
    channelId: channelId,
    grade_id: gradeId,
    subject_id: subjectId || null,
    content_id: contentId || null,
    subcontent_id: subcontentId || null,
    type: 'advert',
    query: null,
  };

  doFetch(data, resultsEl, btn);
}

// ==================== CURRICULAR FORM ====================

function handleCurricularGradeChange() {
  var gradeId = this.value;
  curricularState.gradeId = gradeId;
  curricularState.selectedSubcontent = null;

  var treeEl = document.getElementById('curricularTree');
  var actionsEl = document.getElementById('curricularFetchActions');

  actionsEl.style.display = 'none';

  if (!gradeId) {
    treeEl.innerHTML = '<p class="hint" id="curricularTreeHint">Select a grade to see subjects</p>';
    return;
  }

  treeEl.innerHTML = '<p class="hint">Loading subjects...</p>';

  api.getSubjectsByGrade(gradeId).then(function(subjects) {
    if (!subjects || subjects.length === 0) {
      treeEl.innerHTML = '<p class="hint">No subjects found for this grade</p>';
      return;
    }

    var html = '<div class="tree-root">';
    subjects.forEach(function(s) {
      html += buildSubjectNode(s);
    });
    html += '</div>';
    treeEl.innerHTML = html;

    // Attach click handlers for subject toggles
    subjects.forEach(function(s) {
      var toggle = document.getElementById('subject-toggle-' + s.id);
      if (toggle) {
        toggle.addEventListener('click', function() {
          toggleSubject(s.id, s.name);
        });
      }
    });
  }).catch(function(err) {
    console.error('Failed to load subjects:', err);
    treeEl.innerHTML = '<p class="hint">Error loading subjects</p>';
  });
}

function buildSubjectNode(subject) {
  return '<div class="tree-item tree-subject">' +
    '<div class="tree-toggle" id="subject-toggle-' + subject.id + '" data-subject-id="' + subject.id + '">' +
      '<span class="tree-arrow">&#9654;</span>' +
      '<span class="tree-icon">&#x1F4DA;</span>' +
      '<span class="tree-label">' + escapeHtml(subject.name) + '</span>' +
    '</div>' +
    '<div class="tree-children" id="subject-children-' + subject.id + '" style="display:none;"></div>' +
  '</div>';
}

function buildContentNode(content) {
  return '<div class="tree-item tree-content">' +
    '<div class="tree-toggle" id="content-toggle-' + content.id + '" data-content-id="' + content.id + '">' +
      '<span class="tree-arrow">&#9654;</span>' +
      '<span class="tree-icon">&#x1F4C4;</span>' +
      '<span class="tree-label">' + escapeHtml(content.name) + '</span>' +
    '</div>' +
    '<div class="tree-children" id="content-children-' + content.id + '" style="display:none;"></div>' +
  '</div>';
}

function buildSubcontentNode(subcontent, subjectId, subjectName, contentId, contentName) {
  return '<div class="tree-item tree-subcontent">' +
    '<div class="tree-toggle tree-selectable" id="subcontent-select-' + subcontent.id + '" ' +
      'data-subcontent-id="' + subcontent.id + '" ' +
      'data-subcontent-name="' + escapeHtml(subcontent.name) + '" ' +
      'data-subject-id="' + subjectId + '" ' +
      'data-subject-name="' + escapeHtml(subjectName) + '" ' +
      'data-content-id="' + contentId + '" ' +
      'data-content-name="' + escapeHtml(contentName) + '">' +
      '<span class="tree-icon">&#x1F4DD;</span>' +
      '<span class="tree-label">' + escapeHtml(subcontent.name) + '</span>' +
    '</div>' +
  '</div>';
}

function toggleSubject(subjectId, subjectName) {
  var childrenEl = document.getElementById('subject-children-' + subjectId);
  var arrowEl = document.querySelector('#subject-toggle-' + subjectId + ' .tree-arrow');

  if (!childrenEl) return;

  if (childrenEl.style.display === 'block') {
    childrenEl.style.display = 'none';
    if (arrowEl) arrowEl.innerHTML = '&#9654;';
    return;
  }

  // Close other open subjects
  document.querySelectorAll('.tree-children').forEach(function(el) {
    el.style.display = 'none';
  });
  document.querySelectorAll('.tree-arrow').forEach(function(el) {
    el.innerHTML = '&#9654;';
  });

  childrenEl.style.display = 'block';
  if (arrowEl) arrowEl.innerHTML = '&#9660;';

  // If already loaded, just show
  if (childrenEl.dataset.loaded === 'true') return;
  childrenEl.dataset.loaded = 'true';

  childrenEl.innerHTML = '<p class="hint" style="padding:8px 0 8px 24px;">Loading contents...</p>';

  api.getContentsBySubject(subjectId).then(function(contents) {
    if (!contents || contents.length === 0) {
      childrenEl.innerHTML = '<p class="hint" style="padding:8px 0 8px 24px;">No contents found</p>';
      return;
    }

    var html = '';
    contents.forEach(function(c) {
      html += buildContentNode(c);
    });
    childrenEl.innerHTML = html;

    // Attach click handlers for content toggles
    contents.forEach(function(c) {
      var toggle = document.getElementById('content-toggle-' + c.id);
      if (toggle) {
        toggle.addEventListener('click', function() {
          toggleContent(c.id, c.name, subjectId, subjectName);
        });
      }
    });
  }).catch(function(err) {
    console.error('Failed to load contents:', err);
    childrenEl.innerHTML = '<p class="hint" style="padding:8px 0 8px 24px;">Error loading contents</p>';
  });
}

function toggleContent(contentId, contentName, subjectId, subjectName) {
  var childrenEl = document.getElementById('content-children-' + contentId);
  var arrowEl = document.querySelector('#content-toggle-' + contentId + ' .tree-arrow');

  if (!childrenEl) return;

  if (childrenEl.style.display === 'block') {
    childrenEl.style.display = 'none';
    if (arrowEl) arrowEl.innerHTML = '&#9654;';
    return;
  }

  // Close other open contents within same subject
  var parentChildren = childrenEl.parentElement.parentElement;
  parentChildren.querySelectorAll('.tree-children').forEach(function(el) {
    if (el.id !== childrenEl.id) {
      el.style.display = 'none';
      var parentArrow = el.parentElement.querySelector('.tree-arrow');
      if (parentArrow) parentArrow.innerHTML = '&#9654;';
    }
  });

  childrenEl.style.display = 'block';
  if (arrowEl) arrowEl.innerHTML = '&#9660;';

  // If already loaded, just show
  if (childrenEl.dataset.loaded === 'true') return;
  childrenEl.dataset.loaded = 'true';

  childrenEl.innerHTML = '<p class="hint" style="padding:8px 0 8px 24px;">Loading subcontents...</p>';

  api.getSubcontentsByContent(contentId).then(function(subcontents) {
    if (!subcontents || subcontents.length === 0) {
      childrenEl.innerHTML = '<p class="hint" style="padding:8px 0 8px 24px;">No subcontents found</p>';
      return;
    }

    var html = '';
    subcontents.forEach(function(sc) {
      html += buildSubcontentNode(sc, subjectId, subjectName, contentId, contentName);
    });
    childrenEl.innerHTML = html;

    // Attach click handlers for subcontent selection
    subcontents.forEach(function(sc) {
      var selectable = document.getElementById('subcontent-select-' + sc.id);
      if (selectable) {
        selectable.addEventListener('click', function() {
          selectSubcontent(sc.id, sc.name, subjectId, subjectName, contentId, contentName);
        });
      }
    });
  }).catch(function(err) {
    console.error('Failed to load subcontents:', err);
    childrenEl.innerHTML = '<p class="hint" style="padding:8px 0 8px 24px;">Error loading subcontents</p>';
  });
}

function selectSubcontent(subcontentId, subcontentName, subjectId, subjectName, contentId, contentName) {
  // Deselect all
  document.querySelectorAll('.tree-selectable').forEach(function(el) {
    el.classList.remove('selected');
  });

  // Select this one
  var el = document.getElementById('subcontent-select-' + subcontentId);
  if (el) {
    el.classList.add('selected');
  }

  curricularState.selectedSubcontent = {
    id: subcontentId,
    name: subcontentName,
    subjectId: subjectId,
    subjectName: subjectName,
    contentId: contentId,
    contentName: contentName,
  };

  // Show fetch button
  var actionsEl = document.getElementById('curricularFetchActions');
  actionsEl.style.display = 'flex';
}

function handleCurricularFetchVideos() {
  var gradeId = curricularState.gradeId;
  var selected = curricularState.selectedSubcontent;

  if (!gradeId) {
    api.showToast('Please select a grade', 'error');
    return;
  }
  if (!selected) {
    api.showToast('Please select a subcontent', 'error');
    return;
  }

  var resultsEl = document.getElementById('curricularFetchResults');
  var btn = document.getElementById('curricularFetchBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'Fetching...';
  resultsEl.classList.remove('show', 'error');
  resultsEl.style.display = 'none';

  var data = {
    channelId: null,
    grade_id: gradeId,
    subject_id: selected.subjectId,
    content_id: selected.contentId,
    subcontent_id: selected.id,
    type: 'curricular',
    query: selected.name,
  };

  doFetch(data, resultsEl, btn);
}

// ==================== SHARED FETCH ====================

function doFetch(data, resultsEl, btn) {
  var BASE_URL = (function() {
    var isProduction = (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost');
    return isProduction ? 'https://api.abrhote.com/api/v1/admin/youtube' : 'http://127.0.0.1:5001/api/v1/admin/youtube';
  })();

  var token = localStorage.getItem('accessToken');

  fetch(BASE_URL + '/fetch-shorts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    },
    body: JSON.stringify(data)
  })
    .then(function(response) {
      if (!response.ok) {
        return response.json().then(function(err) {
          throw new Error(err.error || 'Failed to fetch videos');
        });
      }
      return response.json();
    })
    .then(function(result) {
      resultsEl.className = 'fetch-results show';
      resultsEl.style.display = 'block';
      resultsEl.innerHTML =
        '<h4>&#10004; Videos Fetched Successfully</h4>' +
        '<div class="stats-summary">' +
          '<div class="stat-item">' +
            '<span class="stat-number">' + result.totalFetched + '</span>' +
            '<span class="stat-label">Total Fetched</span>' +
          '</div>' +
          '<div class="stat-item">' +
            '<span class="stat-number">' + result.savedCount + '</span>' +
            '<span class="stat-label">New Videos Saved</span>' +
          '</div>' +
          '<div class="stat-item">' +
            '<span class="stat-number">' + result.assignedCount + '</span>' +
            '<span class="stat-label">Assignments Made</span>' +
          '</div>' +
        '</div>';
      api.showToast(result.message || 'Videos fetched successfully', 'success');
    })
    .catch(function(err) {
      resultsEl.className = 'fetch-results show error';
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = '<h4>&#10008; Error</h4><p>' + escapeHtml(err.message) + '</p>';
      api.showToast(err.message, 'error');
    })
    .finally(function() {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = btn.id === 'advertFetchBtn' ? '&#x1F680; Fetch & Save Videos' : '&#x1F680; Fetch Curricular Videos';
    });
}

function escapeHtml(str) {
  if (!str) return '';
  var amp = '&' + 'amp;';
  var lt = '&' + 'lt;';
  var gt = '&' + 'gt;';
  var quot = '&' + 'quot;';
  return str.replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot);
}
