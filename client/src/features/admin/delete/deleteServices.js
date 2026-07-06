// import { db } from "../../../utils/firebaseConfig.js";
// import { getVideoData } from "../../../utils/sharedFunctions.js";
// import { removeFromIndexedDB } from "../../store/indexeddbStore.js";
// import { populateRightSidebarLazy } from "../../videos/play-video-page/playVideoPageLazyLoad.js";
// // Example usage:
// export const deleteVideo = (videoId, currentVideoList) => {
//     const videoPath = localStorage.getItem('videoPath'); // Get the video path from localStorage
//     console.log("Video path:==================================================", videoPath);
//     showDeleteConfirmationModal(function () {
//         //get the current videoId

//         // get the current videoList
//         var videoList = JSON.parse(localStorage.getItem("videoList") || "[]");
//         //remove the video and update the rest and save it to local storage

//         if (videoList) {
//             const updatedVideoList = removeVideoById(videoList, videoId);
//             removeVideoFromFirestore(videoId, updatedVideoList);
//             localStorage.setItem("videoList", JSON.stringify(updatedVideoList));
//             populateRightSidebarLazy(updatedVideoList, false);
//             console.log(updatedVideoList.length);
//         } else {


//             const updatedVideoList = removeVideoById(videoList, videoId);
//             populateRightSidebarLazy(updatedVideoList, false);
//             removeVideoFromFirestore(videoId, updatedVideoList);
//             console.log(updatedVideoList.length);
//         }

//         //remove the video from indexeddb videos

//         //remove the video from the firestore

//         //fetch the videos from indexed db and populate the right side bar again

//         //choose a random video and take the video id and give it to the player
//         removeFromIndexedDB(videoId);


//         console.log("Video deleted!");
//         // Call your actual delete function here
//     });
// }


// export function removeVideoFromFirestore(videoId, videoList) {
//     // var contentPath = getSelectedPart(0) + "_" + getSelectedPart(1) + "_" + getSelectedPart(2);
//     // var subcontent = getSelectedPart(3);
//     const videoPath = localStorage.getItem('videoPath');
//     var contentPath = getVideoData("grade", videoPath) + "_" + getVideoData("subject", videoPath) + "_" + getVideoData("content", videoPath);
//     var subcontent = getVideoData("subcontent", videoPath);
//     //var videoList = JSON.parse(localStorage.getItem("videoList") || "[]");

//     var contentRef = db.collection("contents").doc(contentPath);

//     contentRef.get().then(function (doc) {
//         if (doc.exists) {
//             var data = doc.data();
//             var subcontents = data.subcontents || [];

//             // Find the subcontent
//             for (var i = 0; i < subcontents.length; i++) {
//                 if (subcontents[i].subcontent === subcontent) {
//                     var videos = subcontents[i].videos || [];

//                     // Update the subcontent's videos array
//                     subcontents[i].videos = videoList;

//                     // Update Firestore
//                     contentRef.update({ subcontents: subcontents })
//                         .then(function () {
//                             console.log("Video removed successfully!");
//                         })
//                         .catch(function (error) {
//                             console.error("Error updating Firestore:", error);
//                         });

//                     return; // Exit loop once subcontent is found and updated
//                 }
//             }
//             console.log("Subcontent not found.");
//         } else {
//             console.log("Content document does not exist.");
//         }
//     }).catch(function (error) {
//         console.error("Error fetching document:", error);
//     });
// }

// export function removeVideoById(videos, videoId) {
//     var updatedVideos = [];
//     for (var i = 0; i < videos.length; i++) {
//         if (videos[i].videoId !== videoId) {
//             updatedVideos.push(videos[i]);
//         }
//     }
//     return updatedVideos;
// }
// // Function to show the delete confirmation modal
// function showDeleteConfirmationModal(onConfirm) {
//     var modal = document.getElementById("quizModal");
//     var overlay = document.getElementById("overlay");

//     // Set the question text to the delete confirmation message
//     var questionText = document.getElementById("questionText");
//     var quizContent = document.querySelector(".quiz-content");
//     questionText.innerHTML = "Are you sure you want to delete this video?";

//     // Clear any previous content from the answer container
//     var answerContainer = document.getElementById("answerContainer");
//     answerContainer.innerHTML = "";

//     // Create the "Yes" button
//     var confirmButton = document.createElement("button");
//     confirmButton.classList.add("btn");
//     confirmButton.textContent = "Yes, Delete";
//     confirmButton.style.background = "red";
//     confirmButton.style.color = "white";

//     confirmButton.addEventListener("click", function () {
//         modal.classList.remove("active");
//         overlay.classList.remove("active");
//         onConfirm(); // Call the function passed to confirm deletion
//     });

//     // Create the "No" button
//     var cancelButton = document.createElement("button");
//     cancelButton.classList.add("btn");
//     cancelButton.textContent = "Cancel";
//     cancelButton.style.background = "gray";
//     cancelButton.style.color = "white";

//     cancelButton.addEventListener("click", function () {
//         modal.classList.remove("active");
//         overlay.classList.remove("active");
//     });

//     // Append buttons to the answer container
//     answerContainer.appendChild(confirmButton);
//     answerContainer.appendChild(cancelButton);

//     // Show the modal and overlay
//     modal.classList.add("active");
//     overlay.classList.add("active");
// }