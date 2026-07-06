// Assignment Dashboard - Channel assignment for the new admin dashboard
(function() {
  'use strict';

  let initialized = false;
  let allChannels = [];
  let fullTree = [];
  let selectedType = null; // 'grade' or 'subject'
  let selectedId = null;
  let selectedChannelId = null;
  let cascadingInitialized = false;
  let assignTreeData = null; // Store tree data for assign modal

  function init() {
    if (initialized) return;
    initialized = true;

    // Bind assign channel button
    const assignBtn = document.getElementById('assignChannelBtn');
    if (assignBtn) {
      assignBtn.addEventListener('click', function() {
        // Get the currently selected channel from the channels view
        const selectedChannels = window.channelListAdmin?.selectedChannels;
        if (selectedChannels && selectedChannels.size > 0) {
          // Use the first selected channel
          selectedChannelId = Array.from(selectedChannels)[0];
          openAssignChannelModal();
        } else {
          window.showToast('Please select a channel first', 'error');
        }
      });
    }

    // Bind delete videos button
    const deleteVideosBtn = document.getElementById('deleteVideosBtn');
    if (deleteVideosBtn) {
      deleteVideosBtn.addEventListener('click', function() {
        openDeleteVideosModal();
      });
    }

    // Bind modal close events
    document.getElementById('assignChannelModalClose').addEventListener('click', closeAssignChannelModal);
    document.getElementById('assignChannelModalCancel').addEventListener('click', closeAssignChannelModal);
    document.getElementById('assignChannelModalSave').addEventListener('click', saveChannelAssignment);

    document.getElementById('deleteVideosModalClose').addEventListener('click', closeDeleteVideosModal);
    document.getElementById('deleteVideosModalCancel').addEventListener('click', closeDeleteVideosModal);
    document.getElementById('deleteVideosModalSave').addEventListener('click', handleDeleteVideos);

    document.getElementById('confirmClose').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
  }

  // ==================== CHANNEL ASSIGNMENT ====================

  function openAssignChannelModal() {
    const modal = document.getElementById('assignChannelModal');
    if (!modal) return;

    // Show modal first
    modal.style.display = 'flex';
    
    // Initialize cascading dropdowns (only once)
    if (!cascadingInitialized) {
      initializeCascadingDropdowns();
      cascadingInitialized = true;
    }

    // Load grades after modal is visible
    setTimeout(function() {
      loadAssignChannelGrades();
    }, 100);
    
    // Show channel info
    const channel = allChannels.find(c => c.id === selectedChannelId);
    document.getElementById('assignChannelInfo').textContent = 
      'Assigning channel: ' + (channel ? channel.name : selectedChannelId);
  }

  function closeAssignChannelModal() {
    document.getElementById('assignChannelModal').style.display = 'none';
  }

  function initializeCascadingDropdowns() {
    const gradeSelect = document.getElementById('assignChannelGradeSelect');
    const subjectSelect = document.getElementById('assignChannelSubjectSelect');
    const contentSelect = document.getElementById('assignChannelContentSelect');
    const subcontentSelect = document.getElementById('assignChannelSubcontentSelect');
    
    if (!gradeSelect || !subjectSelect || !contentSelect || !subcontentSelect) {
      console.error('Required dropdown elements not found');
      return;
    }

    console.log('Initializing cascading dropdowns...');
    console.log('Grade select element:', gradeSelect);
    console.log('Subject select element:', subjectSelect);

    // Grade change handler - populate from tree data
    const gradeChangeHandler = function() {
      const gradeId = this.value;
      console.log('=== GRADE CHANGED ===');
      console.log('Grade selected:', gradeId);
      console.log('assignTreeData available:', !!assignTreeData);
      console.log('assignTreeData length:', assignTreeData ? assignTreeData.length : 0);
      
      subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
      subjectSelect.disabled = !gradeId;
      contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
      contentSelect.disabled = true;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = true;

      if (!gradeId || !assignTreeData) {
        console.log('Early return - gradeId:', gradeId, 'assignTreeData:', !!assignTreeData);
        return;
      }

      // Find the selected grade in the tree
      const grade = assignTreeData.find(g => g.id === gradeId);
      console.log('Found grade:', grade);
      console.log('Grade subjects:', grade ? grade.subjects : 'N/A');
      
      if (!grade || !grade.subjects) {
        console.log('No grade or subjects found');
        return;
      }

      // Populate subjects from tree
      console.log('Populating', grade.subjects.length, 'subjects');
      grade.subjects.forEach(function(subject) {
        const opt = document.createElement('option');
        opt.value = subject.id;
        opt.textContent = subject.name;
        subjectSelect.appendChild(opt);
      });
      
      console.log('Subjects added to dropdown:', subjectSelect.options.length, 'options');
      console.log('Subject select disabled:', subjectSelect.disabled);
    };

    // Don't attach grade listener here - it will be attached after grades are loaded
    // to prevent innerHTML from removing it

    // Subject change handler - populate from tree data
    subjectSelect.onchange = function() {
      const subjectId = this.value;
      contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
      contentSelect.disabled = !subjectId;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = true;

      if (!subjectId || !assignTreeData) return;

      // Find the selected subject in the tree
      let subject = null;
      for (const grade of assignTreeData) {
        subject = grade.subjects.find(s => s.id === subjectId);
        if (subject) break;
      }
      
      if (!subject || !subject.contents) return;

      // Populate contents from tree
      subject.contents.forEach(function(content) {
        const opt = document.createElement('option');
        opt.value = content.id;
        opt.textContent = content.name;
        contentSelect.appendChild(opt);
      });
    };

    // Content change handler - populate from tree data
    contentSelect.onchange = function() {
      const contentId = this.value;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = !contentId;

      if (!contentId || !assignTreeData) return;

      // Find the selected content in the tree
      let content = null;
      for (const grade of assignTreeData) {
        for (const subject of grade.subjects || []) {
          content = subject.contents.find(c => c.id === contentId);
          if (content) break;
        }
        if (content) break;
      }
      
      if (!content || !content.subcontents) return;

      // Populate subcontents from tree
      content.subcontents.forEach(function(subcontent) {
        const opt = document.createElement('option');
        opt.value = subcontent.id;
        opt.textContent = subcontent.name;
        subcontentSelect.appendChild(opt);
      });
    };
  }

  function loadAssignChannelGrades() {
    console.log('Loading grades for assign modal...');
    const gradeSelect = document.getElementById('assignChannelGradeSelect');
    const subjectSelect = document.getElementById('assignChannelSubjectSelect');
    const contentSelect = document.getElementById('assignChannelContentSelect');
    const subcontentSelect = document.getElementById('assignChannelSubcontentSelect');
    
    if (!gradeSelect || !subjectSelect || !contentSelect || !subcontentSelect) {
      console.error('Required dropdown elements not found');
      return;
    }

    // Reset all dropdowns
    gradeSelect.innerHTML = '<option value="">-- Select Grade --</option>';
    gradeSelect.disabled = false;
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    subjectSelect.disabled = true;
    contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
    contentSelect.disabled = true;
    subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
    subcontentSelect.disabled = true;

    console.log('Loading full tree for assign modal...');
    
    // Load full tree and populate grade dropdown
    window.adminServices.getFullTree()
      .then(function(tree) {
        console.log('Full tree loaded:', tree);
        assignTreeData = tree; // Store for later use
        console.log  ('Populating grade dropdown...');
        if (!tree || tree.length === 0) {
          console.warn('No grades found in tree');
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'No grades available';
          opt.disabled = true;
          gradeSelect.appendChild(opt);
          return;
        }
        
    // Populate grade dropdown from tree
    tree.forEach(function(grade) {
      const opt = document.createElement('option');
      opt.value = grade.id;
      opt.textContent = grade.name;
      gradeSelect.appendChild(opt);
    });
    
    console.log('Grades added to dropdown:', gradeSelect.options.length, 'options');
    
    // Re-attach event listener after populating grades
    console.log('Re-attaching grade change listener...');
    const newGradeChangeHandler = function() {
      const gradeId = this.value;
      console.log('=== GRADE CHANGED (reattached) ===');
      console.log('Grade selected:', gradeId);
      console.log('assignTreeData available:', !!assignTreeData);
      
      subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
      subjectSelect.disabled = !gradeId;
      contentSelect.innerHTML = '<option value="">-- Select Content --</option>';
      contentSelect.disabled = true;
      subcontentSelect.innerHTML = '<option value="">-- Select Subcontent --</option>';
      subcontentSelect.disabled = true;

      if (!gradeId || !assignTreeData) {
        console.log('Early return - no grade or tree data');
        return;
      }

      const grade = assignTreeData.find(g => g.id === gradeId);
      console.log('Found grade:', grade ? grade.name : 'NOT FOUND');
      
      if (!grade || !grade.subjects) {
        console.log('No subjects found for grade');
        return;
      }

      console.log('Populating', grade.subjects.length, 'subjects');
      grade.subjects.forEach(function(subject) {
        const opt = document.createElement('option');
        opt.value = subject.id;
        opt.textContent = subject.name;
        subjectSelect.appendChild(opt);
      });
      
      console.log('Subjects populated successfully');
    };
    
    gradeSelect.onchange = newGradeChangeHandler;
    console.log('Grade change listener re-attached');
  })
      .catch(function(err) {
        console.error('Failed to load tree:', err);
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Error loading grades';
        opt.disabled = true;
        gradeSelect.appendChild(opt);
      });
  }

  function saveChannelAssignment() {
    const gradeId = document.getElementById('assignChannelGradeSelect').value;
    const subjectId = document.getElementById('assignChannelSubjectSelect').value;
    const contentId = document.getElementById('assignChannelContentSelect')?.value || null;
    const subcontentId = document.getElementById('assignChannelSubcontentSelect')?.value || null;
    const channelId = window.assignmentDashboard.selectedChannelId;

    if (!gradeId) {
      window.showToast('Please select a grade', 'error');
      return;
    }
    if (!channelId) {
      window.showToast('No channel selected', 'error');
      return;
    }

    const btn = document.getElementById('assignChannelModalSave');
    btn.disabled = true;
    btn.textContent = 'Assigning...';

    // Use assignChannelToPosition to assign to specific level
    // Only include subject_id, content_id, subcontent_id if they are selected
    const assignmentData = {
      channel_id: channelId,
      grade_id: gradeId,
      subject_id: subjectId || null,
      content_id: contentId || null,
      subcontent_id: subcontentId || null
    };

    window.adminServices.assignChannelToPosition(assignmentData)
      .then(function() {
        window.showToast('Channel assigned successfully', 'success');
        closeAssignChannelModal();
        // Reload channels
        if (window.channelListAdmin) {
          window.channelListAdmin.showChannelsView();
        }
      })
      .catch(function(err) {
        window.showToast(err.message || 'Failed to assign channel', 'error');
      })
      .finally(function() {
        btn.disabled = false;
        btn.textContent = 'Assign';
      });
  }

  // ==================== DELETE VIDEOS ====================

  function openDeleteVideosModal() {
    const modal = document.getElementById('deleteVideosModal');
    if (!modal) return;

    // Load grade filter
    loadDeleteGradeFilter();
    loadDeleteChannelFilter();

    modal.style.display = 'flex';
  }

  function closeDeleteVideosModal() {
    document.getElementById('deleteVideosModal').style.display = 'none';
  }

  function loadDeleteGradeFilter() {
    const select = document.getElementById('deleteGradeSelect');
    if (!select) return;

    window.adminServices.getGrades()
      .then(function(grades) {
        select.innerHTML = '<option value="">-- All Grades --</option>';
        grades.forEach(function(g) {
          const opt = document.createElement('option');
          opt.value = g.id;
          opt.textContent = g.name;
          select.appendChild(opt);
        });
      })
      .catch(function(err) {
        console.error('Failed to load grades:', err);
      });

    // Setup cascading
    document.getElementById('deleteGradeSelect').addEventListener('change', handleDeleteGradeChange);
    document.getElementById('deleteSubjectSelect').addEventListener('change', handleDeleteSubjectChange);
    document.getElementById('deleteContentSelect').addEventListener('change', handleDeleteContentChange);
  }

  function loadDeleteChannelFilter() {
    const select = document.getElementById('deleteChannelSelect');
    if (!select) return;

    window.adminServices.getChannels()
      .then(function(channels) {
        select.innerHTML = '<option value="">-- Select Channel --</option>';
        channels.forEach(function(ch) {
          const opt = document.createElement('option');
          opt.value = ch.id;
          opt.textContent = ch.name;
          select.appendChild(opt);
        });
      })
      .catch(function(err) {
        console.error('Failed to load channels:', err);
      });
  }

  function handleDeleteGradeChange() {
    const gradeId = this.value;
    const subjectSelect = document.getElementById('deleteSubjectSelect');
    const contentSelect = document.getElementById('deleteContentSelect');
    const subcontentSelect = document.getElementById('deleteSubcontentSelect');

    subjectSelect.innerHTML = '<option value="">-- All Subjects --</option>';
    subjectSelect.disabled = !gradeId;
    contentSelect.innerHTML = '<option value="">-- All Contents --</option>';
    contentSelect.disabled = true;
    subcontentSelect.innerHTML = '<option value="">-- All Subcontents --</option>';
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
  }

  function handleDeleteSubjectChange() {
    const subjectId = this.value;
    const contentSelect = document.getElementById('deleteContentSelect');
    const subcontentSelect = document.getElementById('deleteSubcontentSelect');

    contentSelect.innerHTML = '<option value="">-- All Contents --</option>';
    contentSelect.disabled = !subjectId;
    subcontentSelect.innerHTML = '<option value="">-- All Subcontents --</option>';
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
  }

  function handleDeleteContentChange() {
    const contentId = this.value;
    const subcontentSelect = document.getElementById('deleteSubcontentSelect');

    subcontentSelect.innerHTML = '<option value="">-- All Subcontents --</option>';
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
  }

  function handleDeleteVideos() {
    const gradeId = document.getElementById('deleteGradeSelect').value;
    const subjectId = document.getElementById('deleteSubjectSelect').value;
    const contentId = document.getElementById('deleteContentSelect').value;
    const subcontentId = document.getElementById('deleteSubcontentSelect').value;
    const channelId = document.getElementById('deleteChannelSelect').value;

    if (!gradeId && !subjectId && !contentId && !subcontentId && !channelId) {
      window.showToast('Please select at least one filter level or a channel', 'error');
      return;
    }

    const btn = document.getElementById('deleteVideosModalSave');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    let data;
    if (channelId) {
      data = { channel_id: channelId };
    } else {
      data = {
        grade_id: gradeId || null,
        subject_id: subjectId || null,
        content_id: contentId || null,
        subcontent_id: subcontentId || null
      };
    }

    window.adminServices.deleteVideosByPosition(data)
      .then(function(result) {
        window.showToast('Videos deleted successfully: ' + (result.deletedVideos || 0) + ' removed', 'success');
        closeDeleteVideosModal();
        
        // Reload current curriculum view if any
        if (window.videoListAdmin && window.videoListAdmin.currentSubcontentId) {
          window.videoListAdmin.showSubcontentView(window.videoListAdmin.currentSubcontentId);
        }
      })
      .catch(function(err) {
        window.showToast(err.message || 'Failed to delete videos', 'error');
      })
      .finally(function() {
        btn.disabled = false;
        btn.textContent = 'Delete Videos';
      });
  }

  // ==================== CONFIRM MODAL ====================

  function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';

    const newOk = document.getElementById('confirmOk').cloneNode(true);
    document.getElementById('confirmOk').parentNode.replaceChild(newOk, document.getElementById('confirmOk'));
    newOk.addEventListener('click', function() {
      closeConfirmModal();
      if (onConfirm) onConfirm();
    });
  }

  function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
  }

  // ==================== UTILITY ====================

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Export
  window.assignmentDashboard = {
    init: init,
    selectedChannelId: selectedChannelId,
    loadAssignChannelGrades: loadAssignChannelGrades,
    saveChannelAssignment: saveChannelAssignment,
    closeAssignChannelModal: closeAssignChannelModal
  };
})();
