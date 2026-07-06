/**
 * playerControls.js
 *
 * Handles YouTube IFrame API loading, player initialisation,
 * and a custom overlay control bar (seek bar, time display, expand).
 *
 * Play/Pause is handled via the #iframeOverlay click.
 * All other modules import the shared `player` instance and control
 * functions from here rather than touching the raw YouTube API.
 */

'use strict';

/* ── Shared state ───────────────────────────────────────────── */
let hideTimer = null;

/* ── DOM references (populated by initCustomControls) ──────── */
let seekBar = null;
let currentTimeEl = null;
let durationEl = null;
let controlsWrapper = null;
let skipAdBtn = null;
let onSkipAdCallback = null;

/* ── Internal helpers ───────────────────────────────────────── */

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + (s < 10 ? '0' + s : s);
}

function updateSeekBar() {
  var p = getPlayer();
  if (!p || !p.getCurrentTime || !seekBar) return;
  const current = p.getCurrentTime();
  const duration = p.getDuration();
  if (duration > 0) {
    seekBar.value = (current / duration) * 100;
    seekBar.max = 100;
  } else {
    seekBar.value = 0;
  }
  if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
}

function showControls() {
  if (controlsWrapper) {
    controlsWrapper.classList.add('visible');
  }
  clearTimeout(hideTimer);
}

function hideControlsAfterDelay() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(function () {
    if (controlsWrapper) {
      controlsWrapper.classList.remove('visible');
    }
  }, 3000);
}

/* ── Create the custom control bar DOM ─────────────────────── */
function createControlsBar() {
  controlsWrapper = document.createElement('div');
  controlsWrapper.className = 'custom-video-controls';
  controlsWrapper.setAttribute('aria-label', 'Video controls');

  /* ---- Top row: time display (left) + expand button (right) ---- */
  var topRow = document.createElement('div');
  topRow.className = 'ctrl-top';

  /* ---- Time display ---- */
  var timeDisplay = document.createElement('span');
  timeDisplay.className = 'ctrl-time';

  currentTimeEl = document.createElement('span');
  currentTimeEl.className = 'ctrl-time-current';
  currentTimeEl.textContent = '0:00';

  var sep = document.createElement('span');
  sep.textContent = ' / ';

  durationEl = document.createElement('span');
  durationEl.className = 'ctrl-time-duration';
  durationEl.textContent = '0:00';

  timeDisplay.appendChild(currentTimeEl);
  timeDisplay.appendChild(sep);
  timeDisplay.appendChild(durationEl);
  topRow.appendChild(timeDisplay);

  /* ---- Skip Ad button ---- */
  skipAdBtn = document.createElement('button');
  skipAdBtn.className = 'ctrl-btn ctrl-skip-ad';
  skipAdBtn.textContent = 'Skip';
  skipAdBtn.setAttribute('aria-label', 'Skip advertisement');
  skipAdBtn.title = 'Skip advertisement';
  skipAdBtn.style.display = 'none'; // hidden by default
  topRow.appendChild(skipAdBtn);

  var expandBtn = document.createElement('button');
  expandBtn.className = 'ctrl-btn ctrl-expand';
  expandBtn.innerHTML = '&#9974;'; // maximize / expand icon
  expandBtn.setAttribute('aria-label', 'Expand view');
  expandBtn.title = 'Expand view';
  topRow.appendChild(expandBtn);

  controlsWrapper.appendChild(topRow);

  /* ---- Bottom seek bar (full width) ---- */
  var bottomRow = document.createElement('div');
  bottomRow.className = 'ctrl-bottom';

  seekBar = document.createElement('input');
  seekBar.type = 'range';
  seekBar.className = 'ctrl-seek';
  seekBar.min = 0;
  seekBar.max = 100;
  seekBar.value = 0;
  seekBar.setAttribute('aria-label', 'Seek');
  bottomRow.appendChild(seekBar);

  controlsWrapper.appendChild(bottomRow);

  return controlsWrapper;
}

