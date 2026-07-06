'use strict';

var api = window.adminServices;

function initChannelManagement() {
  console.log('Initializing channel management...');
  
  // Add channel button handler
  var addChannelBtn = document.getElementById('addChannelBtn');
  if (addChannelBtn) {
    addChannelBtn.addEventListener('click', function() {
      showChannelModal(null);
    });
  }

  // Fetch videos button handler
  var fetchVideosBtn = document.getElementById('fetchVideosBtn');
  if (fetchVideosBtn) {
    fetchVideosBtn.addEventListener('click', function() {
      showFetchVideosModal();
    });
  }

  // View videos button handler (delegated for dynamically created buttons)
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-view-videos')) {
      var channelId = e.target.dataset.channelId;
      var channelName = e.target.dataset.channelName;
      if (channelId) {
        showViewVideosModal(channelId, channelName);
      }
    }
  });

  // Save videos button handler
  var saveVideosBtn = document.getElementById('saveVideosBtn');
  if (saveVideosBtn) {
    saveVideosBtn.addEventListener('click', function() {
      saveSelectedVideos();
    });
  }

  // Close modal button handler (delegated)
  document.addEventListener('click', function(e) {
    if (e.target.id === 'modalClose' || e.target.id === 'modalCancel' || 
        e.target.closest('#modalClose') || e.target.closest('#modalCancel')) {
      closeModal();
    }
  });

  // Click outside modal to close
  var modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
}

function showChannelModal(channel) {
  var isEdit = !!channel;
  var isAdvert = channel ? channel.type === 'advert' : false;

  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Channel' : 'Add Channel';
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group">' +
      '<label>Channel ID</label>' +
      '<input type="text" id="formChannelId" class="form-input" value="' + (channel ? escapeHtml(channel.id) : '') + '" placeholder="e.g. UC... (YouTube Channel ID)"' + (isEdit ? ' readonly' : '') + '>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Channel Name</label>' +
      '<input type="text" id="formChannelName" class="form-input" value="' + (channel ? escapeHtml(channel.name) : '') + '" placeholder="e.g. Kids Learning TV">' +
    '</div>' +
    '<div class="form-group">' +
      '<label for="formChannelType">Channel Type *</label>' +
      '<select id="formChannelType" class="form-select" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.95rem;font-family:inherit;">' +
        '<option value="">-- Select Channel Type --</option>' +
        '<option value="curricular"' + (channel && channel.type === 'curricular' ? ' selected' : '') + '>Curricular</option>' +
        '<option value="advert"' + (channel && channel.type === 'advert' ? ' selected' : '') + '>Advert</option>' +
      '</select>' +
    '</div>';

  document.getElementById('modalOverlay').style.display = 'flex';

  document.getElementById('modalSave').onclick = function() {
    var id = document.getElementById('formChannelId').value.trim();
    var name = document.getElementById('formChannelName').value.trim();
    var type = document.getElementById('formChannelType').value;

    if (!id || !name) {
      window.showToast('Please fill channel ID and name', 'error');
      return;
    }

    if (!type) {
      window.showToast('Please select a channel type', 'error');
      return;
    }

    var promise;
    if (isEdit) {
      // For edit, update channel (backend will handle thumbnail if needed)
      promise = api.updateChannel(channel.id, { name: name, type: type });
    } else {
      // For new channel, create channel (backend will fetch thumbnail using API key)
      promise = api.createChannel({ id: id, name: name, type: type });
    }

    promise.then(function() {
      closeModal();
      window.showToast(isEdit ? 'Channel updated' : 'Channel created', 'success');
       window.dispatchEvent(new CustomEvent('refreshChannels'));
    }).catch(function(err) {
      console.error('Channel creation error:', err);
      window.showToast('Error: ' + (err.message || 'Failed to create channel'), 'error');
    });
  };
}

window.editChannel = function(id) {
  api.getChannels().then(function(channels) {
    var ch = channels.find(function(c) { return c.id === id; });
    if (ch) showChannelModal(ch);
  });
};

