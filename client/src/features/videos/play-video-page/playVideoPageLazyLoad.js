import { checkLiked, playVideo, getSelectedPart } from "../../../components/iframe/iframe.js";
import { showNotEnoughCoinsModal } from "../../../features/coin/coin.js";
import { updateUserField } from "../../../utils/updateUserData";
import { removeVideoById } from "../../admin/delete/deleteServices.js";
import { subtructCoins, addCoins } from "../../coin/coin.js";
import { resolveNamesFromLocator ,getGradeName} from "../../../utils/sharedFunctions.js";
const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
const grade_id = activeProfile ? activeProfile.grade_id : null;

let currentSidebarChunkIndex = 0;
const SIDEBAR_CHUNK_SIZE = 12;
var watchTime = 0; // Tracks continuous watch time
let videoList = [];
let isDelete = false

export function populateRightSidebarLazy(videos, reset) {

    if (reset) {

        console.log("Resetting video list...");
        if (!isDelete)
            shuffleArray(videos); // Shuffle the video list before assigning
        videoList = videos; // Replace the global video list
        localStorage.setItem("videoList", JSON.stringify(videoList));
        currentSidebarChunkIndex = 0; // Reset the chunk index

       // console.log("Video list reset. Current chunk index set to 0.");
    }
   // console.trace("populateRightSidebarLazy called with videos:", videos.length);
    const rightSidebar = document.querySelector(".right-sidebar");

    if (currentSidebarChunkIndex === 0) {
        rightSidebar.innerHTML = ""; // Clear existing videos on the first load
    }

    if (!Array.isArray(videos)) {
        console.error("Invalid videos input: Expected an array, but got:", videos);
        return;
    }

    const start = currentSidebarChunkIndex * SIDEBAR_CHUNK_SIZE;
    const end = start + SIDEBAR_CHUNK_SIZE;
    const chunk = videos.slice(start, end);

    if (!Array.isArray(chunk)) {
        console.error("Invalid chunk: Expected an array, but got:", chunk);
        return;
    }

    chunk.forEach(function (video) {
        const videoElement = document.createElement("div");
        videoElement.classList.add("side-video-list");

        const thumbnail = (video.thumbnails && video.thumbnails.medium) ?
            video.thumbnails.medium :
            (video.thumbnails && video.thumbnails.default) ?
                video.thumbnails.default : "";
       const textColor = video.locator.subject_name === "Entertainment" ? "red" : "green";
        videoElement.innerHTML =
            '<div class="small-thumbnail" data-video-id="' + video.videoId + '" >' +
            '<img src="' + thumbnail + '" alt="Thumbnail">' +
            '</div>' +
            '<div class="vid-info">' +
            '<div class= "title" data-video-id="' + video.videoId + '">' + video.title + '</div>' +
            '<p style="color: ' + textColor + '">' + video.locator.subject_name + "_" + video.channelTitle + '</p>' +
            '</div>';

              // 🔥 Add click listener to the whole card
              videoElement.addEventListener("click", () => {
                const accessToken = localStorage.getItem("accessToken");    
                if(!accessToken) {
                    playVideo(video);
                    return;
                 }  
                // Store locator safely
                localStorage.setItem("videoLocator", JSON.stringify(video.locator));
                localStorage.setItem("videoId", video.videoId);   
                
                
                 const sidebarData = JSON.parse(localStorage.getItem("sidebarData_Grade_" + grade_id)) || {} ;
               localStorage.setItem("clickedVideo", JSON.stringify(video));
                //     const videoLocator = JSON.parse(localStorage.getItem("videoLocator"));

                //   localStorage.setItem("currentVideo", JSON.stringify(video));  // Store the entire video object for later use
                //  console.log("Video locator stored in localStorage:", JSON.parse(localStorage.getItem("videoLocator")));
                //   const locatorName = resolveNamesFromLocator(sidebarData,videoLocator);
                //     console.log("resolveNamesFromLocator:",locatorName);
                //     localStorage.setItem("videoLocatorName", JSON.stringify(locatorName)); // Store the entire video object for later use
                //     console.log("subject from right sidebar click listener:", locatorName.subjectName);
                //     localStorage.setItem("subject", locatorName.subjectName); // Store the selected subject for later use in the play video page
               
                 
                 playVideo(video);
                 checkLiked(video.videoId);
              });

        rightSidebar.appendChild(videoElement);
    });
    addVideoClickListeners(videos);
    currentSidebarChunkIndex++;
}
export const getCurrentVideoList = () => {
    return localStorage.getItem("videoList") ? JSON.parse(localStorage.getItem("videoList")) : [];
}
export const updateRightSidebar = (videoId) => {
    //remove one video from the current video list and return the rest
    videoList = removeVideoById(getCurrentVideoList(), videoId);
    //use the returned video list to populat the side bar again
    isDelete = true;
    populateRightSidebarLazy(videoList, true)
}
//Add scroll event listener for lazy loading in the right sidebar
document.addEventListener("DOMContentLoaded", () => {
    const rightSidebarContainer = document.querySelector(".right-sidebar");
    if (rightSidebarContainer) {
        rightSidebarContainer.addEventListener("scroll", () => {
            if (rightSidebarContainer.scrollTop + rightSidebarContainer.clientHeight >= rightSidebarContainer.scrollHeight - 50) {
                if (currentSidebarChunkIndex * SIDEBAR_CHUNK_SIZE < videoList.length) {
                    populateRightSidebarLazy(videoList, false);
                }
            }
        });
    } else {
        console.error("Right sidebar container not found.");
    }
});

