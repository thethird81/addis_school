'use strict';

var api = window.adminAPI;
var allChannels = [];
var fullTree = [];
var selectedType = null; // 'grade' or 'subject'
var selectedId = null;

function initAssignmentManagement() {
  loadAssignmentGradeFilter();
  loadAllChannels();

  document.getElementById('assignmentGradeFilter').addEventListener('change', function() {
    selectedType = null;
    selectedId = null;
    var gradeId = this.value || null;
    if (gradeId) {
      renderTree(gradeId);
    } else {
      document.getElementById('assignmentTree').innerHTML = '<p class="hint">Select a grade to see subjects and channels</p>';
      document.getElementById('assignmentChannelList').innerHTML = '<p class="hint">Select a grade or subject to manage channel assignments</p>';
    }
  });

  // Add Channel button listener
  document.getElementById('addAssignmentChannelBtn').addEventListener('click', function() {
    if (!selectedId) {
      api.showToast('Please select a grade or subject first', 'error');
      return;
    }
    openAddChannelModal();
  });
}

function loadAssignmentGradeFilter() {
  api.getGrades().then(function(grades) {
    var sel = document.getElementById('assignmentGradeFilter');
    sel.innerHTML = '<option value="">-- Select a Grade --</option>' +
      grades.map(function(g) { return '<option value="' + g.id + '">' + escapeHtml(g.name) + '</option>'; }).join('');
  }).catch(function(err) {
    api.showToast(err.message, 'error');
  });
}

function loadAllChannels() {
  api.getChannels().then(function(channels) {
    allChannels = channels || [];
  }).catch(function(err) {
    api.showToast(err.message, 'error');
  });
}

function renderTree(gradeId) {
  var treeEl = document.getElementById('assignmentTree');

  api.getFullTree().then(function(tree) {
    fullTree = tree;
    var grade = tree.find(function(g) { return g.id === gradeId; });
    if (!grade) {
      treeEl.innerHTML = '<p class="hint">Grade not found</p>';
      return;
    }

    var html = '<div class="tree-node">';
    // Grade-level node
    html += '<div class="tree-node-header' + (selectedType === 'grade' && selectedId === grade.id ? ' selected' : '') + '" data-type="grade" data-id="' + grade.id + '" onclick="window.selectGradeNode(\'' + grade.id + '\', this)">' +
      '<span class="tree-toggle expanded">▶</span>' +
      '<span class="tree-node-icon">📊</span>' +
      '<span class="tree-node-label">' + escapeHtml(grade.name) + '</span>';

    // Show grade-level channel count
    if (grade.channels && grade.channels.length > 0) {
      html += '<span class="channel-chip">' + grade.channels.length + ' channels</span>';
    }
    html += '</div>';

    // Subjects
    html += '<div class="tree-children expanded">';
    if (grade.subjects && grade.subjects.length > 0) {
      grade.subjects.forEach(function(subject) {
        html += '<div class="tree-node">';
        html += '<div class="tree-node-header' + (selectedType === 'subject' && selectedId === subject.id ? ' selected' : '') + '" data-type="subject" data-id="' + subject.id + '" onclick="window.selectSubjectNode(\'' + subject.id + '\', this)">' +
          '<span class="tree-toggle">▶</span>' +
          '<span class="tree-node-icon">📚</span>' +
          '<span class="tree-node-label">' + escapeHtml(subject.name) + '</span>';

        if (subject.channels && subject.channels.length > 0) {
          html += '<span class="channel-chip">' + subject.channels.length + ' channels</span>';
        }
        html += '</div>';
        html += '</div>';
      });
    } else {
      html += '<p style="padding:8px;color:#aaa;font-size:0.85rem;">No subjects</p>';
    }
    html += '</div></div>';

    treeEl.innerHTML = html;

    // If no selection yet, auto-select grade
    if (!selectedId) {
      selectGradeNode(grade.id, treeEl.querySelector('.tree-node-header[data-type="grade"]'));
    }
  }).catch(function(err) {
    api.showToast(err.message, 'error');
  });
}

