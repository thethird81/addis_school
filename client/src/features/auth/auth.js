import{getBaseUrl} from '../../utils/path.js';
import '../../components/loading-spinner/loading-spinner.css';
import '../../components/loading-spinner/loading-spinner.js';
const BASE_URL = getBaseUrl();

const SUPABASE_URL = 'https://ovgqocnjucycdupwspme.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yIrzKXTGyNug3EmKBlJ-8Q_ZPFw-YnY';

// Helper function to check for modern JavaScript API support
var supportsModernJS = function() {
    try {
        // 1. Check for basic global APIs that Supabase requires
        var hasGlobals = typeof window !== 'undefined' && 'fetch' in window && 'Promise' in window;
        
        if (!hasGlobals) {
            return false;
        }

        // 2. Test if the browser engine can parse dynamic import syntax.
        // We wrap this inside 'new Function' so old browsers don't throw an 
        // immediate syntax error while reading the script file.
        new Function('import("").catch(function() {})')();
        
        return true;
    } catch (e) {
        // If the browser panics at the 'import' keyword, it's a legacy browser.
        return false;
    }
};

// Supabase client instance (will be initialized asynchronously)
let supabase = null;

// Async initialization of Supabase client
const initializeSupabase = async () => {
    if (!supportsModernJS()) {
        console.warn('⚠️ Legacy browser detected. Modern JavaScript features (fetch, Promise, dynamic import) are not supported. Some features may not work correctly.');
        return null;
    }
    
    // Show loading spinner during initialization
    if (typeof LoadingSpinner !== 'undefined') {
        LoadingSpinner.show();
    }
    
    try {
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized successfully');
        
        // Hide loading spinner on success
        if (typeof LoadingSpinner !== 'undefined') {
            LoadingSpinner.hide();
        }
        
        return supabase;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        
        // Hide loading spinner on error
        if (typeof LoadingSpinner !== 'undefined') {
            LoadingSpinner.hide();
        }
        
        return null;
    }
};

// Initialize Supabase on module load (non-blocking)
initializeSupabase();
const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');


document.getElementById('signUpButton').addEventListener('click', () => {
    const signInForm = document.getElementById('signIn');
    const signUpForm = document.getElementById('signup');
    signInForm.style.display = "none";
    signUpForm.style.display = "block";
});

signInButton.addEventListener('click', () => {
    const signInForm = document.getElementById('signIn');
    const signUpForm = document.getElementById('signup');
    signInForm.style.display = "block";
    signUpForm.style.display = "none";
});

// Full page sign-up modal management
const fullSignUpModal = document.getElementById('fullSignUpModal');
const openFullSignUpBtn = document.getElementById('openFullSignUpBtn');
const closeFullSignUpBtn = document.getElementById('closeFullSignUpBtn');
const signUpView = document.getElementById('signUpView');
const addChildView = document.getElementById('addChildView');
const modalTitle = document.getElementById('modalTitle');

openFullSignUpBtn?.addEventListener('click', async () => {
    // Check if Supabase was initialized successfully
    if (!supabase) {
        console.log('⚠️ Your browser does not support modern JavaScript features required for registration.\n\nPlease use a modern browser (Chrome, Firefox, Edge, or Safari) to complete your registration.');
        return;
    }
    
    fullSignUpModal.style.display = "flex";
    showSignUpView();
    const form = document.getElementById('fullSignUpForm');
    if (form) form.reset();
    children = [];
    window.signUpChildren = [];
    renderChildrenList();
});

closeFullSignUpBtn?.addEventListener('click', () => {
    fullSignUpModal.style.display = "none";
});

fullSignUpModal?.addEventListener('click', (e) => {
    if (e.target === fullSignUpModal) {
        fullSignUpModal.style.display = "none";
    }
});

// View switching
const showSignUpView = () => {
    signUpView.style.display = "block";
    addChildView.style.display = "none";
    modalTitle.textContent = "🌟 Create Your Account";
};

