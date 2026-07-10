import "./settings.css";
import '../../styles/navbar.css';
import '../../styles/sidebar.css';
import { getBaseUrl } from "../../utils/path.js";
import { getGradeName, refresh } from '../../utils/sharedFunctions.js';
import '../../components/navbar/navbar.js';
import '../../components/loading-spinner/loading-spinner.css';
import '../../components/loading-spinner/loading-spinner.js';

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
const quizCardsContainer = document.getElementById("quiz-cards-container");
const errorMessageEl = document.getElementById("errorMessage");
const saveBtn = document.getElementById("saveFavoritesBtn");
const favoritesTabBtn = document.getElementById("favoritesTabBtn");
const remainingTabBtn = document.getElementById("remainingTabBtn");

// Settings toggle
const quizTabBtn = document.getElementById("quizTabBtn");
const profileTabBtn = document.getElementById("profileTabBtn");
const quizSettingsView = document.getElementById("quizSettingsView");
const profileSettingsView = document.getElementById("profileSettingsView");

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
// Current filter: 'favorites' | 'remaining'
let currentFilter = 'favorites';

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
    const card = document.querySelector(`.quiz-card[data-id="${q.id}"]`);
    return card && card.dataset.pending === 'true';
  });
  saveBtn.disabled = !hasChanges;
}

// ─── Render Quiz Cards ──────────────────────────────────────────────────────

function renderQuizCards() {
  quizCardsContainer.innerHTML = "";

  // Filter quizzes based on current filter
  let filteredQuizzes = [];
  if (currentFilter === 'favorites') {
    filteredQuizzes = quizStateArray.filter(q => q.isFavorite);
  } else {
    filteredQuizzes = quizStateArray.filter(q => !q.isFavorite);
  }

  // Show message if no quizzes
  if (filteredQuizzes.length === 0) {
    const message = document.createElement("div");
    message.className = "no-quizzes-message";
    message.textContent = currentFilter === 'favorites' 
      ? "No favorited quizzes yet. Browse quizzes and click ⭐ to add favorites!"
      : "All quizzes are favorited! 🎉";
    quizCardsContainer.appendChild(message);
    return;
  }

  // Create card for each filtered quiz
  filteredQuizzes.forEach((quiz) => {
    const card = createQuizCard(quiz);
    quizCardsContainer.appendChild(card);
  });
}

function createQuizCard(quiz) {
  const card = document.createElement("div");
  card.className = "quiz-card";
  card.dataset.id = quiz.id;
  card.dataset.pending = "false";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "favorite-toggle-btn";
  toggleBtn.dataset.id = quiz.id;
  toggleBtn.innerHTML = `<span class="star-icon">${quiz.isFavorite ? '⭐' : '☆'}</span>`;
  toggleBtn.title = quiz.isFavorite ? "Remove from favorites" : "Add to favorites";

  const titleSpan = document.createElement("span");
  titleSpan.className = "quiz-title";
  titleSpan.textContent = quiz.title;

  card.appendChild(toggleBtn);
  card.appendChild(titleSpan);

  return card;
}

// ─── Event Delegation for Star Toggle ───────────────────────────────────────

function setupEventDelegation() {
  quizCardsContainer.addEventListener("click", async (e) => {
    // Check if click originated from a favorite toggle button
    const toggleBtn = e.target.closest('.favorite-toggle-btn');
    if (!toggleBtn) return;

    const quizId = toggleBtn.dataset.id;
    const quiz = quizStateArray.find(q => q.id === quizId);
    if (!quiz) return;

    const card = document.querySelector(`.quiz-card[data-id="${quizId}"]`);
    const wasFavorite = quiz.isFavorite;
    const willBeFavorite = !wasFavorite;

    // 1. Optimistic UI Update: Toggle star immediately
    quiz.isFavorite = willBeFavorite;
    toggleBtn.innerHTML = `<span class="star-icon">${willBeFavorite ? '⭐' : '☆'}</span>`;
    toggleBtn.title = willBeFavorite ? "Remove from favorites" : "Add to favorites";

    // 2. Check if card should fade out (if it no longer matches the current filter)
    const shouldFadeOut = currentFilter === 'favorites' && !willBeFavorite ||
                          currentFilter === 'remaining' && willBeFavorite;

    if (shouldFadeOut && card) {
      card.classList.add('fading-out');
      
      // Wait for fade-out animation before re-rendering
      setTimeout(() => {
        renderQuizCards();
      }, 200);
    } else if (!shouldFadeOut) {
      // If staying in view, just update the button
      // No need to re-render
    }

    // 3. Backend sync
    try {
      const profileId = activeProfile.id;
      if (willBeFavorite) {
        await addFavorite(profileId, quizId);
      } else {
        await removeFavorite(profileId, quizId);
      }
      
      // Mark as not pending on success
      if (card) {
        card.dataset.pending = "false";
      }
      updateSaveButtonState();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      
      // 4. Revert optimistic update on error
      quiz.isFavorite = wasFavorite;
      toggleBtn.innerHTML = `<span class="star-icon">${wasFavorite ? '⭐' : '☆'}</span>`;
      toggleBtn.title = wasFavorite ? "Remove from favorites" : "Add to favorites";
      
      // Remove fade-out class if it was added
      if (card) {
        card.classList.remove('fading-out');
      }
      
      // Re-render to show correct state
      renderQuizCards();
      
      // Show fallback alert notification
      alert("Failed to update favorite. Please try again.");
      updateSaveButtonState();
    }
  });
}

// ─── Tab Switching ──────────────────────────────────────────────────────────

function switchToFavoritesTab() {
  currentFilter = 'favorites';
  favoritesTabBtn.classList.add('active');
  remainingTabBtn.classList.remove('active');
  renderQuizCards();
}

function switchToRemainingTab() {
  currentFilter = 'remaining';
  remainingTabBtn.classList.add('active');
  favoritesTabBtn.classList.remove('active');
  renderQuizCards();
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

// ─── Settings toggle ────────────────────────────────────────────────────────

function switchToQuizTab() {
  quizTabBtn.classList.add("active");
  profileTabBtn.classList.remove("active");
  quizSettingsView.style.display = "block";
  profileSettingsView.style.display = "none";
}

function switchToProfileTab() {
  profileTabBtn.classList.add("active");
  quizTabBtn.classList.remove("active");
  profileSettingsView.style.display = "block";
  quizSettingsView.style.display = "none";
  loadProfiles();
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

  // Wire up tab buttons
  if (favoritesTabBtn && remainingTabBtn) {
    favoritesTabBtn.addEventListener("click", switchToFavoritesTab);
    remainingTabBtn.addEventListener("click", switchToRemainingTab);
  }

  // Settings toggle
  if (quizTabBtn && profileTabBtn) {
    quizTabBtn.addEventListener("click", switchToQuizTab);
    profileTabBtn.addEventListener("click", switchToProfileTab);
  }

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

    // Setup event delegation
    setupEventDelegation();

    // Initial render
    renderQuizCards();
    updateSaveButtonState();
  } catch (error) {
    console.error("Error loading settings:", error);
    showError(
      errorMessageEl,
      "Failed to load quiz data. Please check your connection and try again."
    );
  }
});