window.selectGradeNode = function(gradeId, el) {
  selectedType = 'grade';
  selectedId = gradeId;

  // Update highlights
  document.querySelectorAll('#assignmentTree .tree-node-header').forEach(function(h) {
    h.classList.remove('selected');
  });
  if (el) el.classList.add('selected');

  renderAssignedChannels();
};

window.selectSubjectNode = function(subjectId, el) {
  selectedType = 'subject';
  selectedId = subjectId;

  // Update highlights
  document.querySelectorAll('#assignmentTree .tree-node-header').forEach(function(h) {
    h.classList.remove('selected');
  });
  if (el) el.classList.add('selected');

  renderAssignedChannels();
};

function renderAssignedChannels() {
  var channelListEl = document.getElementById('assignmentChannelList');

  if (!selectedId) {
    channelListEl.innerHTML = '<p class="hint">Select a grade or subject to manage channel assignments</p>';
    return;
  }

  if (allChannels.length === 0) {
    channelListEl.innerHTML = '<p class="hint">No channels available. Add channels first.</p>';
    return;
  }

  if (selectedType === 'grade') {
    loadGradeChannels(selectedId);
  } else {
    loadSubjectChannels(selectedId);
  }
}

function loadGradeChannels(gradeId) {
  var channelListEl = document.getElementById('assignmentChannelList');

  api.getGradeChannels(gradeId).then(function(assignedChannels) {
    var html = '<p style="font-weight:500;margin-bottom:12px;color:#555;">Grade-level assigned channels:</p>';
    if (!assignedChannels || assignedChannels.length === 0) {
      html += '<p class="hint">No channels assigned to this grade.</p>';
    } else {
      assignedChannels.forEach(function(ch) {
        html += renderAssignedChannelItem(ch, 'grade', gradeId);
      });
    }
    channelListEl.innerHTML = html;
  }).catch(function(err) {
    // Fallback to tree data
    var grade = fullTree.find(function(g) { return g.id === gradeId; });
    var assignedChannels = [];
    if (grade && grade.channels) {
      assignedChannels = grade.channels.map(function(ch) {
        return { id: ch.channelId || ch.id, name: ch.channelName || ch.name, thumbnail_url: ch.thumbnail_url, type: ch.type };
      });
    }
    var html = '<p style="font-weight:500;margin-bottom:12px;color:#555;">Grade-level assigned channels:</p>';
    if (assignedChannels.length === 0) {
      html += '<p class="hint">No channels assigned to this grade.</p>';
    } else {
      assignedChannels.forEach(function(ch) {
        html += renderAssignedChannelItem(ch, 'grade', gradeId);
      });
    }
    channelListEl.innerHTML = html;
  });
}

function loadSubjectChannels(subjectId) {
  var channelListEl = document.getElementById('assignmentChannelList');

  api.getSubjectChannels(subjectId).then(function(assignedChannels) {
    var html = '<p style="font-weight:500;margin-bottom:12px;color:#555;">Subject-level assigned channels:</p>';
    if (!assignedChannels || assignedChannels.length === 0) {
      html += '<p class="hint">No channels assigned to this subject.</p>';
    } else {
      assignedChannels.forEach(function(ch) {
        html += renderAssignedChannelItem(ch, 'subject', subjectId);
      });
    }
    channelListEl.innerHTML = html;
  }).catch(function(err) {
    // Fallback to tree data
    var grade = fullTree.find(function(g) { return g.subjects && g.subjects.find(function(s) { return s.id === subjectId; }); });
    var assignedChannels = [];
    if (grade) {
      var subject = grade.subjects.find(function(s) { return s.id === subjectId; });
      if (subject && subject.channels) {
        assignedChannels = subject.channels.map(function(ch) {
          return { id: ch.channelId || ch.id, name: ch.channelName || ch.name, thumbnail_url: ch.thumbnail_url, type: ch.type };
        });
      }
    }
    var html = '<p style="font-weight:500;margin-bottom:12px;color:#555;">Subject-level assigned channels:</p>';
    if (assignedChannels.length === 0) {
      html += '<p class="hint">No channels assigned to this subject.</p>';
    } else {
      assignedChannels.forEach(function(ch) {
        html += renderAssignedChannelItem(ch, 'subject', subjectId);
      });
    }
    channelListEl.innerHTML = html;
  });
}

