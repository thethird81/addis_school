'use strict';
import { getBasePath, getBaseUrl } from '../../utils/path.js';
import { refresh } from '../../utils/sharedFunctions.js';
import { resolveVideos } from '../../features/videos/videoResolver.js';
import { resolveChannelVideos } from '../../features/videos/channelVideos.js';
import { updateVideoListLazyHome } from "../../features/videos/home-page/homePageLazyLoad.js";
import { getLikedVideos ,setLikedVideos} from "../../features/likes/likesLocalStore.js";
import { getLastWatchedVideos } from "../../features/lastwatched/lastWatchedLocalStore.js";
import { getSidebarData, setSidebarData, getChannels, setChannels } from "../../features/store/profileStore.js";
import './styles/sidebar.css';


// Helper function to check for modern JavaScript API support
var supportsModernJS = function() {
    try {
        var hasGlobals = typeof window !== 'undefined' && 'fetch' in window && 'Promise' in window;
        if (!hasGlobals) {
            return false;
        }
        new Function('import("").catch(function() {})')();
        return true;
    } catch (e) {
        return false;
    }
};
const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
const BASE_URL = getBaseUrl();

var sidebarContent = document.getElementById("sidebarContent");
const searchFieldsArray = [];

export const getContents = async () => {
    const grade_id = activeProfile ? activeProfile.grade_id : null;
    if (!grade_id || !activeProfile || !activeProfile.id) return;

    // Try to get cached sidebar data from IndexedDB
    const cachedData = await getSidebarData(activeProfile.id, grade_id);
    if (cachedData) {
        renderSubjects(cachedData.subjects || []);
        displayFavouriteButton();
        displayLastWatchedButton();
//         if(supportsModernJS()) {
//  displayChannelsButton();
//         }
       displayChannelsButton();
        return;
    }

    try {
        const url = `${BASE_URL}/api/v1/sidebar/contents/${grade_id}`;
        const accessToken = localStorage.getItem('accessToken');
        let response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (response.status === 401) {
            const newAccessToken = await refresh();
            if (!newAccessToken) throw new Error("Unable to refresh access token");
            response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${newAccessToken}`
                }
            });
        }

        if (!response.ok) throw new Error(`Response status: ${response.status}`);

        const result = await response.json();
        // Save to IndexedDB
        await setSidebarData(activeProfile.id, grade_id, result);
        renderSubjects(result.subjects || []);
    } catch (error) {
        console.error(error.message);
    }

    displayFavouriteButton();
    displayLastWatchedButton();
    displayChannelsButton();
};

// Helper function to close/hide the sidebar
function closeSidebar() {
    var sidebar = document.querySelector(".sidebar");
    if (sidebar) {
        sidebar.classList.remove("visible");
        sidebar.classList.remove("open");
    }
}

// Function to render subjects, contents, channels, and subcontents (ES5/Legacy Compatible)
var renderSubjects = function(subjects) {
    // Clear the sidebar once
    sidebarContent.innerHTML = "";
    
    // DocumentFragment is supported all the way back to IE6!
    var fragment = document.createDocumentFragment();
    
    // Safe optional chaining replacement
    var gradeId = activeProfile ? activeProfile.grade_id : undefined;
    var basePath = getBasePath();

    subjects.forEach(function(subject) {
        var subjectId = subject.id || subject.subjectId;
        var subjectName = subject.name || subject.subjectName;
        var contents = subject.contents || [];
        var channels = subject.channels || [];

        var subjectDiv = document.createElement("div");
        
        var subjectButton = document.createElement("button");
        subjectButton.textContent = "📚 " + subjectName;
        subjectButton.className = "collapsible sidebar-item";
        subjectButton.setAttribute("tabindex", "0");

        var contentDiv = document.createElement("div");
        contentDiv.className = "content";

        // ---- Render Channels Section (if any) ----
        if (channels.length > 0) {
        var channelsButton = document.createElement("button");
            channelsButton.textContent = "📺 Channels";
            channelsButton.className = "collapsible sidebar-item";
            channelsButton.setAttribute("tabindex", "0");

            var channelsSubDiv = document.createElement("div");
            channelsSubDiv.className = "content";

            channels.forEach(function(ch) {
                var channelId = ch.channelId;
                var channelName = ch.channelName;

                var channelPara = document.createElement("div");
                channelPara.className = "subunits sidebar-item";
                channelPara.setAttribute("tabindex", "0");
                channelPara.textContent = channelName;

                 var locator = {
                    channel_id: channelId,
                    grade_id: gradeId,
                    subject_id: subjectId,
                    content_id: null,
                    subcontent_id: null,
                    subject_name: subjectName
                };
                 searchFieldsArray.push({
                    subcontentName: channelName,
                    locator: locator
                });

                channelPara.addEventListener("click", function() {
                    var sidebar = document.querySelector(".sidebar");
                    if (sidebar) {
                        sidebar.classList.toggle("visible");
                    }

                    
               
                    // Fetch videos for this channel using the channel resolver
                    resolveChannelVideos(locator)
                        .then(function(videos) {
                            if (!videos || videos.length === 0) {
                                console.warn("No videos found for channel:", channelName);
                                return;
                            }

                          
                            localStorage.removeItem("isAfterLogin");

                            if (window.location.pathname === basePath + "play-video.html") {
                                localStorage.setItem("isFromPlayVideoPageSidebarClicked", "true");
                                localStorage.setItem("videoList", JSON.stringify(videos));
                                window.location.href = basePath + "index.html";
                            } else {
                                updateVideoListLazyHome(videos, true);
                            }
                        })
                        ["catch"](function(err) {
                            console.error("Error fetching channel videos:", err);
                        });
                });

                channelsSubDiv.appendChild(channelPara);
            });

            channelsButton.addEventListener("click", function() {
                var isBlock = channelsSubDiv.style.display === "block";
                channelsSubDiv.style.display = isBlock ? "none" : "block";
            });

            contentDiv.appendChild(channelsButton);
            contentDiv.appendChild(channelsSubDiv);
        }

        // ---- Render Contents Section ----
        contents.forEach(function(content) {
            var contentId = content.id || content.contentId;
            var contentName = content.name || content.contentName;
            var subcontents = content.subcontents || [];

        var contentButton = document.createElement("button");
            contentButton.textContent = "📖 " + contentName;
            contentButton.className = "collapsible sidebar-item";
            contentButton.setAttribute("tabindex", "0");

            var subContentDiv = document.createElement("div");
            subContentDiv.className = "content";

            subcontents.forEach(function(sub) {
                var subcontentId = sub.id || sub.subcontentId;
                var subcontentName = sub.name || sub.subcontentName;

                var subContentPara = document.createElement("div");
                subContentPara.className = "subunits sidebar-item";
                subContentPara.setAttribute("tabindex", "0");
                subContentPara.textContent = subcontentName;

                var locator = {
                    channel_id: null,
                    grade_id: gradeId,
                    subject_id: subjectId,
                    content_id: contentId,
                    subcontent_id: subcontentId,
                    subject_name: subjectName
                };

                searchFieldsArray.push({
                    subcontentName: subcontentName,
                    locator: locator
                });

                subContentPara.addEventListener("click", function() {
                    localStorage.setItem("videoLocator", JSON.stringify(locator));

                    resolveVideos(locator, subcontentName)
                        .then(function(videos) {
                            if (!videos || videos.length === 0) {
                                console.warn("No videos resolved for locator:", locator);
                                return;
                            }
                           
                            localStorage.removeItem("isAfterLogin");

                            localStorage.setItem("videoList", JSON.stringify(videos));
                            
                            // Always redirect to index.html to properly display the videos
                            window.location.href = basePath + "index.html";
                        })
                        ["catch"](function(err) { // ['catch'] is safer for old IE keywords
                            console.error("Error resolving videos on click:", err);
                        });

                    var sidebar = document.querySelector(".sidebar");
                    if (sidebar) {
                        sidebar.classList.toggle("visible");
                    }
                });

                subContentDiv.appendChild(subContentPara);
            });

            contentButton.addEventListener("click", function() {
                var isBlock = subContentDiv.style.display === "block";
                subContentDiv.style.display = isBlock ? "none" : "block";
            });

            contentDiv.appendChild(contentButton);
            contentDiv.appendChild(subContentDiv);
        });

        subjectButton.addEventListener("click", function() {
            var isBlock = contentDiv.style.display === "block";
            contentDiv.style.display = isBlock ? "none" : "block";
        });

        subjectDiv.appendChild(subjectButton);
        subjectDiv.appendChild(contentDiv);
        
        fragment.appendChild(subjectDiv);
    });

    sidebarContent.appendChild(fragment);

    localStorage.setItem("searchFieldsArray", JSON.stringify(searchFieldsArray));
    
    // After rendering subjects, check if we need the scroll-down button
    addScrollDownButton();
};

// Scroll-down helper button for long sidebars
function addScrollDownButton() {
    // Remove any existing scroll button first
    var existingBtn = document.getElementById("sidebarScrollDown");
    if (existingBtn) {
        existingBtn.parentNode.removeChild(existingBtn);
    }

    // Defer the overflow check so the browser has time to perform layout/reflow.
    // requestAnimationFrame is preferred; fall back to setTimeout for legacy browsers.
    var deferCheck = (typeof requestAnimationFrame !== 'undefined')
        ? requestAnimationFrame
        : function(callback) { return setTimeout(callback, 0); };

    deferCheck(function() {
        checkAndShowScrollButton();
    });
}

function checkAndShowScrollButton() {
    // Remove any existing scroll button first
    var existingBtn = document.getElementById("sidebarScrollDown");
    if (existingBtn) {
        existingBtn.parentNode.removeChild(existingBtn);
    }

    // Check if sidebar content overflows (i.e. needs scrolling)
    if (sidebar && sidebarContent && sidebarContent.scrollHeight > sidebar.clientHeight) {
        var scrollBtn = document.createElement("button");
        scrollBtn.id = "sidebarScrollDown";
        scrollBtn.className = "sidebar-scroll-down";
        scrollBtn.setAttribute("aria-label", "Scroll sidebar down");
        scrollBtn.setAttribute("tabindex", "0");
        scrollBtn.textContent = "⬇️";

        var scrollInterval = null;

        function startScrolling() {
            if (scrollInterval) return;
            scrollInterval = setInterval(function() {
                if (sidebarContent) {
                    var remaining = sidebarContent.scrollHeight - sidebarContent.scrollTop - sidebarContent.clientHeight;
                    if (remaining <= 1) {
                        sidebarContent.scrollTop = sidebarContent.scrollHeight;
                        stopScrolling();
                        return;
                    }
                    sidebarContent.scrollTop = sidebarContent.scrollTop + 8;
                } else {
                    stopScrolling();
                }
            }, 16);
        }

        function stopScrolling() {
            if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
        }

        // Click to scroll all the way to bottom
        scrollBtn.addEventListener("click", function() {
            if (sidebarContent) {
                sidebarContent.scrollTop = sidebarContent.scrollHeight;
            }
        });

        // Press and hold to scroll continuously
        scrollBtn.addEventListener("mousedown", function(e) {
            e.preventDefault();
            startScrolling();
        });
        scrollBtn.addEventListener("mouseup", stopScrolling);
        scrollBtn.addEventListener("mouseleave", stopScrolling);

        // Touch support
        scrollBtn.addEventListener("touchstart", function(e) {
            e.preventDefault();
            startScrolling();
        }, { passive: false });
        scrollBtn.addEventListener("touchend", stopScrolling);
        scrollBtn.addEventListener("touchcancel", stopScrolling);

        // Keyboard support
        scrollBtn.addEventListener("keydown", function(e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (sidebarContent) {
                    sidebarContent.scrollTop = sidebarContent.scrollHeight;
                }
            }
        });

        // Append the scroll button after sidebarContent inside the sidebar
        var sidebar = document.querySelector(".sidebar");
        if (sidebar) {
            sidebar.appendChild(scrollBtn);
        }
    }
}

// Re-check overflow on window resize (with legacy fallback)
var resizeDebounceTimer = null;
function setupScrollButtonResizeListener() {
    if (typeof window.addEventListener === 'undefined') return;

    window.addEventListener("resize", function() {
        if (resizeDebounceTimer) {
            clearTimeout(resizeDebounceTimer);
        }
        resizeDebounceTimer = setTimeout(function() {
            checkAndShowScrollButton();
        }, 150);
    }, false);
}

// Initialize the resize listener once
setupScrollButtonResizeListener();

function displayFavouriteButton() {
    var separator = document.createElement("hr");
    separator.style.margin = "10px 0";
    sidebarContent.appendChild(separator);

    var favoriteButton = document.createElement("button");
    favoriteButton.textContent = "❤️ Liked Videos";
    favoriteButton.classList.add("favorite-videos-btn");
    favoriteButton.addEventListener("click", function() {
        closeSidebar();
        displayLikedVideos();
    });
    sidebarContent.appendChild(favoriteButton);
}
export const displayLikedVideos = async () => {
  var profile = JSON.parse(localStorage.getItem('activeProfile'));
  var accessToken = localStorage.getItem('accessToken');
  var likedVideos = profile && profile.id ? await getLikedVideos(profile.id) : []; // Try local first

  // If local is empty and user is authenticated, fetch from backend
  if (!likedVideos.length && profile && profile.id && accessToken) {
    try {
      var { fetchLikedVideos } = await import('../../features/likes/likesServices.js');
      var likedData = await fetchLikedVideos(profile.id);
      if (likedData && Array.isArray(likedData)) {
        likedVideos = likedData
          .map(function(entry) { return entry.video || null; })
          .filter(Boolean);
        // Save locally for future use
        await setLikedVideos(profile.id, likedVideos);
      }
    } catch (err) {
      console.error('Error fetching liked videos from backend:', err);
    }
  }

  if (!likedVideos.length) {
    console.log("No liked videos to display.");
    return;
  }
updateVideoListLazyHome(likedVideos, true);
};
function displayLastWatchedButton() {
    var separator = document.createElement("hr");
    separator.style.margin = "10px 0";
    sidebarContent.appendChild(separator);

    var lastWatchedButton = document.createElement("button");
    lastWatchedButton.textContent = "⏰ Last Watched";
    lastWatchedButton.classList.add("favorite-videos-btn");
    lastWatchedButton.addEventListener("click", async () => {
        closeSidebar();
        const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
        if (!activeProfile || !activeProfile.id) {
            console.log("No active profile found.");
            return;
        }
        const lastWatchedVideos = await getLastWatchedVideos(activeProfile.id);
        if (!lastWatchedVideos.length) {
            console.log("No last watched videos to display.");
            return;
        }
        localStorage.setItem("isLastWatchedPlaying", "true");
        updateVideoListLazyHome(lastWatchedVideos, true);
    });
    sidebarContent.appendChild(lastWatchedButton);
}

 function displayChannelsButton() {
    
    var separator = document.createElement("hr");
    separator.style.margin = "10px 0";
    sidebarContent.appendChild(separator);

    var channelsButton = document.createElement("button");
    channelsButton.textContent = "📺 Channels";
    channelsButton.classList.add("favorite-videos-btn");
    channelsButton.addEventListener("click", async () => {
        closeSidebar();
        localStorage.setItem("showChannelsGrid", "true");
        const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
        if (!activeProfile || !activeProfile.grade_id) {
            console.log("No active profile or grade found.");
            return;
        }
        const basePath = getBasePath();
        if (window.location.pathname !== basePath + "index.html") {
            
            window.location.href = basePath + "index.html";
            return;
        }
        console.log("Displaying channels for grade:", activeProfile.grade_id);
        await displayChannels(activeProfile.grade_id);
    });
    sidebarContent.appendChild(channelsButton);
    
    // Check if sidebar overflows and add scroll-down button if needed
    addScrollDownButton();
}

export async function displayChannels(gradeId) {
    localStorage.removeItem("showChannelsGrid");
    const accessToken = localStorage.getItem("accessToken");
    const baseUrl = getBaseUrl();
    const profileId = activeProfile ? activeProfile.id : null;
    let channels = null;

    // Try to get from IndexedDB cache first
    if (profileId) {
        channels = await getChannels(profileId, gradeId);
        if (channels) {
            console.log("Loaded channels from IndexedDB cache",channels);
        }
    }

    // If not in cache, fetch from backend
    if (!channels) {
        const url = `${baseUrl}/api/v1/channels/grade/${gradeId}/subject-channels`;

        try {
            let response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            });

            if (response.status === 401) {
                const newAccessToken = await refresh();
                if (!newAccessToken) throw new Error("Unable to refresh access token");
                response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${newAccessToken}`
                    }
                });
            }

            if (!response.ok) {
                if (response.status === 404) {
                    console.log("No channels found for this grade.");
                    return;
                }
                throw new Error(`Response status: ${response.status}`);
            }

            channels = await response.json();
            if (!channels || !channels.length) {
                console.log("No channels to display.");
                return;
            }

            // Save to IndexedDB
            if (profileId) {
                await setChannels(profileId, gradeId, channels);
                console.log("Channels saved to IndexedDB cache");
            }
        } catch (error) {
            console.error("Error fetching channels:", error);
            return;
        }
    }

    renderChannelGrid(channels);
}

