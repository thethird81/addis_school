import "./settings.css";
import '../../styles/navbar.css';
import '../../styles/sidebar.css';
import { getBaseUrl } from "../../utils/path.js";
import { getGradeName, refresh } from '../../utils/sharedFunctions.js';
import '../../components/navbar/navbar.js';
import '../../components/loading-spinner/loading-spinner.css';
import '../../components/loading-spinner/loading-spinner.js';
import { addAdvertVideos, removeAdvertVideosByChannel, clearAdvertVideos } from '../../features/store/profileStore.js';
import { fetchAdvertVideosByChannel } from '../../features/advert/advertServices.js';

const BASE_URL = getBaseUrl();

const SUPABASE_URL = 'https://ovgqocnjucycdupwspme.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yIrzKXTGyNug3EmKBlJ-8Q_ZPFw-YnY';

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

// Supabase client instance (will be initialized asynchronously)
let supabase = null;

// Async initialization of Supabase client
const initializeSupabase = async () => {
    if (!supportsModernJS()) {
        console.warn('⚠️ Legacy browser detected. Modern JavaScript features are not supported.');
        return null;
    }
    if (typeof LoadingSpinner !== 'undefined') {
        LoadingSpinner.show();
    }
    try {
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized successfully');
        if (typeof LoadingSpinner !== 'undefined') {
            LoadingSpinner.hide();
        }
        return supabase;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        if (typeof LoadingSpinner !== 'undefined') {
            LoadingSpinner.hide();
        }
        return null;
    }
};

// Initialize Supabase on module load (non-blocking)
initializeSupabase();

// Get active profile from localStorage
const activeProfile = JSON.parse(localStorage.getItem("activeProfile"));

if (!activeProfile) {
  console.error("No active profile found in localStorage");
}

// DOM references
const errorMessageEl = document.getElementById("errorMessage");
const saveBtn = document.getElementById("saveFavoritesBtn");
const favoritesFilter = document.getElementById("favoritesFilter");
const remainingFilter = document.getElementById("remainingFilter");
const favoritesTableBody = document.getElementById("favoritesTableBody");
const remainingTableBody = document.getElementById("remainingTableBody");
const favoritesCount = document.getElementById("favoritesCount");
const remainingCount = document.getElementById("remainingCount");
const favoritesNoData = document.getElementById("favoritesNoData");
const remainingNoData = document.getElementById("remainingNoData");

// Settings tab elements
const settingsTabBtns = document.querySelectorAll(".settings-tab-btn");
const settingsSections = document.querySelectorAll(".settings-section");

// Channel settings elements
const favoriteChannelsTableBody = document.getElementById("favoriteChannelsTableBody");
const remainingChannelsTableBody = document.getElementById("remainingChannelsTableBody");
const favoriteChannelsCount = document.getElementById("favoriteChannelsCount");
const remainingChannelsCount = document.getElementById("remainingChannelsCount");
const favoriteChannelsNoData = document.getElementById("favoriteChannelsNoData");
const remainingChannelsNoData = document.getElementById("remainingChannelsNoData");
const favoriteChannelsFilter = document.getElementById("favoriteChannelsFilter");
const remainingChannelsFilter = document.getElementById("remainingChannelsFilter");
const channelErrorMessage = document.getElementById("channelErrorMessage");

// Profile settings elements
const profilesListContainer = document.getElementById("profilesListContainer");
const addChildBtn = document.getElementById("addChildBtn");
const profileErrorMessage = document.getElementById("profileErrorMessage");

// Child modal elements
const childModal = document.getElementById("childModal");
const childModalTitle = document.getElementById("childModalTitle");
const closeChildModal = document.getElementById("closeChildModal");
const childForm = document.getElementById("childForm");
const childNameInput = document.getElementById("childName");
const childGradeSelect = document.getElementById("childGradeSelect");
const childAvatarInput = document.getElementById("childAvatar");
const avatarPreview = document.getElementById("avatarPreview");
const uploadAvatarBtn = document.getElementById("uploadAvatarBtn");
const childSubmitBtn = document.getElementById("childSubmitBtn");
const cancelChildBtn = document.getElementById("cancelChildBtn");

// Crop modal elements
const cropModal = document.getElementById("cropModal");
const cropImage = document.getElementById("cropImage");
const cancelCropBtn = document.getElementById("cancelCropBtn");
const doneCropBtn = document.getElementById("doneCropBtn");

