// Fetch Video Modal - YouTube video fetching with dual fetch logic
class FetchVideoModal {
  constructor() {
    this.modal = document.getElementById('fetchModal');
    this.fetchBtn = document.getElementById('fetchBtn');
    this.addSelectedBtn = document.getElementById('addSelectedBtn');
    this.searchTermInput = document.getElementById('searchTerm');
    this.resultsContainer = document.getElementById('fetchResults');
    this.resultsGrid = document.getElementById('fetchResultsGrid');
    
    this.fetchedVideos = [];
    this.selectedFetchedVideos = new Set();
    this.isAdvert = false;
    
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Close modal
    const closeBtn = this.modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.close());
    
    // Fetch button
    this.fetchBtn.addEventListener('click', () => this.fetchVideos());
    
    // Add selected button
    this.addSelectedBtn.addEventListener('click', () => this.addSelectedVideos());
    
    // Radio button change
    const radioButtons = this.modal.querySelectorAll('input[name="videoType"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.isAdvert = e.target.value === 'advert';
      });
    });
  }

  open() {
    this.modal.style.display = 'flex';
    this.resetModal();
  }

  openForSubcontent(searchTerm, callback) {
    this.modal.style.display = 'flex';
    this.resetModal();
    this.searchTermInput.value = searchTerm;
    this.subcontentCallback = callback;
  }

  close() {
    this.modal.style.display = 'none';
  }

  resetModal() {
    this.searchTermInput.value = '';
    this.resultsContainer.style.display = 'none';
    this.resultsGrid.innerHTML = '';
    this.fetchedVideos = [];
    this.selectedFetchedVideos.clear();
    this.isAdvert = false;
    this.subcontentCallback = null;
    
    // Reset radio to curricular
    const curricularRadio = this.modal.querySelector('input[name="videoType"][value="curricular"]');
    if (curricularRadio) curricularRadio.checked = true;
  }

  async fetchVideos() {
    const searchTerm = this.searchTermInput.value.trim();
    
    if (!searchTerm) {
      alert('Please enter a search term');
      return;
    }

    this.setLoading(true);

    try {
      let videos;
      
      if (this.isAdvert) {
        // Advert mode: Fetch with duration=short filter
        videos = await window.adminServices.fetchChannelVideos(searchTerm, true);
      } else {
        // Curricular mode: Search fetch
        videos = await window.adminServices.fetchSearchVideos(searchTerm);
      }
      
      this.fetchedVideos = videos;
      this.selectedFetchedVideos.clear();
      this.renderResults(videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      alert('Failed to fetch videos: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  renderResults(videos) {
    if (videos.length === 0) {
      this.resultsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>No Videos Found</h2>
          <p>Try a different search term</p>
        </div>
      `;
    } else {
      this.resultsGrid.innerHTML = videos.map((video, index) => `
        <div class="video-card">
          <div class="checkbox-wrapper">
            <input type="checkbox" class="video-checkbox" data-video-index="${index}" checked>
          </div>
          <div class="video-thumbnail">
            <img src="${window.videoListAdmin.getThumbnailUrl(video.thumbnails)}" alt="${video.title}">
            <span class="duration-badge">${window.videoListAdmin.formatDuration(video.duration)}</span>
          </div>
          <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <p class="video-meta">📖 ${video.channel_title || 'Unknown Channel'}</p>
            <p class="video-meta">👁️ ${this.formatViewCount(video.view_count)} views</p>
          </div>
        </div>
      `).join('');

      // Bind checkbox events
      this.resultsGrid.querySelectorAll('.video-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const index = parseInt(e.target.dataset.videoIndex);
          if (e.target.checked) {
            this.selectedFetchedVideos.add(index);
          } else {
            this.selectedFetchedVideos.delete(index);
          }
        });
      });

      // Pre-select all
      videos.forEach((_, index) => this.selectedFetchedVideos.add(index));
    }

    this.resultsContainer.style.display = 'block';
    this.addSelectedBtn.disabled = this.selectedFetchedVideos.size === 0;
    this.addSelectedBtn.textContent = `Add ${this.selectedFetchedVideos.size || videos.length} Selected Videos`;
  }

  async addSelectedVideos() {
    if (this.selectedFetchedVideos.size === 0) {
      alert('Please select videos to add');
      return;
    }

    const videosToAdd = Array.from(this.selectedFetchedVideos).map(index => {
      const video = this.fetchedVideos[index];
      return {
        id: video.videoId || video.id, // Use videoId from YouTube API, fallback to id
        title: video.title,
        channel_title: video.channelTitle || video.channel_title,
        thumbnails: video.thumbnails,
        published_at: video.publishedAt || video.published_at,
        channel_id: video.channelId || video.channel_id,
        type: this.isAdvert ? 'advert' : 'curricular',
        duration: video.duration,
        view_count: video.viewCount || video.view_count
      };
    });

    // Check if this is for a subcontent (has callback) or direct add
    if (this.subcontentCallback) {
      // Return videos via callback for subcontent view
      this.subcontentCallback(videosToAdd);
      this.close();
    } else {
      // Original behavior: add directly to current subcontent
      try {
        if (window.videoListAdmin.currentSubcontentId) {
          await window.adminServices.addVideosBulk(
            window.videoListAdmin.currentSubcontentId,
            videosToAdd
          );
          
          // Refresh video list
          await window.videoListAdmin.showSubcontentView(
            window.videoListAdmin.currentSubcontentId
          );
        } else {
          alert('Please select a subcontent from the sidebar first');
        }

        this.close();
      } catch (error) {
        console.error('Failed to add videos:', error);
        alert('Failed to add videos: ' + error.message);
      }
    }
  }

  setLoading(isLoading) {
    this.fetchBtn.disabled = isLoading;
    this.fetchBtn.textContent = isLoading ? 'Fetching...' : 'Fetch Videos';
  }

  formatViewCount(views) {
    if (!views) return '0';
    
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    
    return views.toString();
  }
}

// Export singleton instance
window.fetchVideoModal = new FetchVideoModal();