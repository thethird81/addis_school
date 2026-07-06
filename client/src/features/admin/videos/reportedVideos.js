// Reported Videos Admin - Manage flagged videos
class ReportedVideos {
  constructor() {
    this.reportedVideos = [];
    this.selectedVideos = new Set();
    
    this.init();
  }

  init() {
    this.loadReportedVideos();
  }

  async loadReportedVideos() {
    try {
      this.reportedVideos = await window.adminServices.getReportedVideos();
      this.renderReportedVideos();
    } catch (error) {
      console.error('Failed to load reported videos:', error);
    }
  }

  renderReportedVideos() {
    const container = document.getElementById('reportedVideoGrid');
    if (!container) return;

    // Add view header
    const reportedView = document.getElementById('reported-view');
    let header = reportedView ? reportedView.querySelector('.view-header') : null;
    if (!header && reportedView) {
      header = document.createElement('div');
      header.className = 'view-header';
      reportedView.prepend(header);
    }
    if (header) {
      header.innerHTML = `<h2>⚠️ Reported Videos</h2>`;
    }

    if (this.reportedVideos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h2>No Reported Videos</h2>
          <p>All videos are clean</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.reportedVideos.map(video => `
      <div class="video-card video-reported" data-video-id="${video.id}" style="cursor: pointer;">
        <div class="checkbox-wrapper">
          <input type="checkbox" class="video-checkbox" data-video-id="${video.id}">
        </div>
        <div class="video-thumbnail">
          <img src="${window.videoListAdmin.getThumbnailUrl(video.thumbnails)}" alt="${video.title}">
          <span class="report-badge">⚠️ Reported</span>
          <span class="duration-badge">${window.videoListAdmin.formatDuration(video.duration)}</span>
          <button class="video-delete-icon" data-video-id="${video.id}" title="Delete video">🗑️</button>
        </div>
        <div class="video-info">
          <h3 class="video-title">${video.title}</h3>
          <p class="video-meta">📖 ${video.channel_title || 'Unknown Channel'}</p>
          <p class="video-meta" style="color: #dc3545; margin-top: 4px;">Reason: ${video.reason || 'Not specified'}</p>
        </div>
        <div class="video-actions">
          <button class="btn-resolve" data-video-id="${video.id}">✓ Resolve</button>
          <button class="btn-delete-reported" data-video-id="${video.id}">🗑️ Delete</button>
        </div>
      </div>
    `).join('');

    // Add click handlers to open video player modal
    container.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking checkbox, action buttons, or delete icon
        if (e.target.classList.contains('video-checkbox')) return;
        if (e.target.closest('.video-actions')) return;
        if (e.target.classList.contains('video-delete-icon')) return;
        
        const videoId = card.dataset.videoId;
        const video = this.reportedVideos.find(v => v.id === videoId);
        if (video) {
          window.videoListAdmin.openVideoPlayerModal(video, this.reportedVideos);
        }
      });
    });

    // Bind delete icon events
    container.querySelectorAll('.video-delete-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = e.target.dataset.videoId;
        // Find the delete button for this video and trigger its click
        const deleteBtn = document.querySelector(`.btn-delete-reported[data-video-id="${videoId}"]`);
        if (deleteBtn) deleteBtn.click();
      });
    });

    // Bind events
    this.bindEvents();
    this.showView('reported-view');
    
    // Update badge count
    const badge = document.getElementById('reportedCount');
    if (badge) {
      badge.textContent = this.reportedVideos.length;
    }
  }

  bindEvents() {
    // Checkbox changes
    document.querySelectorAll('#reportedVideoGrid .video-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const videoId = e.target.dataset.videoId;
        if (e.target.checked) {
          this.selectedVideos.add(videoId);
        } else {
          this.selectedVideos.delete(videoId);
        }
      });
    });

    // Resolve buttons
    document.querySelectorAll('.btn-resolve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const videoId = btn.dataset.videoId;
        await this.resolveVideo(videoId);
      });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete-reported').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const videoId = btn.dataset.videoId;
        await this.deleteVideo(videoId);
      });
    });
  }

  async resolveVideo(videoId) {
    if (!confirm('Mark this report as resolved?')) return;

    try {
      await window.adminServices.resolveReport(videoId);
      await this.loadReportedVideos();
    } catch (error) {
      console.error('Failed to resolve report:', error);
      alert('Failed to resolve report: ' + error.message);
    }
  }

  async deleteVideo(videoId) {
    if (!confirm('Delete this reported video?')) return;

    try {
      await window.adminServices.deleteReportedVideo(videoId);
      await this.loadReportedVideos();
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video: ' + error.message);
    }
  }

  showView(viewId) {
    document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = 'none';
      section.classList.remove('active');
    });

    const view = document.getElementById(viewId);
    if (view) {
      view.style.display = 'block';
      view.classList.add('active');
    }
  }

  async showReportedView() {
    await this.loadReportedVideos();
  }
}

// Export singleton instance
window.reportedVideos = new ReportedVideos();