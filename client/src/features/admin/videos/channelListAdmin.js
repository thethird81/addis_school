// Channel List Admin - Channel cards with filters and bulk operations
class ChannelListAdmin {
  constructor() {
    this.channels = [];
    this.selectedChannels = new Set();
    this.currentChannelId = null;
    this.currentChannelVideos = [];
    
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Back button
    const backBtn = document.getElementById('backToChannels');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.showChannelsView());
    }

    // Filter by name
    const nameFilter = document.getElementById('channelNameFilter');
    if (nameFilter) {
      nameFilter.addEventListener('input', (e) => this.filterChannels());
    }

    // Filter by grade
    const gradeFilter = document.getElementById('channelGradeFilter');
    if (gradeFilter) {
      gradeFilter.addEventListener('change', async (e) => {
        await this.updateRemoveButtonVisibility();
        this.filterChannels();
      });
    }

    // Remove selected button
    const removeBtn = document.getElementById('removeSelectedChannelsBtn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => this.removeSelectedChannelsFromGrade());
    }
  }

  async showChannelsView() {
    this.selectedChannels.clear();
    this.currentChannelId = null;
    
    try {
      this.channels = await window.adminServices.getChannels();
      await this.populateGradeFilter();
      this.renderChannelGrid();
      this.showView('channels-view');
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  }

  async populateGradeFilter() {
    const gradeFilter = document.getElementById('channelGradeFilter');
    if (!gradeFilter) return;

    try {
      const tree = await window.adminServices.getFullTree();
      // Clear existing options except "All Grades"
      gradeFilter.innerHTML = '<option value="">All Grades</option>';
      
      // Add grade options
      tree.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade.id;
        option.textContent = grade.name;
        gradeFilter.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load grades for filter:', error);
    }
  }

  async updateRemoveButtonVisibility() {
    const gradeFilter = document.getElementById('channelGradeFilter');
    const removeBtn = document.getElementById('removeSelectedChannelsBtn');
    
    if (removeBtn && gradeFilter) {
      if (gradeFilter.value) {
        removeBtn.style.display = 'inline-block';
      } else {
        removeBtn.style.display = 'none';
      }
    }
  }

  async removeSelectedChannelsFromGrade() {
    const gradeFilter = document.getElementById('channelGradeFilter');
    const selectedGradeId = gradeFilter ? gradeFilter.value : '';
    
    if (!selectedGradeId) {
      window.showToast('Please select a grade first', 'error');
      return;
    }

    const checkboxes = document.querySelectorAll('#channelGrid .channel-checkbox:checked');
    if (checkboxes.length === 0) {
      window.showToast('Please select at least one channel to remove', 'error');
      return;
    }

    const channelIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-channel-id'));

    if (!confirm(`Remove ${channelIds.length} channel(s) from this grade?`)) return;

    try {
      const removePromises = channelIds.map(channelId => 
        window.adminServices.removeChannelFromGrade(selectedGradeId, channelId)
      );

      await Promise.all(removePromises);
      window.showToast(`${channelIds.length} channel(s) removed from grade`, 'success');
      await this.showChannelsView();
    } catch (error) {
      window.showToast('Failed to remove channels: ' + error.message, 'error');
    }
  }

  async filterChannels() {
    const nameFilter = document.getElementById('channelNameFilter');
    const gradeFilter = document.getElementById('channelGradeFilter');
    
    const nameQuery = nameFilter ? nameFilter.value.toLowerCase().trim() : '';
    const gradeId = gradeFilter ? gradeFilter.value : '';

    let filteredChannels = this.channels;

    // If grade filter is selected, fetch channels assigned to that grade
    if (gradeId) {
      try {
        const channelsByGrade = await window.adminServices.getChannelsByGrade(gradeId);
        // Create a set of channel IDs assigned to this grade
        const assignedChannelIds = new Set(channelsByGrade.map(ch => ch.id));
        // Filter channels to only those assigned to this grade
        filteredChannels = this.channels.filter(channel => 
          assignedChannelIds.has(channel.id)
        );
      } catch (error) {
        console.error('Failed to filter channels by grade:', error);
        // Fallback to showing all channels if grade filter fails
        filteredChannels = this.channels;
      }
    }

    // Filter by name
    if (nameQuery) {
      filteredChannels = filteredChannels.filter(channel => 
        channel.name.toLowerCase().includes(nameQuery)
      );
    }

    this.renderChannelGrid(filteredChannels);
  }

  renderChannelGrid(channelsToRender = null) {
    const container = document.getElementById('channelGrid');
    if (!container) return;

    const channels = channelsToRender || this.channels;

    if (channels.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📺</div>
          <h2>No Channels Found</h2>
          <p>Channels will appear here when videos are assigned</p>
        </div>
      `;
      return;
    }

    container.innerHTML = channels.map(channel => `
      <div class="channel-card" data-channel-id="${channel.id}">
        <div class="checkbox-wrapper">
          <input type="checkbox" class="channel-checkbox" data-channel-id="${channel.id}">
        </div>
        <div class="channel-thumbnail">
          <img src="${this.getThumbnailUrl(channel.thumbnail_url)}" alt="${channel.name}">
        </div>
        <div class="channel-info">
          <h3 class="channel-name">${this.escapeHtml(channel.name)}</h3>
          <span class="tree-badge">${channel.video_count || 0} videos</span>
          <div class="channel-actions">
            <button class="btn-channel-action btn-assign-channel" data-channel-id="${channel.id}" data-channel-name="${this.escapeHtml(channel.name)}" title="Assign to curriculum">🔗 Assign</button>
            <button class="btn-channel-action btn-view-videos" data-channel-id="${channel.id}" data-channel-name="${this.escapeHtml(channel.name)}" title="Fetch videos">📥</button>
            <button class="btn-channel-action btn-edit-channel" data-channel-id="${channel.id}" data-channel-name="${this.escapeHtml(channel.name)}" title="Edit channel">✏️</button>
            <button class="btn-channel-action btn-delete-channel" data-channel-id="${channel.id}" data-channel-name="${this.escapeHtml(channel.name)}" title="Delete channel">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');

    // Bind checkbox events
    container.querySelectorAll('.channel-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const channelId = e.target.dataset.channelId;
        if (e.target.checked) {
          this.selectedChannels.add(channelId);
        } else {
          this.selectedChannels.delete(channelId);
        }
      });
    });

    // Bind card click to view channel videos
    container.querySelectorAll('.channel-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking checkbox or action buttons
        if (e.target.classList.contains('channel-checkbox')) return;
        if (e.target.closest('.btn-channel-action')) {
          const actionBtn = e.target.closest('.btn-channel-action');
          const action = actionBtn.dataset.action || 
                        (actionBtn.classList.contains('btn-assign-channel') ? 'assign' :
                         actionBtn.classList.contains('btn-view-videos') ? 'view' : 
                         actionBtn.classList.contains('btn-edit-channel') ? 'edit' : 'delete');
          const channelId = actionBtn.dataset.channelId;
          const channelName = actionBtn.dataset.channelName;
          
          if (action === 'assign') {
            this.showAssignModal(channelId, channelName);
          } else if (action === 'view') {
            this.showChannelVideos(channelId);
          } else if (action === 'edit') {
            this.editChannel(channelId, channelName);
          } else if (action === 'delete') {
            this.deleteChannel(channelId, channelName);
          }
          return;
        }
        
        const channelId = card.dataset.channelId;
        this.showChannelVideos(channelId);
      });
    });
  }

  async showChannelVideos(channelId) {
    this.currentChannelId = channelId;
    
    try {
      const videos = await window.adminServices.getChannelVideos(channelId);
      this.currentChannelVideos = videos;
      const channel = this.channels.find(c => c.id === channelId);
      
      document.getElementById('channelVideosTitle').textContent = 
        `Videos from: ${channel?.name || 'Unknown Channel'}`;
      
      this.renderChannelVideos(videos);
      this.showView('channel-videos-view');
    } catch (error) {
      console.error('Failed to load channel videos:', error);
    }
  }

  renderChannelVideos(videos) {
    const container = document.getElementById('channelVideoGrid');
    if (!container) return;

    if (videos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📹</div>
          <h2>No Videos</h2>
          <p>This channel has no videos</p>
        </div>
      `;
      return;
    }

    container.innerHTML = videos.map(video => `
      <div class="video-card" data-video-id="${video.id}">
        <div class="checkbox-wrapper">
          <input type="checkbox" class="video-checkbox" data-video-id="${video.id}">
        </div>
        <div class="video-thumbnail">
          <img src="${this.getThumbnailUrl(video.thumbnails)}" alt="${this.escapeHtml(video.title)}">
          <span class="duration-badge">${this.formatDuration(video.duration)}</span>
          <button class="video-delete-icon" data-video-id="${video.id}" data-channel-id="${this.currentChannelId}" title="Delete video">🗑️</button>
        </div>
        <div class="video-info">
          <h3 class="video-title">${this.escapeHtml(video.title)}</h3>
          <p class="video-meta">📖 ${video.channel_title || 'Unknown Channel'}</p>
        </div>
      </div>
    `).join('');

    // Bind video card clicks to open player modal
    container.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking checkbox or delete icon
        if (e.target.classList.contains('video-checkbox')) return;
        if (e.target.classList.contains('video-delete-icon')) return;
        
        const videoId = card.dataset.videoId;
        const video = videos.find(v => v.id === videoId || v.videoId === videoId);
        if (video) {
          this.openVideoPlayerModal(video, videos);
        }
      });
    });

    // Bind delete icon events
    container.querySelectorAll('.video-delete-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = e.target.dataset.videoId;
        const channelId = e.target.dataset.channelId;
        if (!confirm('Delete this video?')) return;
        this.deleteVideoFromChannel(videoId, channelId);
      });
    });

    // Bind checkbox events
    container.querySelectorAll('.video-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const videoId = e.target.dataset.videoId;
        if (e.target.checked) {
          this.selectedVideos.add(videoId);
        } else {
          this.selectedVideos.delete(videoId);
        }
      });
    });
  }

  openVideoPlayerModal(video, allVideos) {
    const modal = document.getElementById('videoPlayerModal');
    const title = document.getElementById('videoPlayerTitle');
    const playerContainer = document.getElementById('videoPlayerContainer');
    
    if (!modal) return;
    
    // Set title
    if (title) title.textContent = video.title || 'Video Player';
    
    // Debug: log video object to see available fields
    console.log('Opening channel video modal:', video);
    
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
    this.currentChannelId = this.currentChannelId;
    
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

  async deleteVideoFromChannel(videoId, channelId) {
    if (!confirm('Delete this video from the channel?')) return;

    try {
      await window.adminServices.deleteVideosBulk([videoId]);
      window.showToast('Video deleted', 'success');
      
      // Reload channel videos
      await this.showChannelVideos(channelId);
      
      // Also reload channels list to update counts
      await this.showChannelsView();
    } catch (error) {
      window.showToast('Failed to delete video: ' + error.message, 'error');
    }
  }

  async editChannel(channelId, currentName) {
    const newName = prompt('Edit channel name:', currentName);
    if (!newName || newName === currentName) return;

    try {
      await window.adminServices.updateChannel(channelId, { name: newName });
      window.showToast('Channel updated', 'success');
      await this.showChannelsView();
    } catch (error) {
      window.showToast('Failed to update channel: ' + error.message, 'error');
    }
  }

  async deleteChannel(channelId, channelName) {
    if (!confirm(`Delete channel "${channelName}"? This will remove all channel assignments.`)) return;

    try {
      await window.adminServices.deleteChannel(channelId);
      window.showToast('Channel deleted', 'success');
      await this.showChannelsView();
    } catch (error) {
      window.showToast('Failed to delete channel: ' + error.message, 'error');
    }
  }

  async showAssignModal(channelId, channelName) {
    this.assigningChannelId = channelId;
    this.assigningChannelName = channelName;
    
    const modal = document.getElementById('assignChannelModal');
    const title = document.getElementById('assignChannelTitle');
    const info = document.getElementById('assignChannelInfo');
    
    if (!modal) return;
    
    if (title) title.textContent = `Assign Channel: ${channelName}`;
    if (info) info.textContent = `Assigning channel: ${channelName}`;
    
    // Set the selected channel for assignmentDashboard
    if (window.assignmentDashboard) {
      window.assignmentDashboard.selectedChannelId = channelId;
    }
    
    // Load grades and show modal
    if (window.assignmentDashboard && window.assignmentDashboard.loadAssignChannelGrades) {
      window.assignmentDashboard.loadAssignChannelGrades();
    }
    
    modal.style.display = 'flex';
  }



  getThumbnailUrl(thumbnailUrl) {
    if (!thumbnailUrl) return 'https://via.placeholder.com/300x169/650184/ffffff?text=Channel';
    
    // If it's a JSON object, extract URL
    if (typeof thumbnailUrl === 'object') {
      // Direct url property (channel format)
      if (thumbnailUrl.url) return thumbnailUrl.url;
      
      // YouTube video format: {high: "url", medium: "url", default: "url"}
      if (thumbnailUrl.high) return thumbnailUrl.high;
      if (thumbnailUrl.medium) return thumbnailUrl.medium;
      if (thumbnailUrl.default) return thumbnailUrl.default;
      if (thumbnailUrl.default_) return thumbnailUrl.default_;
    }
    
    // If it's already a string
    if (typeof thumbnailUrl === 'string') return thumbnailUrl;
    
    return 'https://via.placeholder.com/300x169/650184/ffffff?text=Channel';
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

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance
window.channelListAdmin = new ChannelListAdmin();