let cropper = null;
let editingProfileId = null;
let currentAvatarDataUrl = null;
let isUploadingAvatar = false;

// ─── State Management ────────────────────────────────────────────────────────

// Array to store quiz objects: { id, title, isFavorite }
let quizStateArray = [];
// Current filter for each table
let favoritesFilterText = '';
let remainingFilterText = '';

// Array to store channel objects: { id, name, thumbnailUrl, isFavorite }
let channelStateArray = [];
// Current filter for each channel table
let favoriteChannelsFilterText = '';
let remainingChannelsFilterText = '';

// ─── API helpers ────────────────────────────────────────────────────────────

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

async function fetchWithAuth(url, options = {}) {
  const token = getAccessToken();
  let response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // If access token expired
  if (response.status === 401) {
    console.log("Access token expired. Attempting to refresh...");
    const newAccessToken = await refresh();
    console.log("New access token obtained:", newAccessToken);
    if (!newAccessToken) {
      throw new Error("Unable to refresh access token");
    }
    // retry original request with new access token
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newAccessToken}`,
        ...(options.headers || {}),
      },
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

// ─── Favorites API calls ────────────────────────────────────────────────────

async function fetchFavorites(profileId) {
  return fetchWithAuth(`${BASE_URL}/api/v1/favorites/${profileId}`);
}

async function addFavorite(profileId, quizId) {
  return fetchWithAuth(`${BASE_URL}/api/v1/favorites/add`, {
    method: "POST",
    body: JSON.stringify({ profileId, quizId }),
  });
}

async function removeFavorite(profileId, quizId) {
  return fetchWithAuth(
    `${BASE_URL}/api/v1/favorites/${profileId}/${quizId}`,
    { method: "DELETE" }
  );
}

// ─── Fetch quiz hierarchy ───────────────────────────────────────────────────

async function fetchQuizHierarchy(gradeId) {
  return fetchWithAuth(`${BASE_URL}/api/v1/sidebar/quizzes/${gradeId}`);
}

// ─── Channels API calls ─────────────────────────────────────────────────────

async function fetchFavoriteChannels(profileId) {
  return fetchWithAuth(`${BASE_URL}/api/v1/favorites/channels/${profileId}`);
}

async function addFavoriteChannel(profileId, channelId) {
  return fetchWithAuth(`${BASE_URL}/api/v1/favorites/channels/add`, {
    method: "POST",
    body: JSON.stringify({ profileId, channelId }),
  });
}

async function removeFavoriteChannel(profileId, channelId) {
  return fetchWithAuth(
    `${BASE_URL}/api/v1/favorites/channels/${profileId}/${channelId}`,
    { method: "DELETE" }
  );
}

async function fetchChannelsByGrade(gradeId) {
  return fetchWithAuth(`${BASE_URL}/api/v1/channels/grade/${gradeId}/advert-channels`);
}

// ─── Profiles API calls ─────────────────────────────────────────────────────

async function fetchProfiles() {
  const userId = localStorage.getItem("loggedInUserId");
  if (!userId) throw new Error("No user ID found");
  return fetchWithAuth(`${BASE_URL}/api/v1/profiles/user/${userId}`);
}

async function createProfile(profileData) {
  const userId = localStorage.getItem("loggedInUserId");
  if (!userId) throw new Error("No user ID found");
  return fetchWithAuth(`${BASE_URL}/api/v1/profiles/create`, {
    method: "POST",
    body: JSON.stringify({ ...profileData, user_id: userId }),
  });
}

async function updateProfile(id, profileData) {
  return fetchWithAuth(`${BASE_URL}/api/v1/profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

async function deleteProfile(id) {
  return fetchWithAuth(`${BASE_URL}/api/v1/profiles/${id}`, {
    method: "DELETE",
  });
}

// ─── Avatar upload API ──────────────────────────────────────────────────────

const deleteAvatarFromSupabase = async (avatarUrl) => {
  try {
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = 'avatars/' + fileName;
    
    const { error } = await supabase.storage
      .from('avatar')
      .remove([filePath]);
    
    if (error) {
      console.error('Failed to delete old avatar:', error);
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
  }
};

const uploadAvatarToSupabase = async (blob) => {
  if (typeof LoadingSpinner !== 'undefined') {
    LoadingSpinner.show();
  }
  
  try {
    if (!supabase) {
      console.warn('⏳ Supabase client not yet initialized, waiting...');
      const maxWait = 5000;
      const startTime = Date.now();
      while (!supabase && (Date.now() - startTime) < maxWait) {
        await new Promise(function(resolve) { setTimeout(resolve, 100); });
      }
      if (!supabase) {
        throw new Error('Supabase client initialization timeout. Please try again later.');
      }
    }
    
    const fileExt = 'jpg';
    const fileName = 'avatar_' + Date.now() + '_' + Math.random().toString(36).substring(7) + '.' + fileExt;
    const filePath = 'avatars/' + fileName;
    const { data, error } = await supabase.storage
      .from('avatar')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('avatar')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    throw error;
  } finally {
    if (typeof LoadingSpinner !== 'undefined') {
      setTimeout(function() {
        LoadingSpinner.hide();
      }, 500);
    }
  }
};

// ─── Grades API ─────────────────────────────────────────────────────────────

async function fetchGrades() {
  return fetchWithAuth(`${BASE_URL}/api/v1/grades`);
}

// ─── Save button state ──────────────────────────────────────────────────────

function updateSaveButtonState() {
  if (!saveBtn) return;
  const hasChanges = quizStateArray.some(q => {
    const row = document.querySelector(`tr[data-id="${q.id}"]`);
    return row && row.dataset.pending === 'true';
  });
  saveBtn.disabled = !hasChanges;
}

// ─── Render Quiz Tables ─────────────────────────────────────────────────────

function renderQuizTables() {
  renderQuizTable(favoritesTableBody, quizStateArray.filter(q => q.isFavorite), favoritesFilterText, favoritesNoData);
  renderQuizTable(remainingTableBody, quizStateArray.filter(q => !q.isFavorite), remainingFilterText, remainingNoData);
  
  // Update counts
  const favCount = quizStateArray.filter(q => q.isFavorite).length;
  const remCount = quizStateArray.filter(q => !q.isFavorite).length;
  favoritesCount.textContent = `(${favCount})`;
  remainingCount.textContent = `(${remCount})`;
}

function renderQuizTable(tableBody, quizzes, filterText, noDataElement) {
  tableBody.innerHTML = "";
  
  // Filter quizzes by name
  let filteredQuizzes = quizzes;
  if (filterText) {
    filteredQuizzes = quizzes.filter(q => 
      q.title.toLowerCase().includes(filterText.toLowerCase())
    );
  }
  
  // Show message if no quizzes
  if (filteredQuizzes.length === 0) {
    noDataElement.style.display = 'block';
    return;
  } else {
    noDataElement.style.display = 'none';
  }
  
  // Create row for each quiz
  filteredQuizzes.forEach((quiz) => {
    const row = createQuizTableRow(quiz);
    tableBody.appendChild(row);
  });
}

function createQuizTableRow(quiz) {
  const row = document.createElement("tr");
  row.dataset.id = quiz.id;
  row.dataset.pending = "false";
  
  const starCell = document.createElement("td");
  starCell.className = "col-star";
  
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "star-toggle-btn";
  toggleBtn.dataset.id = quiz.id;
  toggleBtn.innerHTML = `<span class="star-icon">${quiz.isFavorite ? '⭐' : '☆'}</span>`;
  toggleBtn.title = quiz.isFavorite ? "Remove from favorites" : "Add to favorites";
  
  starCell.appendChild(toggleBtn);
  
  const titleCell = document.createElement("td");
  titleCell.className = "col-title";
  const titleSpan = document.createElement("span");
  titleSpan.className = "quiz-title-cell";
  titleSpan.textContent = quiz.title;
  titleCell.appendChild(titleSpan);
  
  row.appendChild(starCell);
  row.appendChild(titleCell);
  
  return row;
}

// ─── Render Channel Tables ──────────────────────────────────────────────────

function renderChannelTables() {
  renderChannelTable(favoriteChannelsTableBody, channelStateArray.filter(c => c.isFavorite), favoriteChannelsFilterText, favoriteChannelsNoData);
  renderChannelTable(remainingChannelsTableBody, channelStateArray.filter(c => !c.isFavorite), remainingChannelsFilterText, remainingChannelsNoData);
  
  // Update counts
  const favCount = channelStateArray.filter(c => c.isFavorite).length;
  const remCount = channelStateArray.filter(c => !c.isFavorite).length;
  favoriteChannelsCount.textContent = `(${favCount})`;
  remainingChannelsCount.textContent = `(${remCount})`;
}

function renderChannelTable(tableBody, channels, filterText, noDataElement) {
  tableBody.innerHTML = "";
  
  // Filter channels by name
  let filteredChannels = channels;
  if (filterText) {
    filteredChannels = channels.filter(c => 
      c.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }
  
  // Show message if no channels
  if (filteredChannels.length === 0) {
    noDataElement.style.display = 'block';
    return;
  } else {
    noDataElement.style.display = 'none';
  }
  
  // Create row for each channel
  filteredChannels.forEach((channel) => {
    const row = createChannelTableRow(channel);
    tableBody.appendChild(row);
  });
}

function createChannelTableRow(channel) {
  const row = document.createElement("tr");
  row.dataset.id = channel.id;
  row.dataset.pending = "false";
  
  const starCell = document.createElement("td");
  starCell.className = "col-star";
  
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "star-toggle-btn";
  toggleBtn.dataset.id = channel.id;
  toggleBtn.innerHTML = `<span class="star-icon">${channel.isFavorite ? '⭐' : '☆'}</span>`;
  toggleBtn.title = channel.isFavorite ? "Remove from favorites" : "Add to favorites";
  
  starCell.appendChild(toggleBtn);
  
  const channelCell = document.createElement("td");
  channelCell.className = "col-channel";
  
  // Add thumbnail before channel name
  const thumbnailSpan = document.createElement("span");
  thumbnailSpan.className = "channel-thumbnail-cell";
  
  // Handle thumbnail_url (can be object or string)
  let thumbUrl = '';
  if (channel.thumbnailUrl) {
    if (typeof channel.thumbnailUrl === 'object' && channel.thumbnailUrl !== null) {
      thumbUrl = channel.thumbnailUrl.url || '';
    } else {
      thumbUrl = channel.thumbnailUrl;
    }
  }
  
  if (thumbUrl) {
    const thumbImg = document.createElement("img");
    thumbImg.src = thumbUrl;
    thumbImg.alt = channel.name;
    thumbImg.className = "channel-thumbnail";
    thumbnailSpan.appendChild(thumbImg);
  } else {
    thumbnailSpan.innerHTML = '<span class="channel-thumbnail-placeholder">📺</span>';
  }
  
  const nameSpan = document.createElement("span");
  nameSpan.className = "channel-name-cell";
  nameSpan.textContent = channel.name;
  
  channelCell.appendChild(thumbnailSpan);
  channelCell.appendChild(nameSpan);
  
  row.appendChild(starCell);
  row.appendChild(channelCell);
  
  return row;
}

// ─── Event Delegation for Star Toggle ───────────────────────────────────────

function setupTableEventDelegation() {
  // Use event delegation on quiz table bodies
  [favoritesTableBody, remainingTableBody].forEach(tableBody => {
    tableBody.addEventListener("click", async (e) => {
      const toggleBtn = e.target.closest('.star-toggle-btn');
      if (!toggleBtn) return;

      const quizId = toggleBtn.dataset.id;
      const quiz = quizStateArray.find(q => q.id === quizId);
      if (!quiz) return;

      const row = document.querySelector(`tr[data-id="${quizId}"]`);
      const wasFavorite = quiz.isFavorite;
      const willBeFavorite = !wasFavorite;

      // 1. Optimistic UI Update: Toggle star immediately
      quiz.isFavorite = willBeFavorite;
      toggleBtn.innerHTML = `<span class="star-icon">${willBeFavorite ? '⭐' : '☆'}</span>`;
      toggleBtn.title = willBeFavorite ? "Remove from favorites" : "Add to favorites";

      // 2. Re-render both tables to reflect the change
      renderQuizTables();

      // 3. Backend sync
      try {
        const profileId = activeProfile.id;
        if (willBeFavorite) {
          await addFavorite(profileId, quizId);
        } else {
          await removeFavorite(profileId, quizId);
        }
        
        // Mark as not pending on success
        if (row) {
          row.dataset.pending = "false";
        }
        updateSaveButtonState();
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        
        // 4. Revert optimistic update on error
        quiz.isFavorite = wasFavorite;
        toggleBtn.innerHTML = `<span class="star-icon">${wasFavorite ? '⭐' : '☆'}</span>`;
        toggleBtn.title = wasFavorite ? "Remove from favorites" : "Add to favorites";
        
        // Re-render to show correct state
        renderQuizTables();
        
        // Show fallback alert notification
        alert("Failed to update favorite. Please try again.");
        updateSaveButtonState();
      }
    });
  });

  // Use event delegation on channel table bodies
  [favoriteChannelsTableBody, remainingChannelsTableBody].forEach(tableBody => {
    tableBody.addEventListener("click", async (e) => {
      const toggleBtn = e.target.closest('.star-toggle-btn');
      if (!toggleBtn) return;

      const channelId = toggleBtn.dataset.id;
      const channel = channelStateArray.find(c => c.id === channelId);
      if (!channel) return;

      const row = document.querySelector(`tr[data-id="${channelId}"]`);
      const wasFavorite = channel.isFavorite;
      const willBeFavorite = !wasFavorite;

      // 1. Optimistic UI Update: Toggle star immediately
      channel.isFavorite = willBeFavorite;
      toggleBtn.innerHTML = `<span class="star-icon">${willBeFavorite ? '⭐' : '☆'}</span>`;
      toggleBtn.title = willBeFavorite ? "Remove from favorites" : "Add to favorites";

      // 2. Re-render both tables to reflect the change
      renderChannelTables();

      // 3. Backend sync and IndexedDB update
      try {
        const profileId = activeProfile.id;
        const gradeId = activeProfile.grade_id;
        
        if (willBeFavorite) {
          await addFavoriteChannel(profileId, channelId);
          
          // Fetch advert videos for this channel and add to IndexedDB
          const channelVideos = await fetchAdvertVideosByChannel(channelId, profileId);
          if (channelVideos.length > 0) {
            await addAdvertVideos(profileId, gradeId, channelVideos);
            console.log(`[settings] Added ${channelVideos.length} advert videos from channel ${channelId} to IndexedDB`);
          }
        } else {
          await removeFavoriteChannel(profileId, channelId);
          
          // Remove this channel's videos from IndexedDB
          await removeAdvertVideosByChannel(profileId, gradeId, channelId);
          console.log(`[settings] Removed advert videos from channel ${channelId} from IndexedDB`);
          
          // Check if there are any remaining favorite channels
          const remainingFavorites = channelStateArray.filter(c => c.isFavorite);
          if (remainingFavorites.length === 0) {
            // No favorite channels left, clear all advert videos
            await clearAdvertVideos(profileId, gradeId);
            console.log(`[settings] No favorite channels remaining, cleared all advert videos from IndexedDB`);
          }
        }
        
        // Mark as not pending on success
        if (row) {
          row.dataset.pending = "false";
        }
      } catch (error) {
        console.error("Failed to toggle channel favorite:", error);
        
        // 4. Revert optimistic update on error
        channel.isFavorite = wasFavorite;
        toggleBtn.innerHTML = `<span class="star-icon">${wasFavorite ? '⭐' : '☆'}</span>`;
        toggleBtn.title = wasFavorite ? "Remove from favorites" : "Add to favorites";
        
        // Re-render to show correct state
        renderChannelTables();
        
        // Show fallback alert notification
        alert("Failed to update channel favorite. Please try again.");
      }
    });
  });
}

// ─── Filter Functionality ───────────────────────────────────────────────────

function setupFilters() {
  favoritesFilter.addEventListener("input", (e) => {
    favoritesFilterText = e.target.value.trim();
    renderQuizTable(favoritesTableBody, quizStateArray.filter(q => q.isFavorite), favoritesFilterText, favoritesNoData);
  });

  remainingFilter.addEventListener("input", (e) => {
    remainingFilterText = e.target.value.trim();
    renderQuizTable(remainingTableBody, quizStateArray.filter(q => !q.isFavorite), remainingFilterText, remainingNoData);
  });

  // Channel filters
  favoriteChannelsFilter.addEventListener("input", (e) => {
    favoriteChannelsFilterText = e.target.value.trim();
    renderChannelTable(favoriteChannelsTableBody, channelStateArray.filter(c => c.isFavorite), favoriteChannelsFilterText, favoriteChannelsNoData);
  });

  remainingChannelsFilter.addEventListener("input", (e) => {
    remainingChannelsFilterText = e.target.value.trim();
    renderChannelTable(remainingChannelsTableBody, channelStateArray.filter(c => !c.isFavorite), remainingChannelsFilterText, remainingChannelsNoData);
  });
}

// ─── Collapsible Sections ───────────────────────────────────────────────────

function setupCollapsibleSections() {
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  
  collapsibleHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.dataset.target;
      const content = document.getElementById(targetId);
      const isOpen = content.classList.contains('open');
      
      // Close all other sections
      document.querySelectorAll('.collapsible-content').forEach(c => {
        c.classList.remove('open');
      });
      document.querySelectorAll('.collapsible-header').forEach(h => {
        h.classList.remove('open');
      });
      
      // Toggle current section
      if (!isOpen) {
        content.classList.add('open');
        header.classList.add('open');
      }
    });
  });
}