const showAddChildView = (editChildId = null) => {
    signUpView.style.display = "none";
    addChildView.style.display = "block";
    modalTitle.textContent = editChildId ? "✏️ Edit Child" : "👶 Add a Child";
    window.editingChildId = editChildId;
    resetAvatarPreview();
    if (editChildId) {
        const child = children.find(c => c.id === editChildId);
        if (child) {
            document.getElementById('childName').value = child.name;
            document.getElementById('childGradeSelect').value = child.gradeId;
            if (child.avatarUrl) {
                updateAvatarPreview(child.avatarUrl);
            }
        }
    } else {
        document.getElementById('addChildForm').reset();
    }
};

// Avatar cropping variables
let cropper = null;
let currentCroppedBlob = null;

// Avatar upload and crop
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
const childAvatarInput = document.getElementById('childAvatar');
const avatarPreview = document.getElementById('avatarPreview');
const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const doneCropBtn = document.getElementById('doneCropBtn');
const cancelCropBtn = document.getElementById('cancelCropBtn');

uploadAvatarBtn?.addEventListener('click', () => {
    childAvatarInput?.click();
});

childAvatarInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        cropImage.src = event.target.result;
        cropModal.style.display = "flex";
        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            background: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            minCropBoxWidth: 100,
            minCropBoxHeight: 100,
        });
    };
    reader.readAsDataURL(file);
    childAvatarInput.value = '';
});

doneCropBtn?.addEventListener('click', () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    canvas.toBlob((blob) => {
        currentCroppedBlob = blob;
        const url = URL.createObjectURL(blob);
        updateAvatarPreview(url);
        cropModal.style.display = "none";
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }, 'image/jpeg', 0.8);
});

cancelCropBtn?.addEventListener('click', () => {
    cropModal.style.display = "none";
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    currentCroppedBlob = null;
});

cropModal?.addEventListener('click', (e) => {
    if (e.target === cropModal) {
        cropModal.style.display = "none";
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        currentCroppedBlob = null;
    }
});

const updateAvatarPreview = (url) => {
    avatarPreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
    avatarPreview.appendChild(img);
};

const resetAvatarPreview = () => {
    avatarPreview.innerHTML = '<span class="avatar-placeholder">👶</span>';
    currentCroppedBlob = null;
};

// Child profiles management
let children = [];

const fetchGrades = async () => {
    const grade = JSON.parse(localStorage.getItem('grades'));
    if (grade) {
        console.log("Using cached grades from localStorage:", grade);
        return grade;
    }
    try {
    const res = await fetch(`${BASE_URL}/api/v1/sidebar/grades`, {
      method: "GET",
      
    });
    const data = await res.json();
    console.log("Grades:", data);
    return data;
  } catch (err) {
    console.error("Error fetching grades:", err);
    return {};
  }
};

let grade = {};

(async () => {
    grade = await fetchGrades();
    localStorage.setItem('grades', JSON.stringify(grade));
    populateModalGradeDropdown();
})();

const populateModalGradeDropdown = () => {
    const gradeSelect = document.getElementById('childGradeSelect');
    if (!gradeSelect) return;
    gradeSelect.innerHTML = '<option value="" disabled selected>Select Grade</option>';
    for (const key in grade) {
        if (!grade.hasOwnProperty(key)) continue;
        const option = document.createElement('option');
        option.value = key;
        option.textContent = grade[key];
        gradeSelect.appendChild(option);
    }
};

// Add Child button
const addChildBtn = document.getElementById('addChildBtn');
addChildBtn?.addEventListener('click', () => showAddChildView(null));

// Cancel button
const cancelChildBtn = document.getElementById('cancelChildBtn');
cancelChildBtn?.addEventListener('click', () => showSignUpView());

// Add/Edit child form submit
const addChildForm = document.getElementById('addChildForm');
addChildForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const childName = document.getElementById('childName').value.trim();
    const childGrade = document.getElementById('childGradeSelect').value;
    if (!childName || !childGrade) {
        alert('Please enter child name and select a grade.');
        return;
    }
    let avatarUrl = null;
    if (currentCroppedBlob) {
        try {
            avatarUrl = await uploadAvatarToSupabase(currentCroppedBlob);
        } catch (err) {
            console.error('Avatar upload failed:', err);
            alert('Failed to upload avatar. Please try again.');
            return;
        }
    } else {
        const editingId = window.editingChildId;
        if (editingId) {
            const existingChild = children.find(c => c.id === editingId);
            avatarUrl = existingChild ? existingChild.avatarUrl : null;
        }
    }
    saveChild(childName, childGrade, avatarUrl);
});