window.deleteChannel = function(id) {
  if (!confirm('Are you sure you want to delete this channel?')) return;
  api.deleteChannel(id).then(function() {
    window.showToast('Channel deleted', 'success');
    // Trigger refresh event for channelListAdmin
    window.dispatchEvent(new CustomEvent('refreshChannels'));
  }).catch(function(err) {
    window.showToast(err.message, 'error');
  });
};

function showFetchVideosModal(callback) {
  document.getElementById('modalTitle').textContent = 'Fetch Videos from YouTube';
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group">' +
      '<label>Channel ID</label>' +
      '<input type="text" id="fetchChannelId" class="form-input" placeholder="e.g. UC... (YouTube Channel ID)">' +
    '</div>' +
    '<div class="form-group">' +
      '<label for="fetchVideoType">Video Type *</label>' +
      '<select id="fetchVideoType" class="form-select" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.95rem;font-family:inherit;">' +
        '<option value="">-- Select Video Type --</option>' +
        '<option value="advert">Advert (Short videos)</option>' +
        '<option value="curricular">Curricular (All durations)</option>' +
      '</select>' +
    '</div>' +
    '<div id="fetchError" style="display:none;color:red;padding:10px;background:#ffe6e6;border-radius:4px;margin-top:10px;"></div>';

  document.getElementById('modalOverlay').style.display = 'flex';

  // Remove any existing event listeners on modalSave
  var modalSave = document.getElementById('modalSave');
  var newModalSave = modalSave.cloneNode(true);
  modalSave.parentNode.replaceChild(newModalSave, modalSave);

  newModalSave.textContent = 'Fetch Videos';
  newModalSave.style.display = 'block';
  newModalSave.onclick = function() {
    var channelId = document.getElementById('fetchChannelId').value.trim();
    var videoType = document.getElementById('fetchVideoType').value;
    var errorDiv = document.getElementById('fetchError');

    if (!channelId) {
      errorDiv.textContent = 'Please enter a channel ID';
      errorDiv.style.display = 'block';
      return;
    }

    if (!videoType) {
      errorDiv.textContent = 'Please select a video type';
      errorDiv.style.display = 'block';
      return;
    }

    var isAdvert = videoType === 'advert';
    errorDiv.style.display = 'none';
    newModalSave.disabled = true;
    newModalSave.textContent = 'Fetching...';

    api.fetchChannelVideos(channelId, isAdvert)
      .then(function(videos) {
        closeModal();
        
        if (videos.length === 0) {
          window.showToast('No videos found', 'info');
          return;
        }

        // Store videos globally
        window.currentFetchedVideos = videos;
        window.currentChannelId = channelId;

        // Show success toast
        window.showToast('Fetched ' + videos.length + ' videos', 'success');

        // If callback provided, use it (for subcontent view)
        // Otherwise display in main content (for channel view)
        if (callback && typeof callback === 'function') {
          callback(videos, channelId);
        } else {
          displayVideosInMainContent(videos, channelId);
        }
      })
      .catch(function(err) {
        console.error('Error fetching videos:', err);
        errorDiv.textContent = 'Error: ' + (err.message || 'Failed to fetch videos');
        errorDiv.style.display = 'block';
        newModalSave.disabled = false;
        newModalSave.textContent = 'Fetch Videos';
      });
  };
}