// document.addEventListener("DOMContentLoaded", () => {
//     const rightSidebar = document.querySelector(".right-sidebar");
//     if (rightSidebar) {
//         rightSidebar.addEventListener("click", function (event) {
//             const element = event.target.closest("[data-video-id]");
//             if (!element) {
//                 console.log("Click occurred outside video elements."); // Debug log for non-video clicks
//                 return; // Ignore clicks outside video elements
//             }

//             console.log("Element clicked:", element); // Debug log for clicked element
//             const videoId = element.getAttribute("data-video-id");
          
//             if (!videoId) {
//                 console.error("Video ID not found on clicked element.");
//                 return;
//             }

//             console.log("Video clicked:", { videoId, videoCategory });
//             localStorage.setItem("videoId", videoId);
//             localStorage.setItem("videoCategory", videoCategory);

//             // Call playVideo or any other function to handle the click
//             playVideo(videoId);
//         });
//     } else {
//         console.error("Right sidebar element not found.");
//     }
// });

function addVideoClickListeners(videos) {
    var videoElements = document.querySelectorAll(".side-video-list [data-video-id]");

    for (var i = 0; i < videoElements.length; i++) {
        (function (element) {
            element.addEventListener("click", function () {
                // Ensure earnedCoin is defined
                var earnedCoin = false; // Initialize earnedCoin if not already defined
                watchTime = 0;
                var coinCountElement = document.getElementById("coinCount");
                var videoId = element.getAttribute("data-video-id");
                var videoCategory = element.getAttribute("data-video-category");
                localStorage.setItem('videoId', videoId);
                localStorage.setItem('videoCategory', videoCategory);
                 const gradeName = getGradeName(grade_id);
                const subject = localStorage.getItem("subject");
                console.log("Selected Subject from upNextSidebar click listener:", subject);

                // Ensure loggedInUserId is defined
                var loggedInUserId = localStorage.getItem('loggedInUserId'); // Fetch loggedInUserId from localStorage
                if (!loggedInUserId) {
                    console.log("User not logged in.");
                    playVideo(videoId);
                    localStorage.setItem('videoId', videoId);
                }
                else {
                    let coins = JSON.parse(localStorage.getItem('activeProfile')).coins;
                    //var selectedSubject = getSelectedPart(1); // Uncommented line
                    if (subject === 'Entertainment' && gradeName != "KG 1" ) {
                        coins = subtructCoins();
                        if (coins > 0) {
                            playVideo(videoId);
                            localStorage.setItem('videoId', videoId);
                           
                            updateUserField("coins", coins);
                            coinCountElement.textContent = coins;
                        } else {
                            showNotEnoughCoinsModal();
                            console.log("add coins");
                        }
                    } else {
                        playVideo(videoId);
                        localStorage.setItem('videoId', videoId);
                        
                        localStorage.setItem("earnedCoin", false);
                        coinCountElement.textContent = coins;
                    }

                    checkLiked(videoId);
                }


            });
        })(videoElements[i]);
    }
}
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