/* ── Attach event listeners to controls ────────────────────── */
function attachControlEvents() {
  if (!seekBar) return;

  // Play / Pause on single click of iframe overlay
  var overlay = document.getElementById('iframeOverlay');
  if (overlay) {
    overlay.addEventListener('click', function () {
      var p = getPlayer();
      if (!p || !p.getPlayerState) return;
      const state = p.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        p.pauseVideo();
      } else {
        p.playVideo();
      }
    });

    // Double-click on overlay toggles expand / collapse
    overlay.addEventListener('dblclick', function () {
      document.body.classList.toggle('fullscreen-mode');
      var isExpanded = document.body.classList.contains('fullscreen-mode');
      var expandBtn = controlsWrapper && controlsWrapper.querySelector('.ctrl-expand');
      if (expandBtn) {
        expandBtn.innerHTML = isExpanded ? '&#9212;' : '&#9974;';
        expandBtn.setAttribute('aria-label', isExpanded ? 'Collapse view' : 'Expand view');
        expandBtn.title = isExpanded ? 'Collapse view' : 'Expand view';
      }
    });
  }

  // Seek (on input — fires on click & drag alike, seeks immediately)
  seekBar.addEventListener('input', function () {
    var p = getPlayer();
    if (!p || !p.seekTo || !p.getDuration) return;
    const duration = p.getDuration();
    if (duration > 0) {
      const seekTime = (seekBar.value / 100) * duration;
      p.seekTo(seekTime, true);
      if (currentTimeEl) currentTimeEl.textContent = formatTime(seekTime);
    }
  });

  // Expand / collapse view via button click
  var expandBtn = controlsWrapper && controlsWrapper.querySelector('.ctrl-expand');
  if (expandBtn) {
    expandBtn.addEventListener('click', function () {
      document.body.classList.toggle('fullscreen-mode');
      var isExpanded = document.body.classList.contains('fullscreen-mode');
      expandBtn.innerHTML = isExpanded ? '&#9212;' : '&#9974;'; // collapse / expand icon
      expandBtn.setAttribute('aria-label', isExpanded ? 'Collapse view' : 'Expand view');
      expandBtn.title = isExpanded ? 'Collapse view' : 'Expand view';
    });
  }

  // Skip Ad button click handler
  if (skipAdBtn) {
    skipAdBtn.addEventListener('click', function () {
      if (typeof onSkipAdCallback === 'function') {
        onSkipAdCallback();
      }
    });
  }
}

/* ── Monitor video progress ─────────────────────────────────── */
let progressInterval = null;

function startProgressMonitor() {
  stopProgressMonitor();
  progressInterval = setInterval(updateSeekBar, 250);
}

function stopProgressMonitor() {
  clearInterval(progressInterval);
  progressInterval = null;
}

/* ── YouTube IFrame API ─────────────────────────────────────── */

/**
 * Load the YouTube IFrame API script with retry logic.
 */
export function loadYouTubeIframeAPI(retryCount, retryDelay) {
  if (retryCount === undefined) retryCount = 3;
  if (retryDelay === undefined) retryDelay = 2000;

  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    console.log('YouTube IFrame API script already loading/loaded.');
    return;
  }

  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];

  tag.onerror = function () {
    console.error('Failed to load YouTube IFrame API script.');
  };

  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var attempts = 0;
  var checkInterval = setInterval(function () {
    if (window.YT && typeof YT.Player === 'function') {
      console.log('YouTube IFrame API loaded successfully.');
      clearInterval(checkInterval);
    } else if (attempts >= retryCount) {
      console.error('Failed to load YouTube IFrame API after multiple attempts.');
      clearInterval(checkInterval);
    } else {
      attempts++;
      console.warn('Retrying YouTube IFrame API… attempt ' + attempts);
      var retryTag = document.createElement('script');
      retryTag.src = 'https://www.youtube.com/iframe_api';
      retryTag.onerror = function () {
        console.error('Retry attempt failed to load YouTube IFrame API script.');
      };
      firstScriptTag.parentNode.insertBefore(retryTag, firstScriptTag);
    }
  }, retryDelay);
}

/* ── Internal YT.Player reference ──────────────────────────── */
var _player = null;

/**
 * Returns the current YT.Player instance (live reference).
 */
export function getPlayer() {
  return _player;
}

/**
 * Play the video (convenience wrapper).
 */