function showViewVideosModal(channelId, channelName) {
  // Show modal with channel name and type selection
  document.getElementById('modalTitle').textContent = 'View Videos - ' + (channelName || channelId);
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group">' +
      '<label>Channel</label>' +
      '<input type="text" class="form-input" value="' + escapeHtml(channelName || channelId) + '" readonly style="background:#f5f5f5;">' +
    '</div>' +
    '<div class="form-group">' +
      '<label for="viewVideoType">Video Type *</label>' +
      '<select id="viewVideoType" class="form-select" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.95rem;font-family:inherit;">' +
        '<option value="">-- Select Video Type --</option>' +
        '<option value="advert">Advert (Short videos)</option>' +
        '<option value="curricular">Curricular (All durations)</option>' +
      '</select>' +
    '</div>';

  document.getElementById('modalOverlay').style.display = 'flex';

  // Remove any existing event listeners on modalSave
  var modalSave = document.getElementById('modalSave');
  var newModalSave = modalSave.cloneNode(true);
  modalSave.parentNode.replaceChild(newModalSave, modalSave);

  newModalSave.textContent = 'Fetch Videos';
  newModalSave.style.display = 'block';

  newModalSave.onclick = function() {
    var videoType = document.getElementById('viewVideoType').value;

    if (!videoType) {
      window.showToast('Please select a video type', 'error');
      return;
    }

    var isAdvert = videoType === 'advert';
    closeModal();

    // Check channel assignment before fetching videos
    checkChannelAssignment(channelId, channelName)
      .then(function() {
        // Call viewChannelVideos with the selected type
        viewChannelVideos(channelId, channelName, isAdvert);
      })
      .catch(function(err) {
        console.error('Error checking assignment:', err);
        window.showToast('Error: ' + (err.message || 'Failed to check assignment'), 'error');
      });
  };
}

function viewChannelVideos(channelId, channelName, isAdvert) {
  // Show loading state in modal
  document.getElementById('modalTitle').textContent = 'Videos from ' + (channelName || channelId);
  document.getElementById('modalBody').innerHTML = '<div style="text-align:center;padding:20px;">Loading videos...</div>';
  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('modalSave').style.display = 'none';

  // Fetch videos from the channel
  api.fetchChannelVideos(channelId, false)
    .then(function(videos) {
      // Close modal
      closeModal();

      if (videos.length === 0) {
        window.showToast('No videos found', 'info');
        return;
      }

      // Store videos globally
      window.currentFetchedVideos = videos;
      window.currentChannelId = channelId;
      window.currentChannelName = channelName;

      // Show success toast
      window.showToast('Fetched ' + videos.length + ' videos', 'success');

      // Display videos in main content
      displayVideosInMainContent(videos, channelId);
    })
    .catch(function(err) {
      console.error('Error fetching videos:', err);
      closeModal();
      window.showToast('Error: ' + (err.message || 'Failed to fetch videos'), 'error');
    });
}

function checkChannelAssignment(channelId, channelName) {
  return new Promise(function(resolve, reject) {
    api.getChannelAssignments(channelId)
      .then(function(assignments) {
        if (!assignments || assignments.length === 0) {
          // No assignments found, ask user if they want to create one
          var createAssignment = confirm(
            'This channel is not assigned to any curriculum position.\n\n' +
            'Would you like to assign it now?\n\n' +
            'Click OK to create an assignment, or Cancel to continue without assignment.'
          );
          
          if (createAssignment) {
            // Show assignment creation modal
            showAssignmentModal(channelId, channelName)
              .then(function() {
                resolve(true);
              })
              .catch(function(err) {
                console.error('Error creating assignment:', err);
                // Continue anyway, user can enter manually
                resolve(true);
              });
          } else {
            // User chose to continue without assignment
            resolve(true);
          }
        } else {
          // Has assignments, proceed
          resolve(true);
        }
      })
      .catch(function(err) {
        console.error('Error checking assignments:', err);
        // Continue anyway, user can enter manually
        resolve(true);
      });
  });
}

