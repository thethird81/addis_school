// Admin Authentication Module
const API_BASE = 'http://localhost:5001/api/v1';

class AdminAuth {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    // Don't auto-init in constructor - let the page handle it
  }

  async init() {
    // Check if user is already logged in
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      await this.validateToken(token);
    } else {
      this.showLoginPage();
    }
  }

  async validateToken(token) {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        this.isAuthenticated = true;
        this.currentUser = user;
        this.showDashboard();
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      this.logout();
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Include cookies for refresh token
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin only.');
      }

      // Store access token (refresh token is in httpOnly cookie)
      localStorage.setItem('admin_access_token', data.accessToken);
      
      this.isAuthenticated = true;
      this.currentUser = data.user;
      
      this.showDashboard();
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      // Call logout endpoint
      await fetch(`${API_BASE}/auth/signout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      
      this.isAuthenticated = false;
      this.currentUser = null;
      
      this.showLoginPage();
    }
  }

  showLoginPage() {
    window.location.href = '/src/pages/admin/admin-login.html';
  }

  showDashboard() {
    window.location.href = '/src/pages/admin/admin-dashboard.html';
  }

  getToken() {
    return localStorage.getItem('admin_access_token');
  }

  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      localStorage.setItem('admin_access_token', data.accessToken);

      return data.accessToken;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    let token = this.getToken();

    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    let response = await fetch(url, { ...options, headers, credentials: 'include' });

    // If token expired, try to refresh
    if (response.status === 401) {
      try {
        token = await this.refreshToken();
        headers['Authorization'] = `Bearer ${token}`;
        response = await fetch(url, { ...options, headers, credentials: 'include' });
      } catch (error) {
        this.logout();
        throw error;
      }
    }

    return response;
  }
}

// Export singleton instance
window.adminAuth = new AdminAuth();