// ─── Tab Switching ──────────────────────────────────────────────────────────

function switchToTab(sectionName) {
  // Update tab active state
  settingsTabBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.section === sectionName) {
      btn.classList.add('active');
    }
  });
  
  // Update section visibility
  settingsSections.forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none';
  });
  
  const targetSection = document.getElementById(`${sectionName}SettingsView`);
  if (targetSection) {
    targetSection.style.display = 'block';
    targetSection.classList.add('active');
  }
  
  // Load profiles if switching to profile section
  if (sectionName === 'profile') {
    loadProfiles();
  }
}

function setupTabs() {
  settingsTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      switchToTab(section);
    });
  });
}

// ─── Profile rendering ──────────────────────────────────────────────────────

function renderProfilesList(profiles) {
  profilesListContainer.innerHTML = "";

  if (!profiles || profiles.length === 0) {
    profilesListContainer.innerHTML = '<p class="no-profiles-msg">No profiles found. Add your first child!</p>';
    return;
  }

  profiles.forEach((profile) => {
    const card = document.createElement("div");
    card.className = "profile-card";

    const avatarDiv = document.createElement("div");
    avatarDiv.className = "profile-card-avatar";
    if (profile.avatar_url) {
      const img = document.createElement("img");
      img.src = profile.avatar_url;
      avatarDiv.appendChild(img);
    } else {
      avatarDiv.innerHTML = '<span class="avatar-placeholder">👶</span>';
    }

    const infoDiv = document.createElement("div");
    infoDiv.className = "profile-card-info";

    const nameDiv = document.createElement("div");
    nameDiv.className = "profile-card-name";
    nameDiv.textContent = profile.profile_name;

    const gradeDiv = document.createElement("div");
    gradeDiv.className = "profile-card-grade";
    gradeDiv.textContent = getGradeName(profile.grade_id);

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(gradeDiv);

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "profile-card-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-profile-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openEditProfileModal(profile));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-profile-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (confirm(`Are you sure you want to delete ${profile.profile_name}?`)) {
        try {
          if (profile.avatar_url) {
            await deleteAvatarFromSupabase(profile.avatar_url);
          }
          
          await deleteProfile(profile.id);
          const updatedProfiles = profiles.filter((p) => p.id !== profile.id);
          renderProfilesList(updatedProfiles);
          
          localStorage.setItem("profiles", JSON.stringify(updatedProfiles));
          
          if (activeProfile && activeProfile.id === profile.id && updatedProfiles.length > 0) {
            const newActiveProfile = updatedProfiles[0];
            localStorage.setItem("activeProfile", JSON.stringify(newActiveProfile));
          }
        } catch (err) {
          console.error("Failed to delete profile:", err);
          showError(profileErrorMessage, "Failed to delete profile. Please try again.");
        }
      }
    });

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    card.appendChild(avatarDiv);
    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);
    profilesListContainer.appendChild(card);
  });
}