function showAssignmentModal(channelId, channelName) {
  return new Promise(function(resolve, reject) {
    document.getElementById('modalTitle').textContent = 'Assign Channel - ' + (channelName || channelId);
    document.getElementById('modalBody').innerHTML =
      '<div class="form-group">' +
        '<label>Channel</label>' +
        '<input type="text" class="form-input" value="' + escapeHtml(channelName || channelId) + '" readonly style="background:#f5f5f5;">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="assignmentGrade">Grade *</label>' +
        '<select id="assignmentGrade" class="form-select" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.95rem;font-family:inherit;">' +
          '<option value="">-- Select Grade --</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="assignmentSubject">Subject (optional)</label>' +
        '<select id="assignmentSubject" class="form-select" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.95rem;font-family:inherit;">' +
          '<option value="">-- Select Subject (optional) --</option>' +
        '</select>' +
      '</div>';

    document.getElementById('modalOverlay').style.display = 'flex';

    // Load grades
    api.getGrades()
      .then(function(grades) {
        var gradeSelect = document.getElementById('assignmentGrade');
        grades.forEach(function(grade) {
          gradeSelect.innerHTML += '<option value="' + grade.id + '">' + escapeHtml(grade.name) + '</option>';
        });

        // Add change listener to load subjects
        gradeSelect.addEventListener('change', function() {
          var subjectSelect = document.getElementById('assignmentSubject');
          subjectSelect.innerHTML = '<option value="">-- Select Subject (optional) --</option>';
          
          if (gradeSelect.value) {
            api.getSubjects(gradeSelect.value)
              .then(function(subjects) {
                subjects.forEach(function(subject) {
                  subjectSelect.innerHTML += '<option value="' + subject.id + '">' + escapeHtml(subject.name) + '</option>';
                });
              })
              .catch(function(err) {
                console.error('Error loading subjects:', err);
              });
          }
        });
      })
      .catch(function(err) {
        console.error('Error loading grades:', err);
        window.showToast('Error loading grades', 'error');
      });

    // Remove any existing event listeners on modalSave
    var modalSave = document.getElementById('modalSave');
    var newModalSave = modalSave.cloneNode(true);
    modalSave.parentNode.replaceChild(newModalSave, modalSave);

    newModalSave.textContent = 'Assign Channel';
    newModalSave.style.display = 'block';

    newModalSave.onclick = function() {
      var gradeId = document.getElementById('assignmentGrade').value;
      var subjectId = document.getElementById('assignmentSubject').value || null;

      if (!gradeId) {
        window.showToast('Please select a grade', 'error');
        return;
      }

      var assignmentData = {
        channel_id: channelId,
        grade_id: gradeId
      };

      if (subjectId) {
        assignmentData.subject_id = subjectId;
      }

      api.assignChannelToPosition(assignmentData)
        .then(function() {
          window.showToast('Channel assigned successfully', 'success');
          closeModal();
          resolve(true);
        })
        .catch(function(err) {
          console.error('Error assigning channel:', err);
          window.showToast('Error: ' + (err.message || 'Failed to assign channel'), 'error');
          reject(err);
        });
    };
  });
}

