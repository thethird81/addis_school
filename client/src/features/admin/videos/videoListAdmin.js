// Video List Admin - Video grid with checkboxes and bulk operations
class VideoListAdmin {
  constructor() {
    this.currentVideos = [];
    this.selectedVideos = new Set();
    this.currentSubcontentId = null;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.bindModalEvents();
    this.fetchedVideos = []; // Track fetched but unsaved videos
  }

  bindEvents() {
    // Fetch video button (global action bar)
    const fetchBtn = document.getElementById('fetchVideoBtn');
    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => this.openFetchModal());
    }

    // Delete selected button (global action bar)
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteSelected());
    }

    // Subcontent view action buttons
    const deleteSelectedBtn = document.getElementById('deleteSelectedVideosBtn');
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', () => this.deleteSelected());
    }

    const fetchVideosBtn = document.getElementById('fetchVideosForSubcontentBtn');
    if (fetchVideosBtn) {
      fetchVideosBtn.addEventListener('click', () => this.fetchVideosForSubcontent());
    }

    const saveFetchedBtn = document.getElementById('saveFetchedVideosBtn');
    if (saveFetchedBtn) {
      saveFetchedBtn.addEventListener('click', () => this.saveFetchedVideos());
    }

    // Video grid checkbox delegation
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('video-checkbox')) {
        this.toggleVideoSelection(e.target);
      }
    });
  }

  bindModalEvents() {
    // Video player modal
    const closeBtn = document.getElementById('videoPlayerClose');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const deleteBtn = document.getElementById('modalDeleteBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeVideoPlayerModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeVideoPlayerModal());
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteCurrentVideo());
    }

    // Close on overlay click
    const modal = document.getElementById('videoPlayerModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeVideoPlayerModal();
        }
      });
    }
  }

  openFetchModal() {
    if (window.fetchVideoModal) {
      window.fetchVideoModal.open();
    }
  }

  toggleVideoSelection(checkbox) {
    const videoId = checkbox.dataset.videoId;
    
    if (checkbox.checked) {
      this.selectedVideos.add(videoId);
    } else {
      this.selectedVideos.delete(videoId);
    }
  }

  async deleteSelected() {
    if (this.selectedVideos.size === 0) {
      alert('Please select videos to delete');
      return;
    }

    if (!confirm(`Delete ${this.selectedVideos.size} selected videos?`)) {
      return;
    }

    try {
      await window.adminServices.deleteVideosBulk(Array.from(this.selectedVideos));
      
      // Clear selection
      this.selectedVideos.clear();
      
      // Reload current view
      if (this.currentSubcontentId) {
        this.showSubcontentView(this.currentSubcontentId);
      }
    } catch (error) {
      console.error('Failed to delete videos:', error);
      alert('Failed to delete videos: ' + error.message);
    }
  }

  async showSubcontentView(subcontentId) {
    this.currentSubcontentId = subcontentId;
    this.selectedVideos.clear();
    this.fetchedVideos = []; // Clear any previously fetched videos

    try {
      const videos = await window.adminServices.getVideos(subcontentId);
      this.currentVideos = videos;
      
      // Get subcontent and grade names from sidebar data if available
      let subcontentName = 'Subcontent';
      let gradeName = '';
      if (window.sidebarCRUD && window.sidebarCRUD.data) {
        const sc = window.sidebarCRUD.data.subcontents.find(s => s.id === subcontentId);
        if (sc) {
          subcontentName = sc.name;
          // Find the grade name
          if (window.sidebarCRUD.data.contents) {
            const content = window.sidebarCRUD.data.contents.find(c => c.id === sc.content_id);
            if (content && window.sidebarCRUD.data.subjects) {
              const subject = window.sidebarCRUD.data.subjects.find(s => s.id === content.subject_id);
              if (subject && window.sidebarCRUD.data.grades) {
                const grade = window.sidebarCRUD.data.grades.find(g => g.id === subject.grade_id);
                if (grade) gradeName = grade.name;
              }
            }
          }
        }
      }
      
      // Update title
      const titleElement = document.getElementById('subcontentTitle');
      if (titleElement) {
        titleElement.textContent = `${this.escapeHtml(gradeName)} - ${this.escapeHtml(subcontentName)} - Videos`;
      }
      
      // Hide save button (no fetched videos yet)
      this.updateSaveButtonVisibility();
      
      // Render videos
      this.renderVideoGrid(videos, 'videoGrid');
      this.showView('subcontent-view');
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  }

  renderVideoGrid(videos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (videos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📹</div>
          <h2>No Videos Found</h2>
          <p>Click "Fetch Videos" to add videos from YouTube</p>
        </div>
      `;
      return;
    }

    container.innerHTML = videos.map(video => `
      <div class="video-card" data-video-id="${video.id}" style="cursor: pointer;">
        <div class="checkbox-wrapper">
          <input type="checkbox" class="video-checkbox" data-video-id="${video.id}">
        </div>
        <div class="video-thumbnail">
          <img src="${this.getThumbnailUrl(video.thumbnails)}" alt="${video.title}">
          <span class="duration-badge">${this.formatDuration(video.duration)}</span>
          <button class="video-delete-icon" data-video-id="${video.id}" title="Delete video">🗑️</button>
        </div>
        <div class="video-info">
          <h3 class="video-title">${video.title}</h3>
          <p class="video-meta">📖 ${video.channel_title || 'Unknown Channel'}</p>
        </div>
      </div>
    `).join('');

    // Add click handlers to open play-video page
    container.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking checkbox or delete icon
        if (e.target.classList.contains('video-checkbox')) return;
        if (e.target.classList.contains('video-delete-icon')) return;
        
        const videoId = card.dataset.videoId;
        const video = videos.find(v => v.id === videoId || v.videoId === videoId);
        if (video) {
          this.openPlayVideoPage(video, videos);
        }
      });
    });

    // Bind delete icon events
    container.querySelectorAll('.video-delete-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = e.target.dataset.videoId;
        if (!confirm('Delete this video?')) return;
        this.deleteSingleVideo(videoId);
      });
    });
  }

  async deleteSingleVideo(videoId) {
    try {
      await window.adminServices.deleteVideosBulk([videoId]);
      window.showToast('Video deleted', 'success');
      
      // Reload current view
      if (this.currentSubcontentId) {
        await this.showSubcontentView(this.currentSubcontentId);
      }
    } catch (error) {
      window.showToast('Failed to delete video: ' + error.message, 'error');
    }

    this.showView('subcontent-view');
  }

  openPlayVideoPage(video, allVideos) {
    // Open video player modal
    this.openVideoPlayerModal(video, allVideos);
  }

  openVideoPlayerModal(video, allVideos) {
    const modal = document.getElementById('videoPlayerModal');
    const title = document.getElementById('videoPlayerTitle');
    const playerContainer = document.getElementById('videoPlayerContainer');
    
    if (!modal) return;
    
    // Set title
    if (title) title.textContent = video.title || 'Video Player';
    
    // Debug: log video object to see available fields
    console.log('Opening video modal:', video);
    
    // Try to get YouTube ID from various possible fields
    let videoId = '';
    const urlFields = ['url', 'video_url', 'youtube_url', 'link', 'videoLink'];
    for (const field of urlFields) {
      if (video[field]) {
        videoId = this.extractYouTubeId(video[field]);
        if (videoId) {
          console.log(`Found video ID from ${field}:`, videoId);
          break;
        }
      }
    }
    
    // If still no ID, check if video object itself has an id that might be YouTube ID
    if (!videoId && video.id && video.id.length === 11) {
      videoId = video.id;
      console.log('Using video.id as YouTube ID:', videoId);
    }
    
    // Create YouTube embed if we have a video ID
    if (playerContainer && videoId) {
      playerContainer.innerHTML = `
        <iframe 
          width="100%" 
          height="400" 
          src="https://www.youtube.com/embed/${videoId}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
    } else if (playerContainer) {
      playerContainer.innerHTML = `
        <div style="color: white; text-align: center; padding: 40px;">
          <p style="font-size: 18px;">Video preview not available</p>
          <p style="font-size: 14px; color: #aaa;">Video ID: ${videoId || 'Not found'}</p>
          <p style="font-size: 12px; color: #888;">Available fields: ${Object.keys(video).join(', ')}</p>
        </div>
      `;
    }
    
    // Store current video for delete
    this.currentVideoForModal = video;
    this.currentAllVideos = allVideos;
    
    // Show modal
    modal.style.display = 'flex';
  }

  extractYouTubeId(url) {
    if (!url) return '';
    // Match various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return '';
  }

  closeVideoPlayerModal() {
    const modal = document.getElementById('videoPlayerModal');
    const playerContainer = document.getElementById('videoPlayerContainer');
    
    if (modal) modal.style.display = 'none';
    if (playerContainer) playerContainer.innerHTML = '';
  }

  deleteCurrentVideo() {
    if (!this.currentVideoForModal) return;
    
    if (!confirm(`Delete this video?\n\n"${this.currentVideoForModal.title || 'Untitled'}"`)) {
      return;
    }

    const videoId = this.currentVideoForModal.id || this.currentVideoForModal.videoId;
    
    const deleteBtn = document.getElementById('modalDeleteBtn');
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
    }

    window.adminServices.deleteVideosBulk([videoId])
      .then(() => {
        alert('Video deleted successfully');
        this.closeVideoPlayerModal();
        
        // Reload current view
        if (this.currentSubcontentId) {
          this.showSubcontentView(this.currentSubcontentId);
        }
      })
      .catch((error) => {
        alert('Failed to delete video: ' + (error.message || 'Unknown error'));
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.textContent = '🗑️ Delete';
        }
      });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getThumbnailUrl(thumbnails) {
    if (!thumbnails) return 'https://via.placeholder.com/400x225';
    
    // If it's a JSON object, try to get the best quality
    if (typeof thumbnails === 'object') {
      // YouTube format: {high: "url", medium: "url", default: "url"}
      if (thumbnails.high) return thumbnails.high;
      if (thumbnails.medium) return thumbnails.medium;
      if (thumbnails.default) return thumbnails.default;
      if (thumbnails.default_) return thumbnails.default_;
      
      // If it has a url property directly
      if (thumbnails.url) return thumbnails.url;
    }
    
    // If it's already a string
    if (typeof thumbnails === 'string') return thumbnails;
    
    return 'https://via.placeholder.com/400x225';
  }

  formatDuration(seconds) {
    if (!seconds) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showView(viewId) {
    // Hide all views
    document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = 'none';
      section.classList.remove('active');
    });

    // Show selected view
    const view = document.getElementById(viewId);
    if (view) {
      view.style.display = 'block';
      view.classList.add('active');
    }
  }

  addFetchedVideos(videos) {
    this.currentVideos = [...this.currentVideos, ...videos];
    this.renderVideoGrid(this.currentVideos, 'videoGrid');
  }

  async fetchVideosForSubcontent() {
    if (!this.currentSubcontentId) {
      alert('Please select a subcontent first');
      return;
    }

    // Resolve grade hierarchy for this subcontent
    let gradeId = null;
    let subjectId = null;
    let contentId = null;
    let gradeName = '';
    let subcontentName = '';
    
    if (window.sidebarCRUD && window.sidebarCRUD.data) {
      const sc = window.sidebarCRUD.data.subcontents.find(s => s.id === this.currentSubcontentId);
      if (sc) {
        subcontentName = sc.name;
        contentId = sc.content_id;
        
        if (window.sidebarCRUD.data.contents) {
          const content = window.sidebarCRUD.data.contents.find(c => c.id === contentId);
          if (content) {
            subjectId = content.subject_id;
            
            if (window.sidebarCRUD.data.subjects) {
              const subject = window.sidebarCRUD.data.subjects.find(s => s.id === subjectId);
              if (subject) {
                gradeId = subject.grade_id;
                
                if (window.sidebarCRUD.data.grades) {
                  const grade = window.sidebarCRUD.data.grades.find(g => g.id === gradeId);
                  if (grade) {
                    gradeName = grade.name;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Show custom fetch modal with search term
    this.showFetchVideosModal(gradeName, subcontentName, (searchTerm) => {
      this.performFetchVideos(searchTerm, gradeId, subjectId, contentId);
    });
  }

  showFetchVideosModal(gradeName, subcontentName, callback) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'fetchVideosModal';
    modalOverlay.style.display = 'flex';
    
    modalOverlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Fetch Videos from YouTube</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Position</label>
            <input type="text" class="form-input" value="${this.escapeHtml(gradeName)} > ${this.escapeHtml(subcontentName)}" readonly style="background:#f5f5f5;">
          </div>
          <div class="form-group">
            <label for="fetchSearchTerm">Search Term *</label>
            <input type="text" id="fetchSearchTerm" class="form-input" placeholder="Enter YouTube search term..." autofocus>
          </div>
          <div id="fetchError" style="display:none;color:red;padding:10px;background:#ffe6e6;border-radius:4px;margin-top:10px;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="fetchVideosBtn">Fetch Videos</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // Close button handlers
    const closeBtn = modalOverlay.querySelector('.modal-close');
    const cancelBtn = modalOverlay.querySelector('.modal-cancel');
    
    const closeModal = () => {
      modalOverlay.style.display = 'none';
      setTimeout(() => modalOverlay.remove(), 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // Fetch button handler
    const fetchBtn = modalOverlay.querySelector('#fetchVideosBtn');
    const searchInput = modalOverlay.querySelector('#fetchSearchTerm');
    const errorDiv = modalOverlay.querySelector('#fetchError');

    if (fetchBtn) {
      fetchBtn.addEventListener('click', async () => {
        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
          errorDiv.textContent = 'Please enter a search term';
          errorDiv.style.display = 'block';
          return;
        }

        errorDiv.style.display = 'none';
        fetchBtn.disabled = true;
        fetchBtn.textContent = 'Fetching...';

        try {
          closeModal();
          callback(searchTerm);
        } catch (error) {
          errorDiv.textContent = 'Error: ' + (error.message || 'Failed to fetch videos');
          errorDiv.style.display = 'block';
          fetchBtn.disabled = false;
          fetchBtn.textContent = 'Fetch Videos';
        }
      });
    }

    // Focus on search input
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  }

  async performFetchVideos(searchTerm, gradeId, subjectId, contentId) {
    try {
      window.showToast('Fetching videos...', 'info');
      
      // Fetch videos by search term
      const videos = await window.adminServices.fetchSearchVideos(searchTerm);
      
      if (videos.length === 0) {
        window.showToast('No videos found', 'info');
        return;
      }

      // Store fetched videos with hierarchy
      this.fetchedVideos = videos;
      this.currentGradeId = gradeId;
      this.currentSubjectId = subjectId;
      this.currentContentId = contentId;
      
      this.displayFetchedVideos(videos);
      window.showToast(`Fetched ${videos.length} videos`, 'success');
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      alert('Failed to fetch videos: ' + error.message);
    }
  }

  displayFetchedVideos(videos) {
    const container = document.getElementById('videoGrid');
    if (!container) return;

    if (videos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>No Videos Found</h2>
          <p>Try a different search term</p>
        </div>
      `;
      this.updateSaveButtonVisibility();
      return;
    }

    // Display fetched videos with delete buttons (no checkboxes)
    container.innerHTML = videos.map((video, index) => `
      <div class="video-card" data-video-id="${video.id}">
        <div class="video-thumbnail">
          <img src="${this.getThumbnailUrl(video.thumbnails)}" alt="${this.escapeHtml(video.title)}">
          <span class="duration-badge">${this.formatDuration(video.duration)}</span>
          <button class="video-delete-icon btn-delete-fetched" data-index="${index}" title="Delete video">🗑️</button>
        </div>
        <div class="video-info">
          <h3 class="video-title">${video.title}</h3>
          <p class="video-meta">📖 ${video.channel_title || 'Unknown Channel'}</p>
          <p class="video-meta" style="color: #ffd700; font-style: italic;">Fetched - Not Saved</p>
        </div>
      </div>
    `).join('');

    // Bind delete buttons for fetched videos
    container.querySelectorAll('.btn-delete-fetched').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index);
        this.deleteFetchedVideo(index);
      });
    });

    // Show save button
    this.updateSaveButtonVisibility();
  }

  deleteFetchedVideo(index) {
    if (!confirm('Remove this video from the list?')) return;
    
    this.fetchedVideos.splice(index, 1);
    
    if (this.fetchedVideos.length === 0) {
      // Reload from database if no more fetched videos
      this.showSubcontentView(this.currentSubcontentId);
    } else {
      this.displayFetchedVideos(this.fetchedVideos);
    }
  }

  async saveFetchedVideos() {
    if (!this.fetchedVideos || this.fetchedVideos.length === 0) {
      alert('No videos to save');
      return;
    }

    if (!confirm(`Save ${this.fetchedVideos.length} videos to this subcontent?`)) {
      return;
    }

    try {
      window.showToast('Saving videos...', 'info');
      
      // Resolve grade hierarchy from subcontent
      let gradeId = null;
      let subjectId = null;
      let contentId = null;
      
      if (window.sidebarCRUD && window.sidebarCRUD.data) {
        const sc = window.sidebarCRUD.data.subcontents.find(s => s.id === this.currentSubcontentId);
        if (sc) {
          contentId = sc.content_id;
          
          // Find subject
          if (window.sidebarCRUD.data.contents) {
            const content = window.sidebarCRUD.data.contents.find(c => c.id === contentId);
            if (content) {
              subjectId = content.subject_id;
              
              // Find grade
              if (window.sidebarCRUD.data.subjects) {
                const subject = window.sidebarCRUD.data.subjects.find(s => s.id === subjectId);
                if (subject) {
                  gradeId = subject.grade_id;
                }
              }
            }
          }
        }
      }
      
      // Transform fetched videos to correct format for backend
      const videosToSave = this.fetchedVideos.map(video => ({
        id: video.videoId || video.id,
        title: video.title,
        channel_title: video.channelTitle || video.channel_title,
        thumbnails: video.thumbnails,
        published_at: video.publishedAt || video.published_at,
        channel_id: video.channelId || video.channel_id,
        type: video.type || 'curricular',
        duration: video.duration,
        view_count: video.viewCount || video.view_count
      }));
      
      // Save videos with full grade hierarchy
      await window.adminServices.addVideosBulk(
        this.currentSubcontentId,
        videosToSave,
        gradeId,
        subjectId,
        contentId
      );
      
      window.showToast(`Saved ${this.fetchedVideos.length} videos successfully`, 'success');
      
      // Clear fetched videos and reload from database
      this.fetchedVideos = [];
      await this.showSubcontentView(this.currentSubcontentId);
      
    } catch (error) {
      console.error('Failed to save videos:', error);
      alert('Failed to save videos: ' + error.message);
    }
  }

  updateSaveButtonVisibility() {
    const saveBtn = document.getElementById('saveFetchedVideosBtn');
    if (saveBtn) {
      if (this.fetchedVideos && this.fetchedVideos.length > 0) {
        saveBtn.style.display = 'inline-block';
      } else {
        saveBtn.style.display = 'none';
      }
    }
  }
}

// Export singleton instance
window.videoListAdmin = new VideoListAdmin();