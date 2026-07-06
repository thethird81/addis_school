// Admin Services - API wrapper for admin operations
const API_BASE = 'http://localhost:5001/api/v1/admin';

class AdminServices {
  constructor() {
    this.baseUrl = API_BASE;
  }

  async request(url, options = {}) {
    const response = await window.adminAuth.makeAuthenticatedRequest(
      `${this.baseUrl}${url}`,
      options
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }

  // ==================== GRADES ====================
  async getGrades() {
    return this.request('/grades');
  }

  async createGrade(name) {
    return this.request('/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  async updateGrade(id, name) {
    return this.request(`/grades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  async deleteGrade(id) {
    return this.request(`/grades/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== SUBJECTS ====================
  async getSubjects(gradeId) {
    return this.request(`/subjects/${gradeId}`);
  }

  async createSubject(gradeId, name) {
    return this.request('/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade_id: gradeId, name })
    });
  }

  async updateSubject(id, name) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  async deleteSubject(id) {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== CONTENTS ====================
  async getContents(subjectId) {
    return this.request(`/contents/${subjectId}`);
  }

  async createContent(subjectId, name) {
    return this.request('/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: subjectId, name })
    });
  }

  async updateContent(id, name) {
    return this.request(`/contents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  async deleteContent(id) {
    return this.request(`/contents/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== SUBCONTENTS ====================
  async getSubcontents(contentId) {
    return this.request(`/subcontents/${contentId}`);
  }

  async createSubcontent(contentId, name) {
    return this.request('/subcontents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId, name })
    });
  }

  async updateSubcontent(id, name) {
    return this.request(`/subcontents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  async deleteSubcontent(id) {
    return this.request(`/subcontents/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== CHANNELS ====================
  async getChannels() {
    return this.request('/channels');
  }

  async getChannelVideos(channelId) {
    return this.request(`/channels/${channelId}/videos`);
  }

  async createChannel(data) {
    return this.request('/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateChannel(id, data) {
    return this.request(`/channels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async deleteChannel(id) {
    return this.request(`/channels/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== CHANNEL ASSIGNMENTS ====================
  async getFullTree() {
    return this.request('/tree');
  }

  async getGradeChannels(gradeId) {
    return this.request(`/grade-channels/${gradeId}`);
  }

  async getSubjectChannels(subjectId) {
    return this.request(`/subject-channels/${subjectId}`);
  }

  async getChannelsByGrade(gradeId) {
    return this.request(`/grades/${gradeId}/channels`);
  }

  async assignChannelToGrade(gradeId, channelId) {
    return this.request('/assign/grade-channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade_id: gradeId, channel_id: channelId })
    });
  }

  async removeChannelFromGrade(gradeId, channelId) {
    return this.request('/assign/grade-channel', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade_id: gradeId, channel_id: channelId })
    });
  }

  async assignChannelToSubject(subjectId, channelId) {
    return this.request('/assign/subject-channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: subjectId, channel_id: channelId })
    });
  }

  async removeChannelFromSubject(subjectId, channelId) {
    return this.request('/assign/subject-channel', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: subjectId, channel_id: channelId })
    });
  }

  async assignChannelToPosition(data) {
    return this.request('/assign/channel-to-position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async getChannelAssignments(channelId) {
    return this.request(`/channels/${channelId}/assignments`);
  }

  // ==================== VIDEOS ====================
  async getVideos(subcontentId) {
    return this.request(`/subcontents/${subcontentId}/videos`);
  }

  async addVideosBulk(subcontentId, videos, gradeId, subjectId, contentId) {
    return this.request('/videos/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subcontentId, videos, gradeId, subjectId, contentId })
    });
  }

  async deleteVideosBulk(videoIds) {
    return this.request('/videos/bulk-ids', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds })
    });
  }

  async deleteVideosByPosition(data) {
    return this.request('/videos/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateVideo(id, data) {
    return this.request(`/videos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  // ==================== YOUTUBE FETCH ====================
  async fetchChannelVideos(channelId, isAdvert = false) {
    return this.request(`/youtube/channel/${channelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdvert })
    });
  }

  async fetchSearchVideos(searchTerm) {
    return this.request('/youtube/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchTerm })
    });
  }

  async saveVideos(videos, grade_id, subject_id, content_id, subcontent_id) {
    return this.request('/youtube/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videos,
        grade_id,
        subject_id,
        content_id,
        subcontent_id,
      })
    });
  }

  // ==================== REPORTED VIDEOS ====================
  async getReportedVideos() {
    return this.request('/reported-videos');
  }

  async resolveReport(videoId) {
    return this.request(`/reported-videos/${videoId}/resolve`, {
      method: 'POST'
    });
  }

  async deleteReportedVideo(videoId) {
    return this.request(`/reported-videos/${videoId}`, {
      method: 'DELETE'
    });
  }

  // ==================== USERS ====================
  async getUsers() {
    return this.request('/users');
  }

  async updateUserRole(id, role) {
    return this.request(`/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
  }

  // ==================== QUIZZES ====================
  async getQuizzes() {
    return this.request('/quizzes');
  }

  async createQuiz(data) {
    return this.request('/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateQuiz(id, data) {
    return this.request(`/quizzes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async deleteQuiz(id) {
    return this.request(`/quizzes/${id}`, {
      method: 'DELETE'
    });
  }

  async importQuizJSON(data) {
    return this.request('/quizzes/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  // ==================== QUESTIONS ====================
  async getQuestionsByQuiz(quizId) {
    return this.request(`/questions/quiz/${quizId}`);
  }

  async createQuestion(data) {
    return this.request('/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateQuestion(id, data) {
    return this.request(`/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async deleteQuestion(id) {
    return this.request(`/questions/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== QUIZ ASSIGNMENTS ====================
  async getQuizAssignments(params) {
    let queryString = '';
    if (params) {
      const parts = [];
      if (params.grade_id) parts.push(`grade_id=${encodeURIComponent(params.grade_id)}`);
      if (params.subject_id) parts.push(`subject_id=${encodeURIComponent(params.subject_id)}`);
      if (params.content_id) parts.push(`content_id=${encodeURIComponent(params.content_id)}`);
      if (params.subcontent_id) parts.push(`subcontent_id=${encodeURIComponent(params.subcontent_id)}`);
      if (parts.length) queryString = '?' + parts.join('&');
    }
    return this.request(`/quiz-assignments${queryString}`);
  }

  async assignQuizToSubcontent(data) {
    return this.request('/quiz-assignments/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async removeQuizAssignment(id) {
    return this.request(`/quiz-assignments/${id}`, {
      method: 'DELETE'
    });
  }
}

// Export singleton instance
window.adminServices = new AdminServices();