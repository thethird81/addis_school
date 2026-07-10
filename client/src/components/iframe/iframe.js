'use strict';

/* ── Import custom player controls ──────────────────────────── */
import {
  loadYouTubeIframeAPI,
  initPlayer,
  updatePlayerVideo,
  destroyPlayer,
  getPlayer,
  playVideo as controlsPlayVideo,
  pauseVideo as controlsPauseVideo,
  showSkipButton,
  hideSkipButton,
} from './playerControls.js';

/* ── Rest of the module imports ─────────────────────────────── */
import '../../styles/quiz-modal.css';

import { displayQuestion } from '../../features/quiz/quiz.js';
import { updateUserField } from '../../utils/updateUserData.js';
import { getGradeName, resolveNamesFromLocator } from '../../utils/sharedFunctions.js';
import { addCoins, subtructCoins, showNotEnoughCoinsModal } from '../../features/coin/coin.js';
import { getCurrentVideoList, updateRightSidebar } from '../../features/videos/play-video-page/playVideoPageLazyLoad.js';
import { addLastWatchedVideo } from '../../features/lastwatched/lastWatchedLocalStore.js';
import { fetchLikedVideos, likeVideo as backendLikeVideo, unlikeVideo as backendUnlikeVideo } from '../../features/likes/likesServices.js';
import { getLikedVideos, setLikedVideos, addLikedVideo, removeLikedVideo, isLiked } from '../../features/likes/likesLocalStore.js';
import { initReportButton } from '../../features/reports/reportHandler.js';
import { ensureAdvertVideos, selectRandomAdvert } from '../../features/advert/advertServices.js';

/* ── DOM refs ───────────────────────────────────────────────── */
var modal = document.getElementById('quizModal');
var overlay = document.getElementById('overlay');
const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
var activeProfileId = activeProfile ? activeProfile.id : null;
const grade_id = activeProfile ? activeProfile.grade_id : null;

var videoList = JSON.parse(localStorage.getItem('videoList') || '[]');
var clickedVideo = JSON.parse(localStorage.getItem('clickedVideo') || '[]');
console.log('Clicked Video:', clickedVideo);
var videoId = clickedVideo.videoId;
localStorage.setItem('videoId', videoId);

const accessToken = localStorage.getItem('accessToken');

var favoriteBtn = document.querySelector('.favorite-btn');
var menuTrigger = document.querySelector('.video-menu .menu-trigger');
var menuDropdown = document.querySelector('.video-menu .menu-dropdown');
var currentVideoIndex = 0;
var currentQuestionIndex = 0;
var currentVideoObject = clickedVideo && clickedVideo.videoId ? clickedVideo : null;

localStorage.setItem('earnedCoin', false);

var interval = null;
var watchTime = 0;
var lastTime = 0;
var quizInterval = null;

/* ── Advert / Quiz state ────────────────────────────────────── */
let adVideoPlaying = false;           // true while an advert video is playing
let savedMainVideoId = null;          // videoId of the main video we interrupted
let savedMainSeekTime = 0;            // seek position of the main video before advert
let advertEndTimer = null;            // timeout handle for auto-ending advert
let isFirstPlayback = true;           // first video ever loaded on this page
let pendingSidebarVideo = null;       // video queued from sidebar click (play after advert)
let resumeAfterAdvertCallback = null; // called after advert ends to do custom resume

let questionTimer = null;
const COIN_CHANGE_INTERVAL = 180;     // 3 minutes
const QUIZ_INTERVAL_ENTERTAINMENT = 1 * 60 * 1000;  // 3 minutes in ms
const QUIZ_INTERVAL_OTHER = 3 * 60 * 1000;          // 10 minutes in ms

/* ── Load YouTube IFrame API ────────────────────────────────── */
loadYouTubeIframeAPI();

// Circular progress indicator before YouTube iframe fully loads
const iframeContainer = document.getElementById('youtube-player');
const progressIndicator = document.createElement('div');
progressIndicator.className = 'circular-progress';
progressIndicator.innerHTML = `
  <div class="spinner">
    <div class="double-bounce1"></div>
    <div class="double-bounce2"></div>
  </div>
`;
iframeContainer.appendChild(progressIndicator);

/* ── Fetch advert videos on page load ───────────────────────── */
(async function initAdverts() {
  if (grade_id) {
    await ensureAdvertVideos(grade_id, activeProfileId);
  }
})();

