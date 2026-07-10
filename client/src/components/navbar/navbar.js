
import '../sidebar/sidebar.js';
import '../user-menu/userMenu.js';
import { getBasePath } from '../../utils/path';
import { getGradeName } from '../../utils/sharedFunctions.js';
import {getRandomVideosFromStores } from '../../features/videos/combinedVideos.js';
import { updateVideoListLazyHome } from '../../features/videos/home-page/homePageLazyLoad.js';
import { getVideosByGrade } from '../../features/videos/videoResolver.js';
import '../../components/loading-spinner/loading-spinner.css';
import '../../components/loading-spinner/loading-spinner.js';
var accessToken = localStorage.getItem('accessToken');
const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
console.log("activeProfile =", activeProfile);


document.addEventListener('DOMContentLoaded', () => {

    const coins = activeProfile ? activeProfile.coins : null;
    console.log("Active profile coins:", coins);
    const userName = activeProfile ? activeProfile.profile_name : null;
    const grades = JSON.parse(localStorage.getItem('grades'));
    const grade_id = activeProfile ? activeProfile.grade_id : null;
    console.log("Active profile grade_id:", grade_id);
    const grade = getGradeName(grade_id);
    document.getElementById("userNameDisplay").innerText = userName;

    // Select the element with the class name 'logo'
const logoElement = document.querySelector('.logo');

// Check if the element exists before adding the listener to avoid errors
if (logoElement) {

        
    logoElement.addEventListener('click', (event) => {
        if (!window.location.pathname.endsWith('index.html')) {
    window.location.href = getBasePath() + 'index.html';
}
           
        if(accessToken) {
         localStorage.removeItem("showChannelsGrid");
        // Show loading spinner
        if (typeof LoadingSpinner !== 'undefined') {
            LoadingSpinner.show();
        }

        getRandomVideosFromStores().then(videoList => {
            if (!videoList || videoList.length === 0) {

                console.warn("No videos fetched from stores");
    const grade_id = activeProfile ? activeProfile.grade_id : null;
            getVideosByGrade(grade_id).then(videos => {
                   localStorage.setItem("videoList", JSON.stringify(videos));
                    updateVideoListLazyHome(videos, true);
                    return;
            }).catch();

                
            }
            console.log("Fetched videos from stores:", videoList);
            localStorage.setItem("videoList", JSON.stringify(videoList));
            updateVideoListLazyHome(videoList, true);
            // Hide spinner on success
            if (typeof LoadingSpinner !== 'undefined') {
                LoadingSpinner.hide();
            }
        }).catch(error => {
            console.error("Error fetching random videos from stores:", error);
            // Hide spinner on error
            if (typeof LoadingSpinner !== 'undefined') {
                setTimeout(function() {
                    LoadingSpinner.hide();
                }, 1500);
            }
        });}else{
     console.log("User is not logged in. Fetching random videos for logged out user.");
             const  videoList = JSON.parse(
          localStorage.getItem("videoList"));
            if (videoList && videoList.length > 0) {
                console.log("Video List from localStorage for logged out user:", videoList.length);
                    
              updateVideoListLazyHome(videoList, true);
              return;
            }
}



       
    });
}

    if (accessToken) {

        if(grade !== "KG 1") {
            var coinCountElement = document.getElementById("coinCount");
            coinCountElement.textContent = coins;
            document.getElementById("coinContainer").style.display = "block";
           
        }
        

    }




});