// ─── Modal handling ─────────────────────────────────────────────────────────

function openAddProfileModal() {
  editingProfileId = null;
  currentAvatarDataUrl = null;
  childModalTitle.textContent = "Add Child";
  childSubmitBtn.textContent = "Add";
  childForm.reset();
  avatarPreview.innerHTML = '<span class="avatar-placeholder">👶</span>';
  childModal.style.display = "flex";
}

function openEditProfileModal(profile) {
  editingProfileId = profile.id;
  currentAvatarDataUrl = profile.avatar_url || null;
  childModalTitle.textContent = "Edit Profile";
  childSubmitBtn.textContent = "Save";
  childNameInput.value = profile.profile_name;
  childGradeSelect.value = profile.grade_id;
  if (profile.avatar_url) {
    avatarPreview.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar">`;
  } else {
    avatarPreview.innerHTML = '<span class="avatar-placeholder">👶</span>';
  }
  childModal.style.display = "flex";
}

function closeModal() {
  childModal.style.display = "none";
  editingProfileId = null;
  currentAvatarDataUrl = null;
  childForm.reset();
  avatarPreview.innerHTML = '<span class="avatar-placeholder">👶</span>';
}

async function handleChildSubmit(e) {
  e.preventDefault();

  if (isUploadingAvatar) {
    showError(profileErrorMessage, "Please wait for avatar upload to complete.");
    return;
  }

  const name = childNameInput.value.trim();
  const gradeId = childGradeSelect.value;

  if (!name || !gradeId) {
    showError(profileErrorMessage, "Please fill in all fields.");
    return;
  }

  const avatarUrl = currentAvatarDataUrl && !currentAvatarDataUrl.startsWith("data:")
    ? currentAvatarDataUrl
    : "";

  const profileData = {
    profile_name: name,
    grade_id: gradeId,
    avatar_url: avatarUrl,
  };

  try {
    let savedProfile;
    if (editingProfileId) {
      const existingProfile = await fetchProfiles().then(profiles => 
        profiles.find(p => p.id === editingProfileId)
      );
      
      if (existingProfile && existingProfile.avatar_url && 
          existingProfile.avatar_url !== avatarUrl && avatarUrl) {
        await deleteAvatarFromSupabase(existingProfile.avatar_url);
      }
      
      savedProfile = await updateProfile(editingProfileId, profileData);
      
      const localProfiles = JSON.parse(localStorage.getItem("profiles")) || [];
      const index = localProfiles.findIndex(p => p.id === editingProfileId);
      if (index !== -1) {
        localProfiles[index] = { ...localProfiles[index], ...profileData };
        localStorage.setItem("profiles", JSON.stringify(localProfiles));
      }
    } else {
      savedProfile = await createProfile(profileData);
      
      const localProfiles = JSON.parse(localStorage.getItem("profiles")) || [];
      localProfiles.push(savedProfile);
      localStorage.setItem("profiles", JSON.stringify(localProfiles));
      localStorage.setItem("activeProfile", JSON.stringify(savedProfile));
    }
    closeModal();
    loadProfiles();
  } catch (err) {
    console.error("Failed to save profile:", err);
    showError(profileErrorMessage, "Failed to save profile. Please try again.");
  }
}

