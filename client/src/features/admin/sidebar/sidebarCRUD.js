// Sidebar CRUD - Tree management for grades/subjects/contents/subcontents
class SidebarCRUD {
  constructor() {
    this.currentGrade = null;
    this.currentSubject = null;
    this.currentContent = null;
    this.currentSubcontent = null;
    this.data = {
      grades: [],
      subjects: [],
      contents: [],
      subcontents: []
    };
    
    this.init();
  }

  init() {
    this.loadData();
    this.bindEvents();
  }

  bindEvents() {
    // Close sidebar button
    const closeBtn = document.getElementById('sidebarClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeSidebar());
    }

    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Sidebar content click events (delegation)
    const sidebarContent = document.getElementById('sidebarContent');
    if (sidebarContent) {
      sidebarContent.addEventListener('click', (e) => this.handleSidebarClick(e));
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    
    sidebar.classList.toggle('active');
    menuToggle.classList.toggle('active');
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    
    sidebar.classList.remove('active');
    menuToggle.classList.remove('active');
  }

  async loadData() {
    try {
      this.data.grades = await window.adminServices.getGrades();
      this.renderSidebar();
    } catch (error) {
      console.error('Failed to load sidebar data:', error);
    }
  }

  handleSidebarClick(e) {
    const target = e.target;
    
    // Handle tree item clicks
    if (target.closest('.tree-item-header')) {
      const header = target.closest('.tree-item-header');
      
      // Check if clicking action buttons
      if (target.closest('.btn-tree-action')) {
        const action = target.closest('.btn-tree-action').dataset.action;
        const id = target.closest('.tree-item-wrapper').dataset.id;
        const type = target.closest('.tree-item-wrapper').dataset.type;
        
        if (action === 'edit') {
          this.openEditModal(type, id);
        } else if (action === 'delete') {
          this.deleteItem(type, id);
        }
        return;
      }
      
      // Check if clicking video delete button
      if (target.closest('.tree-video-delete')) {
        const videoId = target.closest('.tree-video-delete').dataset.videoId;
        this.deleteVideo(videoId);
        return;
      }
      
      // Navigate to item
      this.selectItem(header);
    }

    // Handle save/cancel buttons
    if (target.closest('.btn-save-tree')) {
      const input = target.closest('.tree-item-input-group, .tree-add-input').querySelector('.tree-input');
      this.saveNewItem(input.value);
    }

    if (target.closest('.btn-cancel-tree')) {
      this.renderSidebar();
    }

    // Handle channels/reported sections
    if (target.closest('.tree-channels-header')) {
      this.showChannels();
    }

    if (target.closest('.tree-reported-header')) {
      this.showReportedVideos();
    }
  }

  selectItem(header) {
    const wrapper = header.closest('.tree-item-wrapper');
    const type = wrapper.dataset.type;
    const id = wrapper.dataset.id;

    // Remove previous selection
    document.querySelectorAll('.tree-item-wrapper').forEach(el => {
      el.classList.remove('selected');
    });

    // Add selection
    wrapper.classList.add('selected');

    // Navigate based on type
    switch(type) {
      case 'grade':
        this.selectGrade(id);
        break;
      case 'subject':
        this.selectSubject(id);
        break;
      case 'content':
        this.selectContent(id);
        break;
      case 'subcontent':
        this.selectSubcontent(id);
        break;
    }
  }

  async selectGrade(gradeId) {
    this.currentGrade = this.data.grades.find(g => g.id === gradeId);
    this.currentSubject = null;
    this.currentContent = null;
    this.currentSubcontent = null;
    
    // Load subjects for this grade
    this.data.subjects = await window.adminServices.getSubjects(gradeId);
    this.renderSidebar();
  }

  async selectSubject(subjectId) {
    this.currentSubject = this.data.subjects.find(s => s.id === subjectId);
    this.currentContent = null;
    this.currentSubcontent = null;
    
    // Load contents for this subject
    this.data.contents = await window.adminServices.getContents(subjectId);
    this.renderSidebar();
  }

  async selectContent(contentId) {
    this.currentContent = this.data.contents.find(c => c.id === contentId);
    this.currentSubcontent = null;
    
    // Load subcontents for this content
    this.data.subcontents = await window.adminServices.getSubcontents(contentId);
    this.renderSidebar();
  }

  async selectSubcontent(subcontentId) {
    this.currentSubcontent = this.data.subcontents.find(s => s.id === subcontentId);
    this.renderSidebar();
    
    // Load and show videos inline in sidebar
    await this.loadSubcontentVideos(subcontentId);
    
    // Also show in main view
    window.videoListAdmin.showSubcontentView(subcontentId);
  }

  async loadSubcontentVideos(subcontentId) {
    try {
      const videos = await window.adminServices.getVideos(subcontentId);
      this.renderInlineVideos(videos);
    } catch (error) {
      console.error('Failed to load subcontent videos:', error);
    }
  }

  renderInlineVideos(videos) {
    // Remove existing video list if any
    const existingList = document.querySelector('.tree-video-list');
    if (existingList) {
      existingList.remove();
    }

    // Find the selected subcontent wrapper
    const selectedWrapper = document.querySelector('.tree-item-wrapper.selected');
    if (!selectedWrapper) return;

    // Create video list container
    const videoList = document.createElement('div');
    videoList.className = 'tree-video-list';

    if (!videos || videos.length === 0) {
      videoList.innerHTML = '<div class="tree-video-item" style="color: #aaa; font-style: italic;">No videos</div>';
    } else {
      // Show max 5 videos inline
      const displayVideos = videos.slice(0, 5);
      
      displayVideos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.className = 'tree-video-item';
        videoItem.innerHTML = `
          <span class="tree-video-title" title="${this.escapeHtml(video.title)}">${this.escapeHtml(video.title.substring(0, 30))}${video.title.length > 30 ? '...' : ''}</span>
          <button class="tree-video-delete" data-video-id="${video.id}" title="Delete video">✕</button>
        `;
        videoList.appendChild(videoItem);
      });

      if (videos.length > 5) {
        const moreItem = document.createElement('div');
        moreItem.className = 'tree-video-item';
        moreItem.style.color = '#ffd700';
        moreItem.style.fontStyle = 'italic';
        moreItem.textContent = `+${videos.length - 5} more videos`;
        videoList.appendChild(moreItem);
      }
    }