function displayVideosInMainContent(videos, channelId) {
  // Hide all views and show only channel-videos-view
  hideAllViews();
  
  // Get the channel-videos-view container
  var container = document.getElementById('channel-videos-view');
  if (!container) {
    console.error('channel-videos-view not found');
    return;
  }

  // Update the title
  var titleElement = document.getElementById('channelVideosTitle');
  if (titleElement && window.currentChannelName) {
    titleElement.textContent = 'Videos from ' + window.currentChannelName;
  }

  // Add save button to header if it doesn't exist
  var header = document.querySelector('#channel-videos-view .view-header');
  if (header && !document.getElementById('saveVideosHeaderBtn')) {
    var saveBtn = document.createElement('button');
    saveBtn.id = 'saveVideosHeaderBtn';
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = 'Save Videos';
    saveBtn.style.cssText = 'margin-left:auto;padding:10px 20px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.95rem;';
    saveBtn.addEventListener('click', function() {
      saveSelectedVideosFromMainContent();
    });
    header.appendChild(saveBtn);
  }

  // Get the video grid
  var grid = document.getElementById('channelVideoGrid');
  if (!grid) {
    console.error('channelVideoGrid not found');
    return;
  }

  // Build videos grid
  if (videos.length === 0) {
    grid.innerHTML = '<div class="empty-state">' +
      '<div class="empty-icon">📹</div>' +
      '<h2>No Videos Found</h2>' +
      '<p>No videos available for this channel</p>' +
    '</div>';
  } else {
    var videosHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;">';

    videos.forEach(function(video, index) {
      var thumbnailUrl = video.thumbnails && video.thumbnails.medium ? video.thumbnails.medium : 
                         video.thumbnails && video.thumbnails.default ? video.thumbnails.default : 
                         'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%23ddd" width="320" height="180"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Thumbnail%3C/text%3E%3C/svg%3E';
      
      videosHtml += '<div class="video-card" style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background:white;position:relative;">' +
        '<div style="position:relative;padding-top:56.25%;background:#000;">' +
          '<img src="' + thumbnailUrl + '" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" alt="Video thumbnail">' +
        '</div>' +
        '<div style="padding:12px;">' +
          '<div style="font-weight:600;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:40px;">' + escapeHtml(video.title) + '</div>' +
          '<div style="font-size:0.85rem;color:#666;margin-bottom:8px;">' +
            'Duration: ' + formatDuration(video.duration) + ' | ' +
            'Views: ' + formatViews(video.viewCount) +
          '</div>' +
          '<button class="btn-delete-fetched-video" data-index="' + index + '" style="width:100%;padding:8px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;">Delete</button>' +
        '</div>' +
      '</div>';
    });

    videosHtml += '</div>';
    grid.innerHTML = videosHtml;
  }

  // Show the channel-videos-view
  container.style.display = 'block';

  // Add event listener for back to channels button
  var backBtn = document.getElementById('backToChannels');
  if (backBtn) {
    // Remove any existing listeners by cloning and replacing
    var newBackBtn = backBtn.cloneNode(true);
    backBtn.parentNode.replaceChild(newBackBtn, backBtn);
    
    newBackBtn.addEventListener('click', function() {
      backToChannels();
    });
  }

  // Add event listeners for delete buttons
  document.querySelectorAll('.btn-delete-fetched-video').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      var index = parseInt(e.target.dataset.index);
      var videoTitle = window.currentFetchedVideos[index] ? window.currentFetchedVideos[index].title : 'this video';
      
      if (confirm('Are you sure you want to delete "' + videoTitle + '" from the list?')) {
        deleteVideoFromMainContent(index);
      }
    });
  });

  // Load channel assignments for save functionality
  loadChannelAssignments(window.currentChannelId);
}

function hideAllViews() {
  // Hide all content-section elements
  document.querySelectorAll('.content-section').forEach(function(section) {
    section.style.display = 'none';
  });
}

function backToChannels() {
  // Clear global state
  window.currentFetchedVideos = null;
  window.currentChannelId = null;
  window.currentChannelName = null;
  
  // Remove save button if it exists
  var saveBtn = document.getElementById('saveVideosHeaderBtn');
  if (saveBtn) {
    saveBtn.remove();
  }
  
  // Refresh channel list
  if (window.channelListAdmin) {
    window.channelListAdmin.showChannelsView();
  }
}