/* ── Utility: get current clickedVideo ─────────────────────── */
function getClickedVideoSubject() {
  return clickedVideo && clickedVideo.locator ? clickedVideo.locator.subject_name : null;
}

function isEntertainment() {
  return getClickedVideoSubject() === 'Entertainment';
}

function getCurrentGradeName() {
  return getGradeName(grade_id);
}

function isKG1() {
  return getCurrentGradeName() === 'KG 1';
}

/* ── Advert API: play random advert, save main video state ──── */
/* Adverts are ONLY played before the main video loads (Entertainment). */
async function playAdvert(onAdvertEnded) {
  const advert = await selectRandomAdvert(grade_id, activeProfileId);
  if (!advert) {
    console.warn('[Advert] No advert video available.');
    if (typeof onAdvertEnded === 'function') onAdvertEnded();
    return;
  }

  var p = getPlayer();
  if (!p) {
    if (typeof onAdvertEnded === 'function') onAdvertEnded();
    return;
  }

  // ── Save main video state (only if not already set by caller) ──
  if (!savedMainVideoId) {
    savedMainVideoId = localStorage.getItem('videoId');
    try { savedMainSeekTime = p.getCurrentTime() || 0; } catch (e) { savedMainSeekTime = 0; }
  }

  adVideoPlaying = true;
  resumeAfterAdvertCallback = onAdvertEnded || null;

  // ── Pause the main video ───────────────────────────────
  try { p.pauseVideo(); } catch (e) { /* ignore */ }

  console.log('[Advert] Playing advert:', advert.videoId, '(main at', savedMainSeekTime, 's)');

  // ── Load the advert ────────────────────────────────────
  p.loadVideoById(advert.videoId);

  // ── Show skip button after 5 seconds ───────────────────
  showSkipButton(function () {
    endAdvertAndResume();
  }, 10);
}

/* ── End the advert and resume the main video ────────────────── */
function endAdvertAndResume() {
  if (!adVideoPlaying) return;

  adVideoPlaying = false;
  clearTimeout(advertEndTimer);
  advertEndTimer = null;
  hideSkipButton();

  var p = getPlayer();
  if (!p) return;

  var resumeId = savedMainVideoId || videoId;
  var resumeTime = savedMainSeekTime || 0;

  console.log('[Advert] Resuming main video:', resumeId, 'at', resumeTime, 's');

  // ── Set a one-shot state-change listener to seek precisely ──
  (function (targetId, targetTime) {
    var seeked = false;
    var resumeListener = function () {
      if (seeked) return;
      var pl = getPlayer();
      if (!pl || !pl.getPlayerState || !pl.seekTo || !pl.getCurrentTime) return;
      var st = pl.getPlayerState();
      if (st === YT.PlayerState.PLAYING || st === YT.PlayerState.PAUSED) {
        pl.seekTo(targetTime, true);
        seeked = true;
        clearInterval(resumeInterval);
      }
    };
    var resumeInterval = setInterval(resumeListener, 150);
    // Safety: stop checking after 10 seconds
    setTimeout(function () { clearInterval(resumeInterval); }, 10000);
  })(resumeId, resumeTime);

  // ── Load the main video at the exact saved position ─────
  p.loadVideoById(resumeId, resumeTime);

  savedMainVideoId = null;
  savedMainSeekTime = 0;

  // Invoke the post-advert callback
  if (typeof resumeAfterAdvertCallback === 'function') {
    var cb = resumeAfterAdvertCallback;
    resumeAfterAdvertCallback = null;
    // Small delay to let the player start loading
    setTimeout(cb, 300);
  }
}

/* ── Show a quiz, pausing the main video ────────────────────── */
/* The quiz pauses the main video. The video resumes automatically */
/* when the user clicks the correct answer (see hideModal below).  */
function triggerQuiz() {
  if (isKG1()) {
    console.log('[Quiz] KG 1 grade — skipping quiz.');
    return;
  }
  if (adVideoPlaying) {
    console.log('[Quiz] Advert playing — skipping quiz.');
    return;
  }
  // const qToggle = localStorage.getItem('toggleQ') === 'true';
  // if (!qToggle) {
  //   console.log('[Quiz] Quizzes disabled (toggleQ off) — skipping.');
  //   return;
  // }
  console.log('[Quiz] Showing quiz (3-min interval).');
  // displayQuestion() calls showModal() which pauses the video.
  // If no questions are available, it returns early and the video keeps playing.
  displayQuestion();
}