    // Insert after the selected subcontent header
    const subcontentHeader = selectedWrapper.querySelector('.tree-item-header');
    if (subcontentHeader) {
      subcontentHeader.after(videoList);
    }
  }

  async deleteVideo(videoId) {
    if (!confirm('Delete this video?')) return;

    try {
      await window.adminServices.deleteVideosBulk([videoId]);
      window.showToast('Video deleted', 'success');
      
      // Reload videos if subcontent is selected
      if (this.currentSubcontent) {
        await this.loadSubcontentVideos(this.currentSubcontent.id);
        // Also reload main view
        if (window.videoListAdmin && window.videoListAdmin.currentSubcontentId) {
          window.videoListAdmin.showSubcontentView(window.videoListAdmin.currentSubcontentId);
        }
      }
    } catch (error) {
      window.showToast('Failed to delete video: ' + error.message, 'error');
    }
  }

  showChannels() {
    window.channelListAdmin.showChannelsView();
  }

  showReportedVideos() {
    window.reportedVideos.showReportedView();
  }

  renderSidebar() {
    const sidebarContent = document.getElementById('sidebarContent');
    
    let html = `
      <!-- Grades Section -->
      <div class="tree-section">
        ${this.data.grades.map(grade => `
          <div class="tree-item-wrapper ${this.currentGrade?.id === grade.id ? 'selected' : ''}" 
               data-id="${grade.id}" 
               data-type="grade">
            ${this.isEditing('grade', grade.id) ? `
              <div class="tree-item-input-group">
                <span class="tree-icon">📊</span>
                <input type="text" class="tree-input" value="${this.escapeHtml(grade.name)}" placeholder="Grade name...">
                <button class="btn-save-tree">💾</button>
                <button class="btn-cancel-tree">✕</button>
              </div>
            ` : `
              <div class="tree-item-header">
                <span class="tree-icon">📊</span>
                <span class="tree-label">${this.escapeHtml(grade.name)}</span>
                <div class="tree-actions">
                  <button class="btn-tree-action" data-action="edit" title="Edit">✏️</button>
                  <button class="btn-tree-action" data-action="delete" title="Delete">🗑️</button>
                </div>
              </div>
            `}
            
            ${this.currentGrade?.id === grade.id ? `
              <div class="tree-children">
                <!-- Add Subject Button -->
                <div class="tree-add-input">
                  <span class="tree-icon">➕</span>
                  <input type="text" class="tree-input" placeholder="New subject name...">
                  <button class="btn-save-tree">💾</button>
                  <button class="btn-cancel-tree">✕</button>
                </div>
                
                ${grade.channels && grade.channels.length > 0 ? `
                  <div class="tree-channels-list">
                    ${grade.channels.map(channel => `
                      <div class="tree-item-wrapper" 
                           data-id="${channel.channelId}" 
                           data-type="channel"
                           data-channel-id="${channel.channelId}">
                        <div class="tree-item-header">
                          <span class="tree-icon">📺</span>
                          <span class="tree-label">${channel.channelName}</span>
                          <span class="tree-badge">${channel.videoCount || 0} videos</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${this.data.subjects.map(subject => `
                  <div class="tree-item-wrapper ${this.currentSubject?.id === subject.id ? 'selected' : ''}" 
                       data-id="${subject.id}" 
                       data-type="subject">
                    <div class="tree-item-header">
                      <span class="tree-icon">📚</span>
                      <span class="tree-label">${subject.name}</span>
                      <div class="tree-actions">
                        <button class="btn-tree-action" data-action="edit" title="Edit">✏️</button>
                        <button class="btn-tree-action" data-action="delete" title="Delete">🗑️</button>
                      </div>
                    </div>
                    
                    ${this.currentSubject?.id === subject.id ? `
                      <div class="tree-children">
                        <!-- Subject Channels -->
                        ${subject.channels && subject.channels.length > 0 ? `
                          <div class="tree-channels-list">
                            ${subject.channels.map(channel => `
                              <div class="tree-item-wrapper" 
                                   data-id="${channel.channelId}" 
                                   data-type="channel"
                                   data-channel-id="${channel.channelId}">
                                <div class="tree-item-header">
                                  <span class="tree-icon">📺</span>
                                  <span class="tree-label">${channel.channelName}</span>
                                  <span class="tree-badge">${channel.videoCount || 0} videos</span>
                                </div>
                              </div>
                            `).join('')}
                          </div>
                        ` : ''}
                        
                        <!-- Add Content Button -->
                        <div class="tree-add-input">
                          <span class="tree-icon">➕</span>
                          <input type="text" class="tree-input" placeholder="New content name...">
                          <button class="btn-save-tree">💾</button>
                          <button class="btn-cancel-tree">✕</button>
                        </div>
                        
                        ${this.data.contents.map(content => `
                          <div class="tree-item-wrapper ${this.currentContent?.id === content.id ? 'selected' : ''}" 
                               data-id="${content.id}" 
                               data-type="content">
                            <div class="tree-item-header">
                              <span class="tree-icon">📄</span>
                              <span class="tree-label">${content.name}</span>
                              <div class="tree-actions">
                                <button class="btn-tree-action" data-action="edit" title="Edit">✏️</button>
                                <button class="btn-tree-action" data-action="delete" title="Delete">🗑️</button>
                              </div>
                            </div>
                            
                            ${this.currentContent?.id === content.id ? `
                              <div class="tree-children">
                                <!-- Add Subcontent Button -->
                                <div class="tree-add-input">
                                  <span class="tree-icon">➕</span>
                                  <input type="text" class="tree-input" placeholder="New subcontent name...">
                                  <button class="btn-save-tree">💾</button>
                                  <button class="btn-cancel-tree">✕</button>
                                </div>
                                
                                ${this.data.subcontents.map(subcontent => `
                                  <div class="tree-item-wrapper ${this.currentSubcontent?.id === subcontent.id ? 'selected' : ''}" 
                                       data-id="${subcontent.id}" 
                                       data-type="subcontent">
                                    <div class="tree-item-header">
                                      <span class="tree-icon">📝</span>
                                      <span class="tree-label">${subcontent.name}</span>
                                      <span class="tree-badge">${subcontent.videoCount || 0} videos</span>
                                      <div class="tree-actions">
                                        <button class="btn-tree-action" data-action="edit" title="Edit">✏️</button>
                                        <button class="btn-tree-action" data-action="delete" title="Delete">🗑️</button>
                                      </div>
                                    </div>
                                  </div>
                                `).join('')}
                              </div>
                            ` : ''}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <!-- Add Grade Button -->
        <div class="tree-add-input">
          <span class="tree-icon">➕</span>
          <input type="text" class="tree-input" placeholder="New grade name...">
          <button class="btn-save-tree">💾</button>
          <button class="btn-cancel-tree">✕</button>
        </div>
      </div>

      <!-- Channels Section -->
      <div class="tree-section">
        <div class="tree-item-wrapper">
          <div class="tree-item-header tree-channels-header">
            <span class="tree-icon">📺</span>
            <span class="tree-label">Channels</span>
            <span class="tree-badge">Manage</span>
          </div>
        </div>
      </div>

      <!-- Reported Videos Section -->
      <div class="tree-section">
        <div class="tree-item-wrapper">
          <div class="tree-item-header tree-reported-header">
            <span class="tree-icon">⚠️</span>
            <span class="tree-label">Reported Videos</span>
            <span class="tree-badge badge-warning" id="reportedCount">0</span>
          </div>
        </div>
      </div>
    `;
    
    sidebarContent.innerHTML = html;
  }

  isEditing(type, id) {
    // Add logic for edit mode if needed
    return false;
  }

  async saveNewItem(name) {
    try {
      if (!name.trim()) return;

      // Determine what we're saving based on current selection
      if (!this.currentGrade) {
        // Save new grade
        await window.adminServices.createGrade(name);
      } else if (!this.currentSubject) {
        // Save new subject
        await window.adminServices.createSubject(this.currentGrade.id, name);
      } else if (!this.currentContent) {
        // Save new content
        await window.adminServices.createContent(this.currentSubject.id, name);
      } else if (!this.currentSubcontent) {
        // Save new subcontent
        await window.adminServices.createSubcontent(this.currentContent.id, name);
      }

      // Reload data
      await this.loadData();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save: ' + error.message);
    }
  }

  openEditModal(type, id) {
    // This will be handled by editModal module
    if (window.editModal) {
      window.editModal.open(type, id);
    }
  }

  async deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      switch(type) {
        case 'grade':
          await window.adminServices.deleteGrade(id);
          this.currentGrade = null;
          break;
        case 'subject':
          await window.adminServices.deleteSubject(id);
          this.currentSubject = null;
          break;
        case 'content':
          await window.adminServices.deleteContent(id);
          this.currentContent = null;
          break;
        case 'subcontent':
          await window.adminServices.deleteSubcontent(id);
          this.currentSubcontent = null;
          break;
      }

      // Reload data
      await this.loadData();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete: ' + error.message);
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
window.sidebarCRUD = new SidebarCRUD();