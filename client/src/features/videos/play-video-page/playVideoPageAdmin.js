// Play Video Page - Admin delete functionality
import { removeVideoById } from "../../admin/delete/deleteServices.js";

document.addEventListener('DOMContentLoaded', function() {
  const deleteBtn = document.getElementById('deleteVideoBtn');
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      const currentVideo = JSON.parse(localStorage.getItem('currentVideo'));
      const videoSource = localStorage.getItem('videoSource');
      
      if (!currentVideo) {
        alert('No video selected');
        return;
      }

      if (!confirm(`Delete this video?\n\n"${currentVideo.title || 'Untitled'}"`)) {
        return;
      }

      const videoId = currentVideo.id || currentVideo.videoId;
      
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';

      removeVideoById(videoId)
        .then(function() {
          alert('Video deleted successfully');
          
          // Clear localStorage
          localStorage.removeItem('currentVideo');
          localStorage.removeItem('videoList');
          localStorage.removeItem('videoSource');
          
          // Go back to admin dashboard
          window.location.href = '/admin-dashboard.html';
        })
        .catch(function(error) {
          console.error('Failed to delete video:', error);
          alert('Failed to delete video: ' + (error.message || 'Unknown error'));
          deleteBtn.disabled = false;
          deleteBtn.textContent = '🗑️ Delete';
        });
    });
  }
});