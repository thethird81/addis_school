'use strict';

var BASE_URL = (function() {
  var isProduction = (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost');
  return isProduction ? 'https://api.abrhote.com/api/v1/admin' : 'http://127.0.0.1:5001/api/v1/admin';
})();

var AUTH_URL = (function() {
  var isProduction = (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost');
  return isProduction ? 'https://api.abrhote.com/api/v1/auth' : 'http://127.0.0.1:5001/api/v1/auth';
})();

function getAuthHeaders() {
  var token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? 'Bearer ' + token : ''
  };
}

function handleResponse(response) {
  if (response.status === 401) {
    // Try token refresh
    return fetch(AUTH_URL + '/refresh', { credentials: 'include' })
      .then(function(refreshRes) {
        if (!refreshRes.ok) {
          window.location.href = '/dist/index.html';
          throw new Error('Session expired');
        }
        return refreshRes.json();
      })
      .then(function(data) {
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          return fetch(response.url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + data.accessToken
            }
          }).then(handleResponse);
        }
        window.location.href = '/dist/index.html';
        throw new Error('Session expired');
      });
  }
  if (response.status === 403) {
    showUserMessage('Admin access required', true);
    throw new Error('Forbidden');
  }
  if (!response.ok) {
    return response.json().then(function(err) {
      throw new Error(err.error || 'Request failed');
    });
  }
  return response.json();
}

function showUserMessage(msg, isError) {
  var msgEl = document.getElementById('message');
  if (!msgEl) return;
  msgEl.textContent = msg;
  msgEl.style.color = isError ? '#dc3545' : '#28a745';
  msgEl.style.display = 'block';
  setTimeout(function() {
    msgEl.style.display = 'none';
  }, 4000);
}

// Load all users with profiles
function loadUsers() {
  var userListEl = document.getElementById('userList');
  userListEl.innerHTML = '<p>Loading users...</p>';

  fetch(BASE_URL + '/users', { headers: getAuthHeaders() })
    .then(handleResponse)
    .then(function(users) {
      if (!users || users.length === 0) {
        userListEl.innerHTML = '<p>No users found.</p>';
        return;
      }

      var html = '';
      users.forEach(function(user) {
        var roleBadge = user.role === 'admin'
          ? '<span style="background:#e94560;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.8rem;">admin</span>'
          : '<span style="background:#6c757d;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.8rem;">parent</span>';

        var profileInfo = '';
        if (user.profiles && user.profiles.length > 0) {
          profileInfo = user.profiles.map(function(p) {
            return '<div style="margin-left:15px;font-size:0.85rem;color:#555;">' +
              '👤 ' + escapeHtml(p.profile_name) +
              ' | Grade: ' + escapeHtml(p.grade_name || 'N/A') +
              ' | Coins: ' + (p.coins || 0) +
              ' | Active: ' + (p.is_active ? '✅' : '❌') +
              '</div>';
          }).join('');
        } else {
          profileInfo = '<div style="margin-left:15px;font-size:0.85rem;color:#999;">No profiles</div>';
        }

        html += '<div class="user-item" style="border-left: 4px solid ' + (user.role === 'admin' ? '#e94560' : '#6c757d') + ';">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div>' +
              '<strong>ID:</strong> <code style="font-size:0.8rem;">' + escapeHtml(user.id) + '</code><br>' +
              '<strong>Role:</strong> ' + roleBadge +
              ' | <strong>Tier:</strong> ' + escapeHtml(user.tier || 'free') +
              ' | <strong>Profiles:</strong> ' + (user.number_of_profiles || 0) +
              '<br><strong>Created:</strong> ' + new Date(user.created_at).toLocaleDateString() +
            '</div>' +
            '<div>' +
              '<button class="btn-delete" onclick="deleteUser(\'' + user.id + '\')" style="padding:4px 10px;font-size:0.8rem;">Delete Account</button>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:8px;">' +
            '<strong>Profiles:</strong>' +
            profileInfo +
          '</div>' +
        '</div>';
      });

      userListEl.innerHTML = html;
    })
    .catch(function(err) {
      userListEl.innerHTML = '<p style="color:#dc3545;">Error loading users: ' + escapeHtml(err.message) + '</p>';
    });
}

// Update user role
function updateRole() {
  var userId = document.getElementById('userId').value.trim();
  var role = document.getElementById('roleSelect').value;

  if (!userId) {
    showUserMessage('Please enter a User ID', true);
    return;
  }

  fetch(BASE_URL + '/users/' + encodeURIComponent(userId) + '/role', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role: role })
  })
    .then(handleResponse)
    .then(function() {
      showUserMessage('User role updated to: ' + role);
      loadUsers();
      document.getElementById('userId').value = '';
    })
    .catch(function(err) {
      showUserMessage(err.message, true);
    });
}

// Delete user via auth endpoint (requires admin)
window.deleteUser = function(userId) {
  if (!confirm('Are you sure you want to delete this user and all their data?')) return;

  var token = localStorage.getItem('accessToken');
  fetch(AUTH_URL + '/account/' + userId, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    }
  })
    .then(handleResponse)
    .then(function() {
      showUserMessage('User account deleted');
      loadUsers();
    })
    .catch(function(err) {
      showUserMessage(err.message, true);
    });
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

// Bind buttons on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  var loadBtn = document.getElementById('loadUsersBtn');
  var updateBtn = document.getElementById('updateRoleBtn');

  if (loadBtn) loadBtn.addEventListener('click', loadUsers);
  if (updateBtn) updateBtn.addEventListener('click', updateRole);

  // Auto-load users on page load
  loadUsers();
});