function loadChannelAssignments(channelId) {
  api.getChannelAssignments(channelId)
    .then(function(assignments) {
      var assignmentDetails = document.getElementById('assignmentDetails');
      if (!assignmentDetails) return;

      if (!assignments || assignments.length === 0) {
        assignmentDetails.innerHTML = '<p style="color:#666;">This channel is not assigned to any curriculum position. Please enter details manually when saving.</p>' +
          '<div class="form-group">' +
            '<label>Grade ID (UUID)</label>' +
            '<input type="text" id="saveGradeId" class="form-input" placeholder="Enter Grade ID">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Subject ID (UUID, optional)</label>' +
            '<input type="text" id="saveSubjectId" class="form-input" placeholder="Enter Subject ID">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Content ID (UUID, optional)</label>' +
            '<input type="text" id="saveContentId" class="form-input" placeholder="Enter Content ID">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Subcontent ID (UUID, optional)</label>' +
            '<input type="text" id="saveSubcontentId" class="form-input" placeholder="Enter Subcontent ID">' +
          '</div>';
        return;
      }

      // Group assignments by level
      var gradeAssignments = assignments.filter(function(a) { return a.subject_id === null && a.content_id === null && a.subcontent_id === null; });
      var subjectAssignments = assignments.filter(function(a) { return a.subject_id !== null && a.content_id === null && a.subcontent_id === null; });
      var contentAssignments = assignments.filter(function(a) { return a.content_id !== null && a.subcontent_id === null; });
      var subcontentAssignments = assignments.filter(function(a) { return a.subcontent_id !== null; });

      var html = '';

      if (gradeAssignments.length > 0) {
        html += '<div style="margin-bottom:15px;">' +
          '<strong>Grade Level:</strong><br>' +
          gradeAssignments.map(function(a) { return escapeHtml(a.grades.name); }).join(', ') +
        '</div>';
      }

      if (subjectAssignments.length > 0) {
        html += '<div style="margin-bottom:15px;">' +
          '<strong>Subject Level:</strong><br>' +
          subjectAssignments.map(function(a) { return escapeHtml(a.grades.name) + ' > ' + escapeHtml(a.subjects.name); }).join('<br>') +
        '</div>';
      }

      if (contentAssignments.length > 0) {
        html += '<div style="margin-bottom:15px;">' +
          '<strong>Content Level:</strong><br>' +
          contentAssignments.map(function(a) { return escapeHtml(a.grades.name) + ' > ' + escapeHtml(a.subjects.name) + ' > ' + escapeHtml(a.contents.name); }).join('<br>') +
        '</div>';
      }

      if (subcontentAssignments.length > 0) {
        html += '<div style="margin-bottom:15px;">' +
          '<strong>Subcontent Level:</strong><br>' +
          subcontentAssignments.map(function(a) { return escapeHtml(a.grades.name) + ' > ' + escapeHtml(a.subjects.name) + ' > ' + escapeHtml(a.contents.name) + ' > ' + escapeHtml(a.subcontents.name); }).join('<br>') +
        '</div>';
      }

      html += '<p style="margin-top:15px;padding-top:15px;border-top:1px solid #ddd;"><strong>Select assignment level for saving:</strong></p>' +
        '<div class="form-group">' +
          '<select id="saveAssignmentLevel" class="form-select" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:0.95rem;font-family:inherit;">' +
            '<option value="">-- Select Level --</option>';

      if (gradeAssignments.length > 0) {
        html += '<optgroup label="Grade Level">';
        gradeAssignments.forEach(function(a) {
          html += '<option value="grade_' + a.grade_id + '">' + escapeHtml(a.grades.name) + ' (Grade)</option>';
        });
        html += '</optgroup>';
      }

      if (subjectAssignments.length > 0) {
        html += '<optgroup label="Subject Level">';
        subjectAssignments.forEach(function(a) {
          html += '<option value="subject_' + a.id + '">' + escapeHtml(a.grades.name) + ' > ' + escapeHtml(a.subjects.name) + ' (Subject)</option>';
        });
        html += '</optgroup>';
      }

      if (contentAssignments.length > 0) {
        html += '<optgroup label="Content Level">';
        contentAssignments.forEach(function(a) {
          html += '<option value="content_' + a.id + '">' + escapeHtml(a.grades.name) + ' > ' + escapeHtml(a.subjects.name) + ' > ' + escapeHtml(a.contents.name) + ' (Content)</option>';
        });
        html += '</optgroup>';
      }

      if (subcontentAssignments.length > 0) {
        html += '<optgroup label="Subcontent Level">';
        subcontentAssignments.forEach(function(a) {
          html += '<option value="subcontent_' + a.id + '">' + escapeHtml(a.grades.name) + ' > ' + escapeHtml(a.subjects.name) + ' > ' + escapeHtml(a.contents.name) + ' > ' + escapeHtml(a.subcontents.name) + ' (Subcontent)</option>';
        });
        html += '</optgroup>';
      }

      html += '</select></div>';

      assignmentDetails.innerHTML = html;
    })
    .catch(function(err) {
      console.error('Error loading assignments:', err);
      var assignmentDetails = document.getElementById('assignmentDetails');
      if (assignmentDetails) {
        assignmentDetails.innerHTML = '<p style="color:red;">Error loading assignments. Please enter details manually.</p>' +
          '<div class="form-group">' +
            '<label>Grade ID (UUID)</label>' +
            '<input type="text" id="saveGradeId" class="form-input" placeholder="Enter Grade ID">' +
          '</div>';
      }
    });
}

