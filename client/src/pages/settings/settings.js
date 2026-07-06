import "./settings.css";
import '../../styles/navbar.css';
import '../../styles/sidebar.css';
import { getBaseUrl } from "../../utils/path.js";
import { getGradeName } from '../../utils/sharedFunctions.js';
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
const hierarchyContainer = document.getElementById("quizHierarchyContainer");
const favoritesListContainer = document.getElementById("favoritesListContainer");
const favoritesCountSpan = document.getElementById("favoritesCount");
const errorMessageEl = document.getElementById("errorMessage");
const saveBtn = document.getElementById("saveFavoritesBtn");

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

// ─── Pending changes tracking ────────────────────────────────────────────────
const pendingAdditions = new Set();
const pendingRemovals = new Set();

// ─── API helpers ────────────────────────────────────────────────────────────

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

async function fetchWithAuth(url, options = {}) {
  const token = getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
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
    // Extract file path from URL
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
  // Show loading spinner during upload
  if (typeof LoadingSpinner !== 'undefined') {
    LoadingSpinner.show();
  }
  
  try {
    // Wait for supabase to be initialized if it's still null
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
  const hasChanges = pendingAdditions.size > 0 || pendingRemovals.size > 0;
  saveBtn.disabled = !hasChanges;
}

// ─── Render functions ───────────────────────────────────────────────────────

function createQuizCheckbox(quiz, isFavorite) {
  const quizItem = document.createElement("label");
  quizItem.className = "quiz-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.dataset.quizId = quiz.quizId;
  checkbox.dataset.quizTitle = quiz.quizTitle;

  const wasFavorite = isFavorite;
  const isPendingAdd = pendingAdditions.has(quiz.quizId);
  const isPendingRemove = pendingRemovals.has(quiz.quizId);

  checkbox.checked = isPendingAdd ? true : (isPendingRemove ? false : wasFavorite);

  checkbox.addEventListener("change", (e) => {
    const qId = e.target.dataset.quizId;
    const isNowChecked = e.target.checked;

    if (isNowChecked) {
      if (pendingRemovals.has(qId)) {
        pendingRemovals.delete(qId);
      } else {
        pendingAdditions.add(qId);
      }
    } else {
      if (pendingAdditions.has(qId)) {
        pendingAdditions.delete(qId);
      } else {
        pendingRemovals.add(qId);
      }
    }

    updateSaveButtonState();
  });

  const quizLabel = document.createElement("span");
  quizLabel.textContent = quiz.quizTitle;

  quizItem.appendChild(checkbox);
  quizItem.appendChild(quizLabel);
  return quizItem;
}

function renderQuizHierarchy(subjects, generalQuizzes, favoriteQuizIds) {
  hierarchyContainer.innerHTML = "";

  if ((!subjects || subjects.length === 0) && (!generalQuizzes || generalQuizzes.length === 0)) {
    hierarchyContainer.innerHTML =
      '<p class="no-quizzes-msg">No quizzes available for this grade.</p>';
    return;
  }

  if (generalQuizzes && generalQuizzes.length > 0) {
    const generalSection = document.createElement("div");
    generalSection.className = "subject-category";

    const generalBtn = document.createElement("button");
    generalBtn.className = "collapsible-btn";
    generalBtn.textContent = "General Quizzes";
    generalBtn.addEventListener("click", () => {
      const wrapper = generalBtn.nextElementSibling;
      wrapper.style.display = wrapper.style.display === "block" ? "none" : "block";
    });
    generalSection.appendChild(generalBtn);

    const generalWrapper = document.createElement("div");
    generalWrapper.className = "content-wrapper";

    generalQuizzes.forEach((quiz) => {
      const quizItem = createQuizCheckbox(quiz, favoriteQuizIds.has(quiz.quizId));
      generalWrapper.appendChild(quizItem);
    });

    generalSection.appendChild(generalWrapper);
    hierarchyContainer.appendChild(generalSection);
  }

  subjects.forEach((subject) => {
    const subjectDiv = document.createElement("div");
    subjectDiv.className = "subject-category";

    const subjectBtn = document.createElement("button");
    subjectBtn.className = "collapsible-btn";
    subjectBtn.textContent = subject.subjectName;
    subjectBtn.addEventListener("click", () => {
      const content = subjectBtn.nextElementSibling;
      content.style.display = content.style.display === "block" ? "none" : "block";
    });
    subjectDiv.appendChild(subjectBtn);

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";

    if (subject.quizzes && subject.quizzes.length > 0) {
      const subjectQuizBlock = document.createElement("div");
      subjectQuizBlock.className = "content-block";

      const subjectQuizTitle = document.createElement("div");
      subjectQuizTitle.className = "subcontent-title";
      subjectQuizTitle.textContent = "(Subject-level quizzes)";
      subjectQuizBlock.appendChild(subjectQuizTitle);

      subject.quizzes.forEach((quiz) => {
        const quizItem = createQuizCheckbox(quiz, favoriteQuizIds.has(quiz.quizId));
        subjectQuizBlock.appendChild(quizItem);
      });

      contentWrapper.appendChild(subjectQuizBlock);
    }

    (subject.contents || []).forEach((content) => {
      const contentDiv = document.createElement("div");
      contentDiv.className = "content-block";

      const contentBtn = document.createElement("button");
      contentBtn.className = "collapsible-btn sub-btn";
      contentBtn.textContent = content.contentName;
      contentBtn.addEventListener("click", () => {
        const sub = contentBtn.nextElementSibling;
        sub.style.display = sub.style.display === "block" ? "none" : "block";
      });
      contentDiv.appendChild(contentBtn);

      const subcontentWrapper = document.createElement("div");
      subcontentWrapper.className = "subcontent-wrapper";

      if (content.quizzes && content.quizzes.length > 0) {
        const contentQuizBlock = document.createElement("div");
        contentQuizBlock.className = "subcontent-block";

        const contentQuizTitle = document.createElement("div");
        contentQuizTitle.className = "subcontent-title";
        contentQuizTitle.textContent = "(Content-level quizzes)";
        contentQuizBlock.appendChild(contentQuizTitle);

        content.quizzes.forEach((quiz) => {
          const quizItem = createQuizCheckbox(quiz, favoriteQuizIds.has(quiz.quizId));
          contentQuizBlock.appendChild(quizItem);
        });

        subcontentWrapper.appendChild(contentQuizBlock);
      }

      (content.subcontents || []).forEach((subcontent) => {
        const scDiv = document.createElement("div");
        scDiv.className = "subcontent-block";

        const scTitle = document.createElement("div");
        scTitle.className = "subcontent-title";
        scTitle.textContent = subcontent.subcontentName;
        scDiv.appendChild(scTitle);

        (subcontent.quizzes || []).forEach((quiz) => {
          const quizItem = createQuizCheckbox(quiz, favoriteQuizIds.has(quiz.quizId));
          scDiv.appendChild(quizItem);
        });

        subcontentWrapper.appendChild(scDiv);
      });

      contentDiv.appendChild(subcontentWrapper);
      contentWrapper.appendChild(contentDiv);
    });

    subjectDiv.appendChild(contentWrapper);
    hierarchyContainer.appendChild(subjectDiv);
  });
}

// ─── Favorites list management ──────────────────────────────────────────────

const favoritesMap = new Map();

function renderFavoritesList(favorites) {
  favoritesListContainer.innerHTML = "";
  favoritesMap.clear();

  favorites.forEach((fav) => {
    favoritesMap.set(fav.quizId, fav.quizTitle);
    addFavoritesListItem(fav.quizId, fav.quizTitle);
  });

  updateFavoritesCount();
}

function addToFavoritesList(quizId, quizTitle) {
  if (favoritesMap.has(quizId)) return;
  favoritesMap.set(quizId, quizTitle);
  addFavoritesListItem(quizId, quizTitle);
  updateFavoritesCount();
}

function removeFromFavoritesList(quizId) {
  favoritesMap.delete(quizId);
  const item = document.querySelector(`.favorite-item[data-quiz-id="${quizId}"]`);
  if (item) item.remove();
  updateFavoritesCount();
}

function addFavoritesListItem(quizId, quizTitle) {
  const item = document.createElement("div");
  item.className = "favorite-item";
  item.dataset.quizId = quizId;

  const titleSpan = document.createElement("span");
  titleSpan.textContent = quizTitle;

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-fav-btn";
  removeBtn.innerHTML = "&times;";
  removeBtn.title = "Remove from favorites";
  removeBtn.addEventListener("click", async () => {
    try {
      await removeFavorite(activeProfile.id, quizId);
      removeFromFavoritesList(quizId);
      const checkbox = document.querySelector(`input[type="checkbox"][data-quiz-id="${quizId}"]`);
      if (checkbox) {
        checkbox.checked = false;
        if (pendingAdditions.has(quizId)) {
          pendingAdditions.delete(quizId);
        } else if (!pendingRemovals.has(quizId)) {
          pendingRemovals.add(quizId);
        }
        updateSaveButtonState();
      }
      updateFavoritesCount();
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  });

  item.appendChild(titleSpan);
  item.appendChild(removeBtn);
  favoritesListContainer.appendChild(item);
}

function updateFavoritesCount() {
  const count = favoritesMap.size;
  favoritesCountSpan.textContent = count;
}

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
          // Delete avatar from Supabase if it exists
          if (profile.avatar_url) {
            await deleteAvatarFromSupabase(profile.avatar_url);
          }
          
          await deleteProfile(profile.id);
          const updatedProfiles = profiles.filter((p) => p.id !== profile.id);
          renderProfilesList(updatedProfiles);
          
          // Update localStorage
          localStorage.setItem("profiles", JSON.stringify(updatedProfiles));
          
          // If the deleted profile was the active one, switch to the first available profile
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

  // Only include avatar_url if it's a public URL (not a base64 data URL)
  // This prevents sending large payloads that cause 413 errors
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
      // Get existing profile to check for avatar changes
      const existingProfile = await fetchProfiles().then(profiles => 
        profiles.find(p => p.id === editingProfileId)
      );
      
      // If avatar was changed, delete the old one from Supabase
      if (existingProfile && existingProfile.avatar_url && 
          existingProfile.avatar_url !== avatarUrl && avatarUrl) {
        await deleteAvatarFromSupabase(existingProfile.avatar_url);
      }
      
      savedProfile = await updateProfile(editingProfileId, profileData);
      
      // Update local profiles array
      const localProfiles = JSON.parse(localStorage.getItem("profiles")) || [];
      const index = localProfiles.findIndex(p => p.id === editingProfileId);
      if (index !== -1) {
        localProfiles[index] = { ...localProfiles[index], ...profileData };
        localStorage.setItem("profiles", JSON.stringify(localProfiles));
      }
    } else {
      savedProfile = await createProfile(profileData);
      
      // Add to local profiles array and set as active
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

  // Convert canvas to blob instead of base64
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    avatarPreview.innerHTML = `<img src="${url}" alt="Avatar">`;

    cropModal.style.display = "none";
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    cropImage.src = "";

    // Upload avatar to Supabase and store the public URL
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

// ─── Save handler ───────────────────────────────────────────────────────────

async function handleSaveFavorites() {
  if (!saveBtn) return;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const profileId = activeProfile.id;

  try {
    for (const quizId of pendingAdditions) {
      await addFavorite(profileId, quizId);
    }

    for (const quizId of pendingRemovals) {
      await removeFavorite(profileId, quizId);
    }

    pendingAdditions.clear();
    pendingRemovals.clear();

    const favorites = await fetchFavorites(profileId);
    renderFavoritesList(favorites);

    const favoriteQuizIds = new Set(favorites.map((f) => f.quizId));
    document.querySelectorAll('input[type="checkbox"][data-quiz-id]').forEach((cb) => {
      cb.checked = favoriteQuizIds.has(cb.dataset.quizId);
    });

    updateSaveButtonState();
    saveBtn.textContent = "Saved!";
    setTimeout(() => {
      saveBtn.textContent = "Save Changes";
    }, 2000);
  } catch (error) {
    console.error("Error saving favorites:", error);
    showError(errorMessageEl, "Failed to save changes. Please try again.");
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
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

  // Wire up save button
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveFavorites);
    updateSaveButtonState();
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

    const favoriteQuizIds = new Set(favorites.map((f) => f.quizId));
    renderFavoritesList(favorites);
    renderQuizHierarchy(hierarchyData.subjects || [], hierarchyData.generalQuizzes || [], favoriteQuizIds);
  } catch (error) {
    console.error("Error loading settings:", error);
    showError(
      errorMessageEl,
      "Failed to load quiz data. Please check your connection and try again."
    );
  }
});