function getThumbnailSrc(channel) {
  var thumb = channel.thumbnail_url;
  if (!thumb) return null;
  return typeof thumb === 'object' ? thumb.url : thumb;
}

function renderTypeBadge(type) {
  if (type === 'advert') {
    return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:600;text-transform:uppercase;background:#e94560;color:#fff;margin-left:6px;">ADVERT</span>';
  }
  return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:600;text-transform:uppercase;background:#6c757d;color:#fff;margin-left:6px;">CURRICULAR</span>';
}

function renderAssignedChannelItem(channel, type, id) {
  var channelName = channel.name || channel.channelName || 'Unknown';
  var channelId = channel.id || channel.channelId;
  var thumbSrc = getThumbnailSrc(channel);
  return '<div class="assigned-channel-item">' +
    '<div class="assigned-channel-info">' +
      (thumbSrc
        ? '<img src="' + escapeHtml(thumbSrc) + '" alt="' + escapeHtml(channelName) + '">'
        : '<span style="width:36px;height:36px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center;">📺</span>') +
      '<span>' + escapeHtml(channelName) + '</span>' +
      renderTypeBadge(channel.type) +
    '</div>' +
    '<button class="channel-remove-btn" onclick="window.removeChannelAssignment(\'' + type + '\', \'' + id + '\', \'' + channelId + '\')" title="Remove channel">&times;</button>' +
  '</div>';
}

window.removeChannelAssignment = function(type, id, channelId) {
  var promise = type === 'grade'
    ? api.removeChannelFromGrade(id, channelId)
    : api.removeChannelFromSubject(id, channelId);

  promise.then(function() {
    api.showToast('Channel removed successfully', 'success');
    // Refresh tree and channel list
    var gradeId = selectedType === 'grade' ? selectedId : null;
    if (!gradeId) {
      // Find the grade ID from the tree
      var grade = fullTree.find(function(g) {
        return g.subjects && g.subjects.find(function(s) { return s.id === selectedId; });
      });
      if (grade) gradeId = grade.id;
    }
    if (gradeId) {
      renderTree(gradeId);
    }
    renderAssignedChannels();
  }).catch(function(err) {
    api.showToast(err.message, 'error');
  });
};

// ============== Add Channel Modal ==============

function getChannelsAssignedToCurrentGrade() {
  // Collect all channel IDs assigned to the current grade tree (grade-level + all subjects)
  var assignedIds = new Set();
  if (!fullTree || !selectedId) return assignedIds;

  // Find the current grade in the tree
  var currentGrade;
  if (selectedType === 'grade') {
    currentGrade = fullTree.find(function(g) { return g.id === selectedId; });
  } else {
    currentGrade = fullTree.find(function(g) {
      return g.subjects && g.subjects.some(function(s) { return s.id === selectedId; });
    });
  }

  if (!currentGrade) return assignedIds;

  // Exclude grade-level channels
  if (currentGrade.channels) {
    currentGrade.channels.forEach(function(ch) {
      assignedIds.add(ch.channelId || ch.id);
    });
  }

  // Exclude channels from ALL subjects under this grade
  if (currentGrade.subjects) {
    currentGrade.subjects.forEach(function(subject) {
      if (subject.channels) {
        subject.channels.forEach(function(ch) {
          assignedIds.add(ch.channelId || ch.id);
        });
      }
    });
  }

  return assignedIds;
}

var modalFilteredChannels = [];