// ─── Avatar upload & crop ───────────────────────────────────────────────────

function handleAvatarUpload() {
  childAvatarInput.click();
}

function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    cropImage.src = event.target.result;
    cropModal.style.display = "flex";

    if (cropper) {
      cropper.destroy();
    }

    cropper = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 1,
      background: false,
    });
  };
  reader.readAsDataURL(file);
}

async function handleCropDone() {
  if (!cropper) return;

  const canvas = cropper.getCroppedCanvas({
    width: 300,
    height: 300,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    avatarPreview.innerHTML = `<img src="${url}" alt="Avatar">`;

    cropModal.style.display = "none";
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    cropImage.src = "";

    uploadAvatarToSupabase(blob)
      .then(publicUrl => {
        currentAvatarDataUrl = publicUrl;
      })
      .catch(err => {
        console.error("Failed to upload avatar:", err);
        showError(profileErrorMessage, "Failed to upload avatar. Please try again.");
        currentAvatarDataUrl = null;
        avatarPreview.innerHTML = '<span class="avatar-placeholder">👶</span>';
      });
  }, 'image/jpeg', 0.8);
}

function handleCropCancel() {
  cropModal.style.display = "none";
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  cropImage.src = "";
  childAvatarInput.value = "";
}

// ─── Load profiles ──────────────────────────────────────────────────────────

