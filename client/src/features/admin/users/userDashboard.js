// User Dashboard - User management for the new admin dashboard
(function() {
  'use strict';

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;
    loadUsers();
  }

  async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const loading = document.getElementById('usersLoading');
    if (!tbody) return;

    if (loading) loading.textContent = 'Loading...';

    try {
      const users = await window.adminServices.getUsers();
      if (loading) loading.textContent = '';
      tbody.innerHTML = '';

      if (!users || !users.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No users found</td></tr>';
        return;
      }

      users.forEach(function(user) {
        const tr = document.createElement('tr');
        const profileCount = user.profiles ? user.profiles.length : 0;
        const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';

        tr.innerHTML =
          '<td><code>' + escapeHtml(user.id.substring(0, 12)) + '...</code></td>' +
          '<td><span class="role-badge role-' + user.role + '">' + user.role + '</span></td>' +
          '<td>' + user.tier + '</td>' +
          '<td>' + profileCount + ' / ' + (user.number_of_profiles || 1) + '</td>' +
          '<td>' + created + '</td>' +
          '<td class="actions-cell">' +
            '<button class="btn-edit" data-id="' + user.id + '" data-role="' + user.role + '">Edit Role</button>' +
          '</td>';

        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
          showEditRoleModal(this.getAttribute('data-id'), this.getAttribute('data-role'));
        });
      });
    } catch (err) {
      if (loading) loading.textContent = 'Error loading users';
      console.error(err);
    }
  }

  function showEditRoleModal(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'parent' : 'admin';
    if (!confirm('Change user role from "' + currentRole + '" to "' + newRole + '"?')) return;

    window.adminServices.updateUserRole(userId, newRole)
      .then(function() {
        window.showToast('User role updated to ' + newRole, 'success');
        loadUsers();
      })
      .catch(function(err) {
        window.showToast(err.message || 'Failed to update role', 'error');
      });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Export
  window.userDashboard = {
    init: init,
    loadUsers: loadUsers
  };
})();