/* ── Reset state when video changes ─────────────────────────── */
function resetPlaybackState() {
  if (adVideoPlaying) {
    endAdvertAndResume();
  }
  savedMainVideoId = null;
  savedMainSeekTime = 0;
  pendingSidebarVideo = null;
  // Clear all timers and reset watch time
  stopWatchTimeTracker();
  stopQuizInterval();
  watchTime = 0;
}

/* ── onYouTubeIframeAPIReady ────────────────────────────────── */
window.onYouTubeIframeAPIReady = function () {
  console.log('YouTube IFrame API is ready! ' + videoId);

  initPlayer(
    videoId,
    /* onPlayerReady callback */
    function onPlayerReady(event) {
      favoriteBtn.style.display = 'block';
      progressIndicator.remove();

      // ── First playback: if Entertainment, play advert before main video ──
      if (isFirstPlayback && isEntertainment() && accessToken) {
        isFirstPlayback = false;
        // Let the main video pause, then play advert
        setTimeout(function () {
          playAdvert(function () {
            // After advert, the quiz interval starts fresh via PLAYING state
          });
        }, 600);
      } else {
        isFirstPlayback = false;
      }

      if (!accessToken) return;

      const coins = JSON.parse(localStorage.getItem('activeProfile') || '{}').coins;
      if (coins <= 0 && isEntertainment()) {
        controlsPauseVideo();
        showNotEnoughCoinsModal();
      }
    },
    /* onStateChange callback */
    function onPlayerStateChange(event) {
      if (event.data === YT.PlayerState.ENDED) {
        // Clear all timers when main video ends
        stopWatchTimeTracker();
        stopQuizInterval();
        watchTime = 0;

        // If an advert just ended naturally, resume main
        if (adVideoPlaying) {
          endAdvertAndResume();
          return;
        }

        var nextVideo = getNextVideo();
        if (nextVideo) {
          localStorage.setItem('currentVideo', JSON.stringify(nextVideo));
          const sidebarData = JSON.parse(localStorage.getItem('sidebarData_Grade_' + grade_id) || '{}');
          const locatorName = resolveNamesFromLocator(sidebarData, nextVideo.locator);
          localStorage.setItem('videoLocatorName', JSON.stringify(locatorName));
          localStorage.setItem('videoId', nextVideo.videoId);
          console.log('Next video to play:', nextVideo);
          checkLiked(nextVideo.videoId);

          currentVideoObject = nextVideo;
          clickedVideo = nextVideo;
          localStorage.setItem('clickedVideo', JSON.stringify(nextVideo));
          resetPlaybackState();

          // If next video is Entertainment, play advert before it starts
          if (isEntertainment() && accessToken) {
            updatePlayerVideo(nextVideo.videoId);
            setTimeout(function () {
              playAdvert(function () {
                // After advert, the quiz interval starts fresh via PLAYING state
              });
            }, 500);
          } else {
            updatePlayerVideo(nextVideo.videoId);
          }
        } else {
          console.warn('No next video found.');
        }
      }

      if (event.data === YT.PlayerState.PLAYING) {
        if (accessToken && currentVideoObject && currentVideoObject.videoId) {
          addLastWatchedVideo(activeProfileId, currentVideoObject);
        }

        if (accessToken && !adVideoPlaying) {
          startWatchTimeTracker();
          // Quiz runs for all grades except KG 1
          if (!isKG1()) {
            startQuizInterval();
          }
        }
      } else if (event.data === YT.PlayerState.PAUSED) {
        // Explicitly pause timers when video is paused (for quiz/advert)
        stopWatchTimeTracker();
        stopQuizInterval();
      }
      // Note: ENDED state is handled above
    }
  );
};

/* ── Video list helpers ─────────────────────────────────────── */

export function getNextVideo() {
  if (!videoList.length) {
    videoList = getCurrentVideoList();
    if (!videoList || videoList.length === 0) {
      console.warn('No videos available in the list.');
      return null;
    }
  }
  currentVideoIndex = (currentVideoIndex + 1) % videoList.length;
  return videoList[currentVideoIndex];
}

export function showModal() {
  modal.classList.add('active');
  overlay.classList.add('active');
  controlsPauseVideo();
}

