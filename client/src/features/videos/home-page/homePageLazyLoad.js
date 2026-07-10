'use strict';
import { getBasePath } from '../../../utils/path';
import { resolveNamesFromLocator } from "../../../utils/sharedFunctions.js";

// Legacy browser CSS fallback helper
var supportsModernCSS = function() {
    try {
        // Check for CSS Grid support (IE10/11 use -ms-grid, not standard grid)
        var testElem = document.createElement('div');
        var hasGrid = testElem.style.grid !== undefined ||
                      testElem.style.gridTemplateColumns !== undefined;
        // Check for aspect-ratio
        var hasAspectRatio = testElem.style.aspectRatio !== undefined;
        // Check for CSS.supports API
        var hasSupports = typeof CSS !== 'undefined' && typeof CSS.supports === 'function';

        if (hasSupports) {
            return CSS.supports('display', 'grid') &&
                   CSS.supports('aspect-ratio', '1');
        }

        // Fallback for browsers without CSS.supports (IE)
        return hasGrid && hasAspectRatio;
    } catch (e) {
        return false;
    }
};

// Inject fallback CSS for legacy browsers that don't support modern CSS features
var injectLegacyCSSFallback = function() {
    var styleId = 'video-grid-legacy-fallback';
    if (document.getElementById(styleId)) {
        return; // Already injected
    }

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent =
        '.video-grid {' +
            'display: flex;' +
            'flex-wrap: wrap;' +
            'margin: -10px;' +
        '}' +
        '.video-grid > .video-card {' +
            'flex: 1 1 280px;' +
            'margin: 10px;' +
            'max-width: 400px;' +
        '}' +
        '.video-thumbnail-wrapper {' +
            'height: 158px;' + /* 280 * 9/16 ≈ 158 */
            'overflow: hidden;' +
        '}' +
        '.video-thumbnail {' +
            'width: 100%;' +
            'height: 100%;' +
            'object-fit: cover;' +
        '}' +
        '.video-thumbnail-placeholder {' +
            'width: 100%;' +
            'height: 100%;' +
            'display: flex;' +
            'align-items: center;' +
            'justify-content: center;' +
            'font-size: 48px;' +
            'background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 179, 71, 0.2));' +
        '}';

    document.head.appendChild(style);
};

// Detect if modern CSS is supported, inject fallback if not
if (!supportsModernCSS()) {
    injectLegacyCSSFallback();
}

var activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
var grade_id = activeProfile ? activeProfile.grade_id : null;
var currentChunkIndex = 0;
var CHUNK_SIZE = 12;
var isLoading = false; // Flag to prevent multiple calls
var videoList = []; // Global variable to store the video list

