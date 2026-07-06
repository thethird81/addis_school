// Edit Modal - Generic edit popup for items
class EditModal {
  constructor() {
    this.modal = document.getElementById('editModal');
    this.titleEl = document.getElementById('editModalTitle');
    this.labelEl = document.getElementById('editModalLabel');
    this.inputEl = document.getElementById('editModalInput');
    this.saveBtn = document.getElementById('editModalSave');
    this.closeBtn = this.modal.querySelector('.modal-close');
    
    this.currentType = null;
    this.currentId = null;
    
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Close button
    this.closeBtn.addEventListener('click', () => this.close());
    
    // Save button
    this.saveBtn.addEventListener('click', () => this.save());
    
    // Enter key to save
    this.inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.save();
      }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'flex') {
        this.close();
      }
    });
  }

  open(type, id) {
    this.currentType = type;
    this.currentId = id;
    
    // Find the item name
    const item = this.findItem(type, id);
    if (!item) {
      alert('Item not found');
      return;
    }
    
    // Set modal content
    this.titleEl.textContent = `Edit ${this.getTypeLabel(type)}`;
    this.labelEl.textContent = `${this.getTypeLabel(type)} Name:`;
    this.inputEl.value = item.name;
    
    // Show modal
    this.modal.style.display = 'flex';
    this.inputEl.focus();
    this.inputEl.select();
  }

  close() {
    this.modal.style.display = 'none';
    this.currentType = null;
    this.currentId = null;
  }

  findItem(type, id) {
    switch(type) {
      case 'grade':
        return window.sidebarCRUD.data.grades.find(g => g.id === id);
      case 'subject':
        return window.sidebarCRUD.data.subjects.find(s => s.id === id);
      case 'content':
        return window.sidebarCRUD.data.contents.find(c => c.id === id);
      case 'subcontent':
        return window.sidebarCRUD.data.subcontents.find(s => s.id === id);
      default:
        return null;
    }
  }

  getTypeLabel(type) {
    const labels = {
      grade: 'Grade',
      subject: 'Subject',
      content: 'Content',
      subcontent: 'Subcontent'
    };
    return labels[type] || 'Item';
  }

  async save() {
    const newName = this.inputEl.value.trim();
    
    if (!newName) {
      alert('Please enter a name');
      return;
    }

    try {
      switch(this.currentType) {
        case 'grade':
          await window.adminServices.updateGrade(this.currentId, newName);
          break;
        case 'subject':
          await window.adminServices.updateSubject(this.currentId, newName);
          break;
        case 'content':
          await window.adminServices.updateContent(this.currentId, newName);
          break;
        case 'subcontent':
          await window.adminServices.updateSubcontent(this.currentId, newName);
          break;
      }

      // Reload sidebar data
      await window.sidebarCRUD.loadData();
      
      // Close modal
      this.close();
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update: ' + error.message);
    }
  }
}

// Export singleton instance
window.editModal = new EditModal();