function deleteVideoFromMainContent(index) {
  if (!window.currentFetchedVideos) return;
  
  // Remove video from array
  window.currentFetchedVideos.splice(index, 1);
  
  // Re-render the grid with channelId
  displayVideosInMainContent(window.currentFetchedVideos, window.currentChannelId);
  
  window.showToast('Video removed', 'info');
}

function saveSelectedVideosFromMainContent() {
  if (!window.currentFetchedVideos || window.currentFetchedVideos.length === 0) {
    window.showToast('No videos to save', 'error');
    return;
  }

  // Confirm save
  if (!confirm('Are you sure you want to save ' + window.currentFetchedVideos.length + ' videos to the database?')) {
    return;
  }

  // Automatically fetch channel assignments and use the most specific one
  window.showToast('Loading channel assignments...', 'info');
  
  api.getChannelAssignments(window.currentChannelId)
    .then(function(assignments) {
      if (!assignments || assignments.length === 0) {
        window.showToast('No channel assignments found. Please assign this channel to a curriculum position first.', 'error');
        return;
      }

      // Use the first assignment (prioritize most specific: subcontent > content > subject > grade)
      var assignment = assignments[0];
      
      // Find the most specific assignment
      for (var i = 0; i < assignments.length; i++) {
        var a = assignments[i];
        if (a.subcontent_id) {
          assignment = a;
          break;
        } else if (a.content_id && !assignment.subcontent_id) {
          assignment = a;
        } else if (a.subject_id && !assignment.content_id && !assignment.subcontent_id) {
          assignment = a;
        }
      }

      var grade_id = assignment.grade_id;
      var subject_id = assignment.subject_id;
      var content_id = assignment.content_id;
      var subcontent_id = assignment.subcontent_id;

      window.showToast('Saving to: ' + assignment.grades.name + (assignment.subjects ? ' > ' + assignment.subjects.name : '') + (assignment.contents ? ' > ' + assignment.contents.name : '') + (assignment.subcontents ? ' > ' + assignment.subcontents.name : ''), 'info');

      saveVideosWithAssignment(grade_id, subject_id, content_id, subcontent_id);
    })
    .catch(function(err) {
      console.error('Error fetching assignments:', err);
      window.showToast('Error: ' + (err.message || 'Failed to fetch channel assignments'), 'error');
    });
}

function saveVideosWithAssignment(grade_id, subject_id, content_id, subcontent_id) {
  window.showToast('Saving all videos...', 'info');
  console.log('Saving videos with assignment:', { grade_id, subject_id, content_id, subcontent_id });
  console.log('currentFetchedVideos:', window.currentFetchedVideos);  
  
  api.saveVideos(window.currentFetchedVideos, grade_id, subject_id, content_id, subcontent_id)
    .then(function(result) {
      window.showToast('Saved ' + result.savedCount + ' videos successfully', 'success');
      console.log('Save result:', result);
      
      // Clear the videos
      window.currentFetchedVideos = [];
      
      // Clear the video grid
      var grid = document.getElementById('channelVideoGrid');
      if (grid) {
        grid.innerHTML = '';
      }
      
      // Go back to channels view
      backToChannels();
    })
    .catch(function(err) {
      console.error('Error saving videos:', err);
      window.showToast('Error: ' + (err.message || 'Failed to save videos'), 'error');
    });
}

// Removed old modal-based functions (toggleSelectAll, deleteVideoFromList, saveSelectedVideos)
// Replaced with main content display functions

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function formatViews(views) {
  if (!views) return '0';
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
}

// Make functions globally accessible
window.closeModal = function() {
  document.getElementById('modalOverlay').style.display = 'none';
  window.currentFetchedVideos = null;
  window.currentChannelId = null;
};

window.showFetchVideosModal = showFetchVideosModal;

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChannelManagement);
} else {
  initChannelManagement();
}

export { initChannelManagement };