function openAddChannelModal() {
  var assignedIds = getChannelsAssignedToCurrentGrade();

  // Show channels that are NOT assigned to the current grade or any of its subjects
  var availableChannels = allChannels.filter(function(ch) {
    return !assignedIds.has(ch.id);
  });

  modalFilteredChannels = availableChannels;

  var modal = document.getElementById('addChannelModal');
  modal.style.display = 'flex';

  // Clear search input
  document.getElementById('channelSearchInput').value = '';

  renderChannelSelectList(availableChannels);
}

window.closeAddChannelModal = function() {
  document.getElementById('addChannelModal').style.display = 'none';
};

window.filterChannelModalList = function() {
  var searchTerm = document.getElementById('channelSearchInput').value.toLowerCase().trim();

  if (!searchTerm) {
    // Re-calculate available channels
    var assignedIds = getChannelsAssignedToCurrentGrade();
    var availableChannels = allChannels.filter(function(ch) {
      return !assignedIds.has(ch.id);
    });
    modalFilteredChannels = availableChannels;
    renderChannelSelectList(availableChannels);
    return;
  }

  var filtered = modalFilteredChannels.filter(function(ch) {
    return (ch.name || '').toLowerCase().indexOf(searchTerm) !== -1;
  });
  renderChannelSelectList(filtered);
};

function renderChannelSelectList(channels) {
  var listEl = document.getElementById('channelSelectList');

  if (!channels || channels.length === 0) {
    listEl.innerHTML = '<p class="hint" style="text-align:center;padding:20px;">No channels available to assign.</p>';
    return;
  }

  var html = '';
  channels.forEach(function(ch) {
    var thumbSrc = getThumbnailSrc(ch);
    html += '<label class="channel-select-item">' +
      '<input type="checkbox" value="' + ch.id + '" data-name="' + escapeHtml(ch.name || '') + '">' +
      (thumbSrc
        ? '<img src="' + escapeHtml(thumbSrc) + '" alt="' + escapeHtml(ch.name || '') + '">'
        : '<span style="width:32px;height:32px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center;flex-shrink:0;">📺</span>') +
      '<span>' + escapeHtml(ch.name || '') + '</span>' +
      renderTypeBadge(ch.type) +
    '</label>';
  });

  listEl.innerHTML = html;
}

window.saveChannelAssignments = function() {
  var checkboxes = document.querySelectorAll('#channelSelectList input[type="checkbox"]:checked');
  var selectedIds = [];
  checkboxes.forEach(function(cb) {
    selectedIds.push(cb.value);
  });

  if (selectedIds.length === 0) {
    api.showToast('Please select at least one channel', 'error');
    return;
  }

  // Disable button to prevent double clicks
  var saveBtn = document.getElementById('assignChannelsBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Assigning...';

  var promises = selectedIds.map(function(channelId) {
    if (selectedType === 'grade') {
      return api.assignChannelToGrade(selectedId, channelId);
    } else {
      return api.assignChannelToSubject(selectedId, channelId);
    }
  });

  Promise.all(promises).then(function() {
    api.showToast(selectedIds.length + ' channel(s) assigned successfully', 'success');
    window.closeAddChannelModal();

    // Refresh the tree and channel list
    var gradeId = selectedType === 'grade' ? selectedId : null;
    if (!gradeId) {
      var grade = fullTree.find(function(g) {
        return g.subjects && g.subjects.find(function(s) { return s.id === selectedId; });
      });
      if (grade) gradeId = grade.id;
    }
    if (gradeId) {
      renderTree(gradeId);
    }
    renderAssignedChannels();

    saveBtn.disabled = false;
    saveBtn.textContent = 'Assign Selected';
  }).catch(function(err) {
    api.showToast(err.message, 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Assign Selected';
  });
};

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function escapeHtml(str) {
  if (str == null) return '';
  if (typeof str !== 'string') str = String(str);
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

export { initAssignmentManagement, loadAllChannels };