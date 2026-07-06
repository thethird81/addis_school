/**
 * Report video handler — separated from iframe.js
 *
 * On report:
 * 1. Remove videoId from localStorage `videoList`
 * 2. Remove videoId from localStorage likedVideos_{profileId}
 * 3. Remove videoId from localStorage lastWatched_{profileId}
 * 4. Remove videoId from IndexedDB (both subjects and channels stores)
 * 5. POST to /api/v1/reports (add to reports table)
 * 6. DELETE to /api/v1/likes (remove from likes table)
 * 7. DELETE to /api/v1/videos/watch-history (remove from watch_histories)
 * 8. Play next video + refresh sidebar
 */

import {
  removeLikedVideo,
} from '../likes/likesLocalStore.js';
import {
  getLastWatchedVideos,
  setLastWatchedVideos,
  removeLastWatchedVideo
} from '../lastwatched/lastWatchedLocalStore.js';
import { reportVideo } from './reportsServices.js';
import { removeVideoFromAllCaches } from './reportsIndexedDB.js';
import { getBaseUrl } from '../../utils/path.js';
import { refresh } from '../../utils/sharedFunctions.js';

const BASE_URL = getBaseUrl();

/**
 * Remove from backend likes table.
 */
async function removeLikeFromBackend(profileId, videoId) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken || !profileId || !videoId) return false;

  const url = `${BASE_URL}/api/v1/likes`;

  try {
    let response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ profileId, videoId }),
    });

    if (response.status === 401) {
      const newToken = await refresh();
      if (!newToken) throw new Error('Unable to refresh token');
      response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify({ profileId, videoId }),
      });
    }

    return response.ok;
  } catch (err) {
    console.error('Error removing like from backend:', err);
    return false;
  }
}

/**
 * Remove from backend watch_history table.
 */
async function removeFromWatchHistoryBackend(profileId, videoId) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken || !profileId || !videoId) return false;

  const url = `${BASE_URL}/api/v1/videos/watch-history`;

  try {
    let response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ profileId, videoId }),
    });

    if (response.status === 401) {
      const newToken = await refresh();
      if (!newToken) throw new Error('Unable to refresh token');
      response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify({ profileId, videoId }),
      });
    }

    return response.ok;
  } catch (err) {
    console.error('Error removing watch history from backend:', err);
    return false;
  }
}

/**
 * Execute the full report pipeline.
 * @param {string} vidId - The YouTube video ID to report
 * @param {Object} profile - The activeProfile object (must have .id)
 */
export async function executeReport(vidId, profile) {
  if (!vidId || !profile || !profile.id) {
    console.error('Cannot report: missing videoId or profile.');
    return;
  }

  // 1. Remove from localStorage videoList
  var vidList = JSON.parse(localStorage.getItem('videoList')) || [];
  vidList = vidList.filter(function (v) { return v.videoId !== vidId; });
  localStorage.setItem('videoList', JSON.stringify(vidList));

  // 2. Remove from liked videos (local)
  await removeLikedVideo(profile.id, vidId);

  // 3. Remove from last watched (local) — handles both videoId and id properties
  console.log("Removing from last watched:", vidId);
  var beforeLastWatched = await getLastWatchedVideos(profile.id);
  console.log("Last watched before removal:", beforeLastWatched.length, beforeLastWatched);
  await removeLastWatchedVideo(profile.id, vidId);
  // Also try removing by id property in case objects use id instead of videoId
  var afterLastWatched = await getLastWatchedVideos(profile.id);
  if (beforeLastWatched.length === afterLastWatched.length) {
    // The dedicated function didn't catch it — manual fallback
    var lastWatched = await getLastWatchedVideos(profile.id);
    var filtered = lastWatched.filter(function (v) {
      return v.videoId !== vidId && v.id !== vidId;
    });
    if (filtered.length !== lastWatched.length) {
      console.log("Fallback removal succeeded for last watched.");
      await setLastWatchedVideos(profile.id, filtered);
    }
  }
var afterLastWatched = await getLastWatchedVideos(profile.id);
  console.log("Last watched after removal:", afterLastWatched.length, afterLastWatched);
  // 4. Remove from IndexedDB caches
  removeVideoFromAllCaches(vidId);

  // 5-7. Backend sync (fire-and-forget)
  reportVideo(profile.id, vidId);
  removeLikeFromBackend(profile.id, vidId);
  //removeFromWatchHistoryBackend(profile.id, vidId);

  // 8. Refresh sidebar and play next video
  try {
    var { getNextVideo, playVideo, checkLiked, setCurrentVideoObject } = await import('../../components/iframe/iframe.js');
    var { populateRightSidebarLazy } = await import('../../features/videos/play-video-page/playVideoPageLazyLoad.js');

    // Refresh the right sidebar
    populateRightSidebarLazy(vidList, true);

    // Play the next video
    var nextVideo = getNextVideo();
    if (nextVideo) {
      // Update currentVideoObject BEFORE playing so the PLAYING event
      // doesn't re-add the reported video to last watched
      setCurrentVideoObject(nextVideo);
      playVideo(nextVideo);
      checkLiked(nextVideo.videoId);
    } else {
      console.warn('No more videos to play after reporting.');
    }
  } catch (err) {
    console.error('Error refreshing UI after report:', err);
  }
}