function renderChannelGrid(channels) {
    // Legacy-safe DOM queries
    var listContainer = document.querySelector(".list-container");
    if (!listContainer) return;

    // Clear any existing content (videos or previous channel grid)
    listContainer.innerHTML = "";
    
    // Mark that we're showing channels (not videos)
    listContainer.setAttribute("data-view", "channels");

    // Reset lazy load state to ensure clean slate
    if (typeof resetLazyLoadState === 'function') {
        resetLazyLoadState();
    }

    var grid = document.createElement("div");
    grid.className = "channel-grid";

    // Kid-friendly: shuffle channels for variety (Fisher-Yates with legacy syntax)
    var shuffledChannels = channels.slice(); // copy array
    for (var i = shuffledChannels.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffledChannels[i];
        shuffledChannels[i] = shuffledChannels[j];
        shuffledChannels[j] = temp;
    }

    shuffledChannels.forEach(function(channel) {
        var card = document.createElement("div");
        card.className = "channel-card";
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", channel.name);

        // Kid-friendly: add fun emoji prefix to channel name
        var funEmojis = ["📺", "🎬", "🌟", "🎥", "🌈", "🎪", "🎨", "🎭"];
        var randomEmoji = funEmojis[Math.floor(Math.random() * funEmojis.length)];

        var thumbnailHtml;
        var thumbUrl = null;
        if (channel.thumbnail_url) {
            if (typeof channel.thumbnail_url === 'object' && channel.thumbnail_url !== null) {
                thumbUrl = channel.thumbnail_url.url;
            } else {
                thumbUrl = channel.thumbnail_url;
            }
        }

        if (thumbUrl) {
            thumbnailHtml = '<img src="' + thumbUrl + '" alt="' + channel.name + '" class="channel-thumbnail" loading="lazy">';
        } else {
            thumbnailHtml = '<div class="channel-thumbnail-placeholder">📺</div>';
        }

        // Build inner HTML with kid-friendly name
        var displayName = randomEmoji + " " + channel.name;
        card.innerHTML = thumbnailHtml + '<div class="channel-name">' + displayName + '</div>';

        // Kid-friendly: add a fun scale animation on click
        card.addEventListener("click", function() {
            // Quick fun feedback animation
            card.style.transform = "scale(0.95)";
            setTimeout(function() {
                card.style.transform = "";
            }, 150);

            var activeProfileStr = localStorage.getItem('activeProfile');
            var profile = activeProfileStr ? JSON.parse(activeProfileStr) : null;
            var gradeId = profile ? profile.grade_id : null;

            var locator = {
                channel_id: channel.id,
                grade_id: gradeId,
                subject_id: null,
                content_id: null,
                subcontent_id: null,
                subject_name: channel.subject_name || null,
                channelName: channel.name
            };

            resolveChannelVideos(locator)
                .then(function(videos) {
                    if (!videos || videos.length === 0) {
                        console.warn("No videos found for channel:", channel.name);
                        return;
                    }
                    localStorage.removeItem("isAfterLogin");
                    // Mark that we're showing videos (not channels)
                    var listContainer = document.querySelector(".list-container");
                    if (listContainer) {
                        listContainer.setAttribute("data-view", "videos");
                    }
                    updateVideoListLazyHome(videos, true);
                })
                ["catch"](function(err) {
                    console.error("Error fetching channel videos:", err);
                });
        });

        // Kid-friendly: keyboard support with Enter and Space
        card.addEventListener("keydown", function(e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.click();
            }
        });

        grid.appendChild(card);
    });

    listContainer.appendChild(grid);

    // Legacy-safe focus manager check
    if (typeof window !== 'undefined' && window.focusManager) {
        window.focusManager.activateZone(listContainer);
        setTimeout(function() {
            if (window.focusManager.items && window.focusManager.items.length > 0) {
                window.focusManager.focusedIndex = 0;
                window.focusManager.updateFocus();
            }
        }, 50);
    }
}
