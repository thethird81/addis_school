import { getBasePath } from '../../utils/path';
import { deleteDatabase } from '../../features/store/indexeddbStore.js';
import '../../components/user-menu/user-menu.css';
import { getGradeName } from '../../utils/sharedFunctions.js';
import { getVideosByGrade } from "../../features/videos/videoResolver.js";
import '../../components/loading-spinner/loading-spinner.css';
import '../../components/loading-spinner/loading-spinner.js';
import { getBaseUrl } from '../../utils/path.js';


document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('userIcon').addEventListener("click", function () {
        toggleUserSidebar();
    });



    // Add click event listeners for menu items
    var aboutUsEl = document.getElementById("aboutUs");
    if (aboutUsEl) {
        aboutUsEl.textContent = "ℹ️ About Us";
        aboutUsEl.addEventListener('click', function () {
            window.location.href = `${getBasePath()}about-us.html`;
        });
    }

    var contactUsEl = document.getElementById("contactUs");
    if (contactUsEl) {
        contactUsEl.textContent = "📞 Contact Us";
        contactUsEl.addEventListener('click', function () {
            window.location.href = `${getBasePath()}contact-us.html`;
        });
    }
    
    var settingsEl = document.getElementById("settings");
    if (settingsEl) {
        settingsEl.textContent = "⚙️ Settings";
        settingsEl.addEventListener('click', function () {
            window.location.href = `${getBasePath()}settings.html`;
        });
    }

    // Make the 'Change Grade' button collapsible with arrows
    const changeGradeButton = document.getElementById('changeGrade');
    const profilesList = document.createElement('ul');
    profilesList.style.display = 'none';
    profilesList.classList.add('profile-list');
    profilesList.style.paddingLeft = '20px'; // Indent the profile list

    const profiles = JSON.parse(localStorage.getItem('profiles')) || [];
    let activeProfile = JSON.parse(localStorage.getItem('activeProfile'));

    // Display the selected profile grade
    if (activeProfile) {
        changeGradeButton.textContent = `🎯 Change Grade `;
    } else {
        changeGradeButton.textContent = '🎯 Change Grade';
    }

    const arrowSpan = document.createElement('span');
    arrowSpan.textContent = ' ▼';
    changeGradeButton.appendChild(arrowSpan);

    profiles.forEach(profile => {
          localStorage.removeItem("showChannelsGrid");
        const profileItem = document.createElement('li');
        profileItem.classList.add('profile-item');
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('profile-item-avatar');
        if (profile.avatar_url) {
            const img = document.createElement('img');
            img.src = profile.avatar_url;
            avatarDiv.appendChild(img);
        } else {
            avatarDiv.innerHTML = '<span class="avatar-placeholder">👶</span>';
        }
        
        // Name and grade info
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'display:flex;flex-direction:column;';
        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'font-weight:700;color:#fff;';
        nameSpan.textContent = profile.profile_name;
        const gradeSpan = document.createElement('span');
        gradeSpan.style.cssText = 'font-size:12px;color:#ffd700;';
        gradeSpan.textContent = getGradeName(profile.grade_id);
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(gradeSpan);
        
        profileItem.appendChild(avatarDiv);
        profileItem.appendChild(infoDiv);
        
        profileItem.addEventListener('click',  () => {
            // Show loading spinner during profile switch
            if (typeof LoadingSpinner !== 'undefined') {
                LoadingSpinner.show();
            }
            
            localStorage.setItem('activeProfile', JSON.stringify(profile));
       
            localStorage.setItem("videoList", JSON.stringify([]));  
           
            window.location.href = `${getBasePath()}index.html`; // Redirect to the home page
        });
        profilesList.appendChild(profileItem);
    });

    changeGradeButton.addEventListener('click', () => {
        const isExpanded = profilesList.style.display === 'block';
        profilesList.style.display = isExpanded ? 'none' : 'block';
        arrowSpan.textContent = isExpanded ? ' ▼' : ' ▲';
    });

    changeGradeButton.insertAdjacentElement('afterend', profilesList);

   
    // Update navbar user icon with active profile avatar
     activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
    if (activeProfile) {
        updateNavbarUserIcon(activeProfile);
    }

    document.addEventListener("click", function (event) {

        const userSidebar = document.getElementById('userSidebar');
        const userIcon = document.getElementById('userIcon');

        if (
            userSidebar &&
            !userSidebar.contains(event.target) &&
            userIcon !== event.target
        ) {
            userSidebar.classList.remove("visible");
        }
    });



});

const toggleUserSidebar = () => {
    console.log("user icon clicked");

    const userSidebar = document.getElementById('userSidebar');
    userSidebar.classList.toggle('visible');
};

export default toggleUserSidebar;

function updateNavbarUserIcon(profile) {
    const userIcon = document.getElementById('userIcon');
    if (!userIcon) return;
    
    if (profile.avatar_url) {
        userIcon.src = profile.avatar_url;
    } else {
        // Fall back to default user icon - use the original src
        userIcon.src = '<%= require("@assets/images/user-icon.png") %>';
    }
}

async function saveProfilesBeforeLogout() {
  const userId = localStorage.getItem("loggedInUserId");
  const profiles = JSON.parse(localStorage.getItem("profiles")) || [];
  
  if (!userId || profiles.length === 0) return;

  const baseUrl = getBaseUrl();
  
  for (const profile of profiles) {
    console.log("Saving profile coins:", profile.coins, "for profile ID:", profile.id);
    
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${baseUrl}/api/v1/profiles/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          coins: profile.coins
        })
      });

      if (response.ok) {
        console.log("Successfully updated profile:", profile.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error updating profile:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }
}