export function updateVideoListLazyHome(videos, reset) {
    if (window.location.pathname === getBasePath() + "play-video.html") {
        window.location.href = getBasePath() + "index.html";
    }

    var accessToken = localStorage.getItem("accessToken");
    var isLastWatchedPlaying = localStorage.getItem("isLastWatchedPlaying") === "true";
    console.log("updateVideoListLazyHome called with videos:", videos.length);

    if (isLoading) {
        console.log("Skipping update as videos are still loading...");
        return;
    }

    var listContainer = document.querySelector(".list-container");

    if (reset) {
        if (!isLastWatchedPlaying) {
            localStorage.removeItem("isLastWatchedPlaying");
            shuffleArray(videos);
        }

        videoList = videos;
        localStorage.setItem("videoList", JSON.stringify(videoList));

        currentChunkIndex = 0;
        if (listContainer) {
            listContainer.innerHTML = "";
            listContainer.setAttribute("data-view", "videos");
        }
        console.log("Video list reset. Current chunk index set to 0.");
    } else if (listContainer && listContainer.getAttribute("data-view") === "channels") {
        listContainer.innerHTML = "";
        listContainer.setAttribute("data-view", "videos");
        resetLazyLoadState();
    }

    isLoading = true;

    if (videoList.length === 0) {
        videoList = videos;
    }

    listContainer = document.querySelector(".list-container");

    var start = currentChunkIndex * CHUNK_SIZE;
    var end = Math.min(start + CHUNK_SIZE, videoList.length);

    if (start >= videoList.length) {
        window.removeEventListener("scroll", onScroll);
        isLoading = false;
        return;
    }

    var chunk = videoList.slice(start, end);

    // Create or get the video grid container (like channel-grid)
    var videoGrid = listContainer.querySelector(".video-grid");
    if (!videoGrid) {
        videoGrid = document.createElement("div");
        videoGrid.className = "video-grid";
        listContainer.appendChild(videoGrid);
    }

    chunk.forEach(function(video) {
        var card = document.createElement("div");
        card.className = "video-card";
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", video.title);

        // Safe thumbnail access
        var thumbnail = null;
        if (video.thumbnails) {
            thumbnail = video.thumbnails.high || video.thumbnails.medium || video.thumbnails["default"];
        }

        // Safe subject name
        var subjectName = video.locator ? video.locator.subject_name : "";
        var channelTitle = video.channelTitle || "";

        // Kid-friendly subject emoji mapping
        var subjectEmoji = getSubjectEmoji(subjectName);

        // Format duration if available
        var durationHtml = "";
        if (video.duration) {
            var formattedDuration = formatDuration(video.duration);
            durationHtml = '<span class="video-duration-badge">' + formattedDuration + '</span>';
        }

        // Build thumbnail HTML
        var thumbnailHtml;
        if (thumbnail) {
            thumbnailHtml = '<img src="' + thumbnail + '" alt="' + video.title + '" class="video-thumbnail" loading="lazy">';
        } else {
            thumbnailHtml = '<div class="video-thumbnail-placeholder">' + subjectEmoji + '</div>';
        }

        card.innerHTML =
            '<div class="video-thumbnail-wrapper">' +
                thumbnailHtml +
                durationHtml +
            '</div>' +
            '<div class="video-card-info">' +
                '<div class="video-card-title">' + video.title + '</div>' +
            '<div class="video-card-meta">' +
                '<span class="video-card-subject">' + subjectEmoji + ' ' + subjectName + '</span>' +
                '<span class="video-card-channel">' + channelTitle + '</span>' +
                (video.viewCount !== undefined ? '<span class="video-card-views">' + video.viewCount + ' </span>' : '') +
            '</div>' +
            '</div>';

        card.addEventListener("click", function() {
            console.log(video);
            localStorage.setItem("clickedVideo", JSON.stringify(video));
            window.location.href = getBasePath() + "play-video.html";
        });

        videoGrid.appendChild(card);
    });

    currentChunkIndex++;

    console.log("Loaded videos from index " + start + " to " + end + ". Current chunk index: " + currentChunkIndex);
    isLoading = false;

    if (window.focusManager) {
        window.focusManager.activateZone(listContainer);
        setTimeout(function() {
            if (window.focusManager.items.length > 0) {
                window.focusManager.focusedIndex = 0;
                window.focusManager.updateFocus();
            }
        }, 50);
    }
}

// Format duration from seconds to HH:MM:SS or MM:SS
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) {
        return "";
    }
    
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = seconds % 60;
    
    // Format with leading zeros
    var secsStr = secs < 10 ? "0" + secs : secs;
    var minsStr = minutes < 10 ? "0" + minutes : minutes;
    
    if (hours > 0) {
        // If over an hour, use H:MM:SS format
        return hours + ":" + minsStr + ":" + secsStr;
    } else {
        // If under an hour, use MM:SS format
        return minsStr + ":" + secsStr;
    }
}

// Format view count to human-readable format (e.g., 1500 -> 1.5K, 1500000 -> 1.5M)
function formatViewCount(count) {
    if (!count || isNaN(count)) {
        return "0";
    }
    
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
}

// Kid-friendly emoji mapping for subjects
function getSubjectEmoji(subjectName) {
    var name = (subjectName || "").toLowerCase();
    var emojiMap = {
        "mathematics": "🔢",
        "math": "🔢",
        "english": "📖",
        "science": "🔬",
        "physics": "⚡",
        "chemistry": "🧪",
        "biology": "🌿",
        "history": "📜",
        "geography": "🌍",
        "amharic": "📝",
        "civics": "🏛️",
        "it": "💻",
        "computer": "💻",
        "art": "🎨",
        "music": "🎵",
        "physical education": "⚽",
        "pe": "⚽",
        "entertainment": "🎮",
        "social": "🤝",
        "religion": "🕊️",
        "health": "🏥",
        "economics": "💰",
        "business": "💼",
        "biology": "🧬"
    };

    for (var key in emojiMap) {
        if (emojiMap.hasOwnProperty(key) && name.indexOf(key) !== -1) {
            return emojiMap[key];
        }
    }
    return "📺"; // Default video emoji
}

function onScroll() {
    var listContainer = document.querySelector(".list-container");
    var scrollThreshold = 300;

    if (listContainer && listContainer.getAttribute("data-view") === "channels") {
        return;
    }

    if (listContainer && window.innerHeight + window.scrollY >= document.body.offsetHeight - scrollThreshold) {
        if (currentChunkIndex * CHUNK_SIZE < videoList.length) {
            updateVideoListLazyHome(videoList, false);
        }
    }
}

// Add scroll event listener for lazy loading with debounce
var scrollTimeout;
window.addEventListener("scroll", function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(onScroll, 100);
});

export function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export function resetLazyLoadState() {
    currentChunkIndex = 0;
    isLoading = false;
    videoList = [];
}