export function hideModal() {
  modal.classList.remove('active');
  overlay.classList.remove('active');
  // Resume the main video — this happens when the user clicks the correct answer.
  // The 3-minute quiz interval restarts automatically via the PLAYING state handler.
  controlsPlayVideo();
}

/* ── Watch-time tracker ─────────────────────────────────────── */

async function startWatchTimeTracker() {
  const subject = clickedVideo.locator.subject_name;
  console.log('▶️ Starting watch time tracker for subject:', subject);

  if (interval !== null) return;

  interval = setInterval(() => {
    watchTime += 1;
    if (watchTime >= COIN_CHANGE_INTERVAL) {
      handleCoinLogic(subject);
      watchTime = 0;
    }
  }, 1000);
}

function handleCoinLogic(subject) {
  if (subject !== 'Entertainment') {
    console.log('🎉 Adding coins for educational content');
    addCoins();
  } else {
    const coinCountElement = document.getElementById('coinCount');
    const coins = subtructCoins();

    if (coins >= 0) {
      console.log('💰 Subtracting coins for entertainment');
      console.log('coins after subtraction:', coins);
      updateUserField('coins', coins);
      if (coinCountElement) coinCountElement.textContent = coins;
      if (coins === 0) {
        console.log('❌ Not enough coins');
        controlsPauseVideo();
        stopWatchTimeTracker();
        showNotEnoughCoinsModal();
      }
    }
  }
}

function stopWatchTimeTracker() {
  console.log('⏸️ Stopping watch time tracker');
  clearInterval(interval);
  interval = null;
}

/* ── Dedicated quiz interval (every 3 minutes, all grades except KG 1) ─ */

function startQuizInterval() {
  if (quizInterval !== null) return;
  const subject = getClickedVideoSubject();
  const intervalMs = (subject === 'Entertainment') ? QUIZ_INTERVAL_ENTERTAINMENT : QUIZ_INTERVAL_OTHER;
  const intervalMinutes = intervalMs / 60000;
  console.log('[Quiz] Starting ' + intervalMinutes + '-minute quiz interval for subject: ' + subject);
  quizInterval = setInterval(function () {
    triggerQuiz();
  }, intervalMs);
}

function stopQuizInterval() {
  if (quizInterval !== null) {
    console.log('[Quiz] Stopping quiz interval.');
    clearInterval(quizInterval);
    quizInterval = null;
  }
}

/* ── Export setters / helpers ───────────────────────────────── */

export function setCurrentVideoObject(video) {
  currentVideoObject = video;
}

export function getSelectedPart() {
  return '';
}

/**
 * playVideo – called from sidebar clicks (playVideoPageLazyLoad.js).
 * If the clicked video is Entertainment and user is logged in, we play
 * an advert first, then start the selected video.
 */
export async function playVideo(video) {
  var id = typeof video === 'string' ? video : video.videoId;
  if (!id) {
    console.error('Invalid video ID passed to playVideo:', video);
    return;
  }

  // Update clickedVideo if this is a full video object (sidebar click)
  if (typeof video === 'object' && video.locator) {
    clickedVideo = video;
    currentVideoObject = video;
    localStorage.setItem('clickedVideo', JSON.stringify(video));

    // Ensure advert videos are available for the active profile's grade
    const profile = JSON.parse(localStorage.getItem('activeProfile'));
    if (profile && profile.grade_id) {
      await ensureAdvertVideos(profile.grade_id, profile.id);
    }
  }

  localStorage.setItem('videoId', id);

  // ── If Entertainment and logged in, play advert before the clicked video ──
  if (isEntertainment() && accessToken) {
    resetPlaybackState();
    // Save the target video as what we resume to after advert
    savedMainVideoId = id;
    savedMainSeekTime = 0;

    // Play advert, then resume with the sidebar-clicked video
    playAdvert(function () {
      // After advert, the quiz interval starts fresh via PLAYING state
    });
  } else {
    updatePlayerVideo(id);
  }
}

/*================================= likes =========================================*/

