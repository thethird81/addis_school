// Dashboard Initialization - Tab switching, action bar control, toast
(function() {
  'use strict';

  let currentTab = 'curriculum';

  document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab(this.dataset.tab);
      });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.adminAuth.logout();
      });
    }

    // Init auth check
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      window.adminAuth.showLoginPage();
    } else {
      // Default to channels view on login
      setTimeout(() => {
        if (window.channelListAdmin) {
          window.channelListAdmin.showChannelsView();
        }
      }, 500);
    }

    // Assign Channel Modal close buttons
    const assignCloseBtn = document.getElementById('assignChannelModalClose');
    const assignCancelBtn = document.getElementById('assignChannelModalCancel');
    
    if (assignCloseBtn) {
      assignCloseBtn.addEventListener('click', () => {
        if (window.assignmentDashboard) {
          window.assignmentDashboard.closeAssignChannelModal();
        }
      });
    }
    
    if (assignCancelBtn) {
      assignCancelBtn.addEventListener('click', () => {
        if (window.assignmentDashboard) {
          window.assignmentDashboard.closeAssignChannelModal();
        }
      });
    }

    // Assign Channel Modal save button
    const assignSaveBtn = document.getElementById('assignChannelModalSave');
    if (assignSaveBtn) {
      assignSaveBtn.addEventListener('click', () => {
        if (window.assignmentDashboard) {
          window.assignmentDashboard.saveChannelAssignment();
        }
      });
    }

    // Assign Channel Modal overlay click
    const assignModal = document.getElementById('assignChannelModal');
    if (assignModal) {
      assignModal.addEventListener('click', (e) => {
        if (e.target === assignModal && window.assignmentDashboard) {
          window.assignmentDashboard.closeAssignChannelModal();
        }
      });
    }
  });

  function switchTab(tab) {
    currentTab = tab;

    // Update nav active state
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.nav-tab[data-tab="${tab}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Show/hide sidebar based on tab
    const sidebar = document.getElementById('sidebar');
    const sidebarContent = document.getElementById('sidebarContent');
    
    if (tab === 'curriculum') {
      // Show sidebar
      if (sidebar) sidebar.style.display = '';
      // Show curriculum views, hide quiz/users views
      document.querySelectorAll('.content-section').forEach(s => {
        const isQuiz = s.id.startsWith('quiz-');
        const isUsers = s.id === 'users-view';
        const isCurriculum = !isQuiz && !isUsers;
        
        if (isCurriculum) {
          if (s.id === 'empty-state') {
            s.style.display = s.classList.contains('active') ? 'block' : 'none';
          }
          // Keep current visibility
        } else {
          s.style.display = 'none';
          s.classList.remove('active');
        }
      });
      
      // Reset action bar
      updateActionBar('curriculum');
    } else if (tab === 'quiz') {
      // Hide sidebar
      if (sidebar) sidebar.style.display = 'none';
      
      // Hide all curriculum views, show quiz list by default
      document.querySelectorAll('.content-section').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
      });
      
      // Show quiz sub-tabs
      const quizListView = document.getElementById('quiz-list-view');
      if (quizListView) {
        quizListView.style.display = 'block';
        quizListView.classList.add('active');
      }
      const quizQuestionsView = document.getElementById('quiz-questions-view');
      if (quizQuestionsView) {
        quizQuestionsView.style.display = 'block';
      }
      const quizAssignmentsView = document.getElementById('quiz-assignments-view');
      if (quizAssignmentsView) {
        quizAssignmentsView.style.display = 'block';
      }
      
      updateActionBar('quiz');
    } else if (tab === 'users') {
      // Hide sidebar
      if (sidebar) sidebar.style.display = 'none';
      
      // Hide all other sections, show users
      document.querySelectorAll('.content-section').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
      });
      const usersView = document.getElementById('users-view');
      if (usersView) {
        usersView.style.display = 'block';
        usersView.classList.add('active');
      }
      
      updateActionBar('users');
      
      // Load users
      if (window.userDashboard) {
        window.userDashboard.loadUsers();
      }
    }
  }

  function updateActionBar(tab) {
    const actionsCenter = document.querySelector('.actions-center');
    if (!actionsCenter) return;

    if (tab === 'curriculum') {
      document.getElementById('fetchVideoBtn').style.display = '';
      document.getElementById('deleteSelectedBtn').style.display = '';
      document.getElementById('assignChannelBtn').style.display = '';
      document.getElementById('deleteVideosBtn').style.display = '';
    } else {
      document.getElementById('fetchVideoBtn').style.display = 'none';
      document.getElementById('deleteSelectedBtn').style.display = 'none';
      document.getElementById('assignChannelBtn').style.display = 'none';
      document.getElementById('deleteVideosBtn').style.display = 'none';
    }
  }

  // Expose for other modules
  window.dashboardInit = {
    switchTab,
    getCurrentTab: () => currentTab
  };

  // Toast helper
  window.showToast = function(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast ' + (type || 'success');
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  };
})();