/**
 * Show confirmation modal for reporting a video.
 * @param {Function} onConfirm - Callback to execute when user confirms
 */
export function showReportConfirmationModal(onConfirm) {
  var reportModal = document.getElementById('quizModal');
  var reportOverlay = document.getElementById('overlay');
  var questionText = document.getElementById('questionText');
  var answerContainer = document.getElementById('answerContainer');

  if (!reportModal || !reportOverlay || !questionText || !answerContainer) {
    console.error('Report confirmation modal elements not found.');
    return;
  }

  // Set the question text
  questionText.innerHTML =
    'Are you sure you want to report this video? It will be removed from your video list.';

  // Clear previous content from answer container
  answerContainer.innerHTML = '';

  // Create "Yes, Report" button
  var confirmButton = document.createElement('button');
  confirmButton.classList.add('btn');
  confirmButton.textContent = 'Yes, Report';
  confirmButton.style.background = '#ff4444';
  confirmButton.style.color = 'white';
  confirmButton.style.margin = '5px';

  confirmButton.addEventListener('click', function () {
    reportModal.classList.remove('active');
    reportOverlay.classList.remove('active');
    questionText.innerHTML = '';
    if (onConfirm) onConfirm();
  });

  // Create "Cancel" button
  var cancelButton = document.createElement('button');
  cancelButton.classList.add('btn');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.background = 'gray';
  cancelButton.style.color = 'white';
  cancelButton.style.margin = '5px';

  cancelButton.addEventListener('click', function () {
    reportModal.classList.remove('active');
    reportOverlay.classList.remove('active');
    questionText.innerHTML = '';
  });

  // Append buttons
  answerContainer.appendChild(confirmButton);
  answerContainer.appendChild(cancelButton);

  // Show the modal
  reportModal.classList.add('active');
  reportOverlay.classList.add('active');
}

/**
 * Initialize the report button with its click handler.
 * Call this once when the page loads.
 */
export function initReportButton() {
  var reportBtn = document.querySelector('.report-btn');
  var accessToken = localStorage.getItem('accessToken');
  var menuDropdown = document.querySelector('.video-menu .menu-dropdown');

  if (!reportBtn) {
    console.warn('Report button not found in DOM.');
    return;
  }

  // Show the report button only if user is logged in
  if (accessToken) {
    reportBtn.style.display = 'block';
  }

  reportBtn.addEventListener('click', function () {
    var profile = JSON.parse(localStorage.getItem('activeProfile'));
    if (!profile || !profile.id || !accessToken) {
      console.warn('Cannot report: no active profile or access token.');
      return;
    }

    // Close the menu dropdown
    if (menuDropdown) {
      menuDropdown.classList.remove('open');
    }

    var vidId = localStorage.getItem('videoId');

    // Show confirmation modal
    showReportConfirmationModal(function () {
      // User confirmed — execute the report
      executeReport(vidId, profile);
    });
  });
}