(async function syncLikesFromBackend() {
  const profile = JSON.parse(localStorage.getItem('activeProfile'));
  if (!profile || !profile.id || !accessToken) {
    console.log('No active profile or access token — skipping backend likes sync.');
    return;
  }

  const likedData = await fetchLikedVideos(profile.id);
  if (likedData && Array.isArray(likedData)) {
    const likedVideos = likedData
      .map(function (entry) { return entry.video || null; })
      .filter(Boolean);
    setLikedVideos(profile.id, likedVideos);
    console.log('Synced ' + likedVideos.length + ' liked videos from backend.');
  } else {
    console.log('No liked videos from backend — keeping local state.');
  }

  var currentVideoId = localStorage.getItem('videoId');
  if (currentVideoId) {
    checkLiked(currentVideoId);
  }
})();

favoriteBtn.addEventListener('click', function () {
  toggleLike();
});

async function toggleLike() {
  var userId = localStorage.getItem('accessToken');
  if (!userId) {
    console.error('User not logged in.');
    return;
  }

  var vidId = localStorage.getItem('videoId');
  var vidList = JSON.parse(localStorage.getItem('videoList')) || [];
  var activeProfile = JSON.parse(localStorage.getItem('activeProfile')) || {};
  var likes = await getLikedVideos(activeProfile.id);

  var video = vidList.find(function (v) { return v.videoId === vidId; });
  if (!video) {
    console.error('Video not found in the list.');
    return;
  }

  var index = likes.findIndex(function (liked) { return liked.videoId === vidId; });
  var currentlyLiked = index !== -1;

  if (currentlyLiked) {
    await removeLikedVideo(activeProfile.id, vidId);
    if (favoriteBtn) {
      favoriteBtn.innerHTML = '&#9734; Like';
      favoriteBtn.style.color = '';
    }
  } else {
    await addLikedVideo(activeProfile.id, video);
    if (favoriteBtn) {
      favoriteBtn.innerHTML = '&#9733; Like';
      favoriteBtn.style.color = 'red';
    }
  }

  if (accessToken && activeProfile && activeProfile.id) {
    var success;
    if (currentlyLiked) {
      success = await backendUnlikeVideo(activeProfile.id, vidId);
    } else {
      success = await backendLikeVideo(activeProfile.id, vidId);
    }

      if (!success) {
        console.error('Backend sync failed — reverting local state.');
        if (currentlyLiked) {
          await addLikedVideo(activeProfile.id, video);
          if (favoriteBtn) {
            favoriteBtn.innerHTML = '&#9733; Like';
            favoriteBtn.style.color = 'red';
          }
        } else {
          await removeLikedVideo(activeProfile.id, vidId);
          if (favoriteBtn) {
            favoriteBtn.innerHTML = '&#9734; Like';
            favoriteBtn.style.color = '';
          }
        }
      }
  }
}

export async function checkLiked(videoId) {
  console.log('checkLiked called with videoId:', videoId);
  var liked = await isLiked(activeProfileId, videoId);
  console.log('Current liked state:', liked);

  if (liked) {
    if (favoriteBtn) {
      favoriteBtn.innerHTML = '&#9733; Like';
      favoriteBtn.style.color = 'red';
    }
  } else {
    if (favoriteBtn) {
      favoriteBtn.innerHTML = '&#9734; Like';
      favoriteBtn.style.color = '';
    }
  }
}

/* ── Menu dropdown toggle ───────────────────────────────────── */

if (menuTrigger && menuDropdown) {
  menuTrigger.addEventListener('click', function (e) {
    e.stopPropagation();
    menuDropdown.classList.toggle('open');
  });

  document.addEventListener('click', function (e) {
    if (!menuTrigger.contains(e.target) && !menuDropdown.contains(e.target)) {
      menuDropdown.classList.remove('open');
    }
  });
}

/* ── Toggle Q checkbox ──────────────────────────────────────── */

export function initToggleQ() {
  try {
    var qToggle = document.getElementById('qToggle');
    if (!qToggle) return;

    var stored = localStorage.getItem('toggleQ');
    if (stored !== null) {
      qToggle.checked = stored === 'true';
    } else {
      qToggle.checked = false;
      localStorage.setItem('toggleQ', 'false');
    }

    qToggle.setAttribute('aria-checked', qToggle.checked ? 'true' : 'false');

    qToggle.addEventListener('change', function () {
      var isChecked = qToggle.checked;
      localStorage.setItem('toggleQ', isChecked ? 'true' : 'false');
      qToggle.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      console.log('Toggle Q changed:', isChecked);
    });
  } catch (err) {
    console.error('initToggleQ error:', err);
  }
}

/* ── Reports ────────────────────────────────────────────────── */

initToggleQ();
initReportButton();