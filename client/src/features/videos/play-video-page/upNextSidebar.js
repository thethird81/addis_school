import {
    checkLiked,
    playVideo, getSelectedPart, showNotEnoughCoinsModal
} from "../../../components/iframe/iframe.js";
import { updateUserField } from "../../../utils/updateUserData.js";
import { getVideoData } from "../../../utils/sharedFunctions.js";
import { addCoins, subtructCoins } from "../../coin/coin.js";
const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
const grade = activeProfile ? activeProfile.grade : null;
var videoList = JSON.parse(localStorage.getItem("videoList") || "[]");
console.log("Video List:", videoList);
var watchTime = 0; // Tracks continuous watch time
function populateRightSidebar(videoList) {
    if (!videoList.length) {
        console.log("No videos found in localStorage.");
        return;
    }

    var rightSidebar = document.querySelector(".right-sidebar");
    rightSidebar.innerHTML = "";

    videoList.forEach(function (video) {
        var videoElement = document.createElement("div");
        videoElement.classList.add("side-video-list");

        var thumbnail = (video.thumbnails && video.thumbnails.medium) ?
            video.thumbnails.medium :
            (video.thumbnails && video.thumbnails.default) ?
                video.thumbnails.default : "";
        const videoPath = video.grade + "_" + video.subject + "_" + video.content + "_" + video.subcontent;
        videoElement.innerHTML =
            '<div class="small-thumbnail" data-video-id="' + video.videoId + '" data-video-path="' + videoPath + '">' +
            '<img src="' + thumbnail + '" alt="Thumbnail">' +
            '</div>' +
            '<div class="vid-info">' +
            '<div class= "title" data-video-id="' + video.videoId + '" data-video-path="' + videoPath + '">' + video.title + '</div>' +
            '<p>' + video.channelTitle + '</p>' +
            '</div>';

        rightSidebar.appendChild(videoElement);
    });

    addVideoClickListeners();
}

function addVideoClickListeners() {
    var videoElements = document.querySelectorAll(".side-video-list [data-video-id]");

    for (var i = 0; i < videoElements.length; i++) {
        (function (element) {
            element.addEventListener("click", function () {
                // Ensure earnedCoin is defined
                var earnedCoin = false; // Initialize earnedCoin if not already defined
                watchTime = 0;
                var coinCountElement = document.getElementById("coinCount");
                var videoId = element.getAttribute("data-video-id");
                var videoPath = element.getAttribute("data-video-path");
                localStorage.setItem('videoId', videoId);
                localStorage.setItem('videoPath', videoPath);



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
                    console.log("Selected Subject from upNextSidebar:", getVideoData("subject", videoPath));
                    if (getVideoData("subject", videoPath) === 'Entertainment' && grade != "KG" && loggedInUserId !== "vzTIlWdmgTZTF9zpEygFlcl8yFq1") {
                        coins = subtructCoins();
                        if (coins > 0) {
                            playVideo(videoId);
                            localStorage.setItem('videoId', videoId);
                            checkLiked(videoId);
                            updateUserField("coins", coins);
                            coinCountElement.textContent = coins;
                        } else {
                            showNotEnoughCoinsModal();
                            console.log("add coins");
                        }
                    } else {
                        playVideo(videoId);
                        localStorage.setItem('videoId', videoId);
                        checkLiked(videoId);
                        localStorage.setItem("earnedCoin", false);
                        coinCountElement.textContent = coins;
                    }
                }


            });
        })(videoElements[i]);
    }
}

//populateRightSidebar(videoList);