export function playVideo() {
  if (_player && _player.playVideo) {
    _player.playVideo();
  }
}

/**
 * Pause the video (convenience wrapper).
 */
export function pauseVideo() {
  if (_player && _player.pauseVideo) {
    _player.pauseVideo();
  }
}

/**
 * Called by the external module (iframe.js) once the YT API is ready
 * and it has a valid videoId.
 */
export function initPlayer(videoId, onPlayerReadyCb, onStateChangeCb) {
  var container = document.getElementById('youtube-player');
  if (!container) {
    console.error('youtube-player element not found.');
    return;
  }

  var parentEl = container.parentNode;
  if (!parentEl) {
    console.error('youtube-player has no parent node.');
    return;
  }

  // Remove any previously injected controls bar
  var existing = parentEl.querySelector('.custom-video-controls');
  if (existing) existing.remove();

  // Build and inject custom controls
  var controlsEl = createControlsBar();
  parentEl.appendChild(controlsEl);
  attachControlEvents();

  // ── Create the YT.Player ──────────────────────────────────
  _player = new YT.Player('youtube-player', {
    videoId: videoId,
    playerVars: {
      rel: 0,
      autoplay: 1,
      showinfo: 0,
      modestbranding: 1,
      enablejsapi: 1,
      controls: 0,
    },
    events: {
      onReady: function (event) {
        if (durationEl && _player.getDuration) {
          durationEl.textContent = formatTime(_player.getDuration());
        }
        if (typeof onPlayerReadyCb === 'function') {
          onPlayerReadyCb(event);
        }
      },
      onStateChange: function (event) {
        // Update duration on every state change — onReady only fires once,
        // but loadVideoById() (next video, sidebar click) still triggers
        // onStateChange. Grab the new duration as soon as it's available.
        if (_player && _player.getDuration && durationEl) {
          var dur = _player.getDuration();
          if (dur > 0) {
            durationEl.textContent = formatTime(dur);
          }
        }

        if (event.data === YT.PlayerState.PLAYING) {
          startProgressMonitor();
          showControls();
          hideControlsAfterDelay();
        } else {
          stopProgressMonitor();
        }

        if (typeof onStateChangeCb === 'function') {
          onStateChangeCb(event);
        }
      },
    },
  });

  // ── Show/hide controls on mouse activity ──────────────────
  parentEl.addEventListener('mousemove', function () {
    showControls();
    hideControlsAfterDelay();
  });

  if (controlsEl) {
    controlsEl.addEventListener('mouseenter', function () {
      clearTimeout(hideTimer);
    });
    controlsEl.addEventListener('mouseleave', function () {
      hideControlsAfterDelay();
    });
  }
}

/**
 * Sync the UI when the loaded video changes.
 */
export function updatePlayerVideo(newVideoId) {
  if (!_player || !_player.loadVideoById) return;
  _player.loadVideoById(newVideoId);

  if (seekBar) seekBar.value = 0;
  if (currentTimeEl) currentTimeEl.textContent = '0:00';
  if (durationEl) {
    durationEl.textContent = '0:00';
  }
}

/**
 * Show the skip-ad button and set its callback.
 * @param {Function} callback - Function to call when skip is clicked.
 * @param {number} [delaySeconds=0] - Optional delay in seconds before showing the button.
 */
export function showSkipButton(callback, delaySeconds) {
  if (delaySeconds === undefined) delaySeconds = 0;
  if (!skipAdBtn) return;

  if (delaySeconds > 0) {
    setTimeout(function () {
      skipAdBtn.style.display = 'inline-block';
      onSkipAdCallback = callback;
    }, delaySeconds * 1000);
  } else {
    skipAdBtn.style.display = 'inline-block';
    onSkipAdCallback = callback;
  }
}

/**
 * Hide the skip-ad button.
 */
export function hideSkipButton() {
  if (skipAdBtn) {
    skipAdBtn.style.display = 'none';
  }
  onSkipAdCallback = null;
}

/**
 * Clean up.
 */
export function destroyPlayer() {
  stopProgressMonitor();
  if (_player && _player.destroy) {
    _player.destroy();
    _player = null;
  }
}
