import { getBasePath } from '../../utils/path.js';
import { getGradeName } from '../../utils/sharedFunctions.js';
import { getVideosByGrade } from "../../features/videos/videoResolver.js";
import { fetchSubcontentsByGrade } from '../search/search.js';
import '../../components/loading-spinner/loading-spinner.css';
import '../../components/loading-spinner/loading-spinner.js';

const profileSelectModal = document.getElementById('profileSelectModal');
const profileList = document.getElementById('profileList');

export function showProfileSelection() {
    const profiles = JSON.parse(localStorage.getItem('profiles')) || [];
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken || profiles.length === 0) {
        return;
    }

    // const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
    // if (activeProfile) {
    //     loadProfileContent(activeProfile);
    //     return;
    // }

    profileList.innerHTML = '';
    
    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-selection-card';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'profile-selection-avatar';
        if (profile.avatar_url) {
            const img = document.createElement('img');
            img.src = profile.avatar_url;
            avatarDiv.appendChild(img);
        } else {
            avatarDiv.innerHTML = '<span class="avatar-placeholder">👶</span>';
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'profile-selection-info';
        const nameDiv = document.createElement('div');
        nameDiv.className = 'profile-selection-name';
        nameDiv.textContent = profile.profile_name;
        const gradeDiv = document.createElement('div');
        gradeDiv.className = 'profile-selection-grade';
        gradeDiv.textContent = getGradeName(profile.grade_id);
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(gradeDiv);
        
        card.appendChild(avatarDiv);
        card.appendChild(infoDiv);
        
        card.addEventListener('click', () => {
            selectProfile(profile);
        });
        
        profileList.appendChild(card);
    });
    
    profileSelectModal.style.display = 'flex';
}

async function selectProfile(profile) {
    // Show loading spinner during profile selection
    if (typeof LoadingSpinner !== 'undefined') {
        LoadingSpinner.show();
    }
    
    localStorage.setItem('activeProfile', JSON.stringify(profile));
    profileSelectModal.style.display = 'none';
    await loadProfileContent(profile);
}

async function loadProfileContent(profile) {
    try {
        localStorage.setItem("videoList", JSON.stringify([]));
        
        await fetchSubcontentsByGrade(profile.grade_id);
        console.log("Subcontents for grade " + profile.grade_id + " fetched successfully.");
        
        const videos = await getVideosByGrade(profile.grade_id);
        localStorage.setItem("videoList", JSON.stringify(videos));
        
        updateNavbarUserIcon(profile);
        
        // Hide spinner on success before redirect
        if (typeof LoadingSpinner !== 'undefined') {
            setTimeout(function() {
                LoadingSpinner.hide();
            }, 500);
        }
        
        window.location.href = getBasePath() + "index.html";
    } catch (error) {
        console.error("Error loading profile content:", error);
        // Hide spinner on error
        if (typeof LoadingSpinner !== 'undefined') {
            setTimeout(function() {
                LoadingSpinner.hide();
            }, 1500);
        }
    }
}

function updateNavbarUserIcon(profile) {
    const userIcon = document.getElementById('userIcon');
    if (!userIcon) return;
    
    if (profile.avatar_url) {
        userIcon.src = profile.avatar_url;
    } else {
        userIcon.src = '<%= require("@assets/images/user-icon.png") %>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('accessToken');
    const activeProfile = localStorage.getItem('activeProfile');
    
    if (accessToken && !activeProfile) {
        setTimeout(() => {
            showProfileSelection();
        }, 300);
    } else if (activeProfile) {
        const profile = JSON.parse(activeProfile);
        updateNavbarUserIcon(profile);
    }
});