async function loadProfiles() {
  try {
    clearError(profileErrorMessage);
    const profiles = await fetchProfiles();
    renderProfilesList(profiles);
  } catch (err) {
    console.error("Error loading profiles:", err);
    showError(profileErrorMessage, "Failed to load profiles. Please try again.");
  }
}

// ─── Load grades for dropdown ───────────────────────────────────────────────

async function loadGrades() {
  try {
    const grades = await fetchGrades();
    childGradeSelect.innerHTML = '<option value="" disabled selected>Select Grade</option>';
    grades.forEach((grade) => {
      const option = document.createElement("option");
      option.value = grade.id;
      option.textContent = grade.name;
      childGradeSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading grades:", err);
  }
}

// ─── Error handling helpers ─────────────────────────────────────────────────

function showError(element, message) {
  if (element) {
    element.textContent = message;
    element.style.display = "block";
  }
}

function clearError(element) {
  if (element) {
    element.textContent = "";
    element.style.display = "none";
  }
}

// ─── Initialize ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  if (!activeProfile) {
    showError(errorMessageEl, "No active profile found. Please sign in and select a profile.");
    return;
  }

  const gradeId = activeProfile.grade_id;
  const profileId = activeProfile.id;

  if (!gradeId || !profileId) {
    showError(errorMessageEl, "Profile is missing grade or profile ID.");
    return;
  }

  // Setup tab switching
  setupTabs();
  
  // Setup collapsible sections
  setupCollapsibleSections();
  
  // Setup filters
  setupFilters();
  
  // Setup event delegation for star toggles
  setupTableEventDelegation();

  // Profile modal events
  if (addChildBtn) {
    addChildBtn.addEventListener("click", openAddProfileModal);
  }
  if (closeChildModal) {
    closeChildModal.addEventListener("click", closeModal);
  }
  if (cancelChildBtn) {
    cancelChildBtn.addEventListener("click", closeModal);
  }
  if (childForm) {
    childForm.addEventListener("submit", handleChildSubmit);
  }
  if (uploadAvatarBtn) {
    uploadAvatarBtn.addEventListener("click", handleAvatarUpload);
  }
  if (childAvatarInput) {
    childAvatarInput.addEventListener("change", handleAvatarChange);
  }
  if (doneCropBtn) {
    doneCropBtn.addEventListener("click", handleCropDone);
  }
  if (cancelCropBtn) {
    cancelCropBtn.addEventListener("click", handleCropCancel);
  }

  // Close modals on overlay click
  if (childModal) {
    childModal.addEventListener("click", (e) => {
      if (e.target === childModal) closeModal();
    });
  }
  if (cropModal) {
    cropModal.addEventListener("click", (e) => {
      if (e.target === cropModal) handleCropCancel();
    });
  }

  // Load grades for dropdown
  await loadGrades();

  // Load quiz data
  try {
    clearError(errorMessageEl);

    const [hierarchyData, favorites] = await Promise.all([
      fetchQuizHierarchy(gradeId),
      fetchFavorites(profileId),
    ]);

    // Build quiz state array from hierarchy data and favorites
    const favoriteQuizIds = new Set(favorites.map((f) => f.quizId));
    quizStateArray = [];

    // Helper to process quizzes
    const processQuizzes = (quizzes) => {
      if (!quizzes) return;
      quizzes.forEach((quiz) => {
        quizStateArray.push({
          id: quiz.quizId,
          title: quiz.quizTitle,
          isFavorite: favoriteQuizIds.has(quiz.quizId)
        });
      });
    };

    // Process general quizzes
    processQuizzes(hierarchyData.generalQuizzes);

    // Process subjects and their nested quizzes
    if (hierarchyData.subjects) {
      hierarchyData.subjects.forEach((subject) => {
        processQuizzes(subject.quizzes);
        if (subject.contents) {
          subject.contents.forEach((content) => {
            processQuizzes(content.quizzes);
            if (content.subcontents) {
              content.subcontents.forEach((subcontent) => {
                processQuizzes(subcontent.quizzes);
              });
            }
          });
        }
      });
    }

    // Initial render of quiz tables
    renderQuizTables();
    updateSaveButtonState();
  } catch (error) {
    console.error("Error loading settings:", error);
    showError(
      errorMessageEl,
      "Failed to load quiz data. Please check your connection and try again."
    );
  }

  // Load channel data
  try {
    clearError(channelErrorMessage);

    const [channels, favoriteChannels] = await Promise.all([
      fetchChannelsByGrade(gradeId),
      fetchFavoriteChannels(profileId),
    ]);

    // Build channel state array
    const favoriteChannelIds = new Set(favoriteChannels.map((fc) => fc.channelId));
    channelStateArray = channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      thumbnailUrl: channel.thumbnail_url,
      isFavorite: favoriteChannelIds.has(channel.id),
    }));

    // Initial render of channel tables
    renderChannelTables();
  } catch (error) {
    console.error("Error loading channels:", error);
    showError(
      channelErrorMessage,
      "Failed to load channel data. Please check your connection and try again."
    );
  }
});