const uploadAvatarToSupabase = async (blob) => {
    // Show loading spinner during upload
    if (typeof LoadingSpinner !== 'undefined') {
        LoadingSpinner.show();
    }
    
    try {
        // Wait for supabase to be initialized if it's still null
        if (!supabase) {
            console.warn('⏳ Supabase client not yet initialized, waiting...');
            // Poll until supabase is initialized or timeout
            const maxWait = 5000; // 5 seconds timeout
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
        // Hide spinner after a short delay
        if (typeof LoadingSpinner !== 'undefined') {
            setTimeout(function() {
                LoadingSpinner.hide();
            }, 500);
        }
    }
};

const saveChild = (name, gradeId, avatarUrl) => {
    const editingId = window.editingChildId;
    if (editingId) {
        const index = children.findIndex(c => c.id === editingId);
        if (index !== -1) {
            children[index] = { ...children[index], name, gradeId, avatarUrl };
        }
    } else {
        children.push({ id: Date.now(), name, gradeId, avatarUrl });
    }
    window.signUpChildren = children;
    renderChildrenList();
    showSignUpView();
};

const editChild = (childId) => showAddChildView(childId);

const removeChild = (childId) => {
    children = children.filter(child => child.id !== childId);
    window.signUpChildren = children;
    renderChildrenList();
};

const renderChildrenList = () => {
    const childrenList = document.getElementById('childrenList');
    if (!childrenList) return;
    childrenList.innerHTML = '';
    if (children.length === 0) {
        childrenList.innerHTML = '<p style="color:rgba(255,255,255,0.5); font-size:13px; text-align:center; padding:10px;">No children added yet. Click "+ Add Child" to start!</p>';
        return;
    }
    children.forEach(child => {
        const childCard = document.createElement('div');
        childCard.className = 'child-card';
        childCard.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.1);border-radius:12px;padding:10px 15px;margin-bottom:8px;border:2px solid rgba(255,255,255,0.2);';
        const childInfo = document.createElement('div');
        childInfo.style.cssText = 'display:flex;align-items:center;gap:10px;';
        if (child.avatarUrl) {
            const avatarImg = document.createElement('img');
            avatarImg.src = child.avatarUrl;
            avatarImg.style.cssText = 'width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #fff;';
            childInfo.appendChild(avatarImg);
        } else {
            const avatarPlaceholder = document.createElement('div');
            avatarPlaceholder.style.cssText = 'width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#ff9a9e,#fad0c4);display:flex;align-items:center;justify-content:center;font-size:20px;';
            avatarPlaceholder.textContent = '👶';
            childInfo.appendChild(avatarPlaceholder);
        }
        const nameGrade = document.createElement('div');
        nameGrade.style.cssText = 'flex:1;';
        nameGrade.innerHTML = `<strong style="color:#fff;font-size:14px;">${child.name}</strong><br><span style="color:#ffd700;font-size:12px;">${grade[child.gradeId] || child.gradeId}</span>`;
        childInfo.appendChild(nameGrade);
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.className = 'edit-btn';
        editBtn.onclick = () => editChild(child.id);
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.style.cssText = 'background:#ff6b6b;color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:16px;font-weight:bold;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;';
        removeBtn.onmouseenter = () => removeBtn.style.transform = 'scale(1.2)';
        removeBtn.onmouseleave = () => removeBtn.style.transform = 'scale(1)';
        removeBtn.onclick = () => removeChild(child.id);
        childInfo.appendChild(editBtn);
        childInfo.appendChild(removeBtn);
        childCard.appendChild(childInfo);
        childrenList.appendChild(childCard);
    });
};

renderChildrenList();