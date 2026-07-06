import { getBaseUrl } from "../../utils/path.js";
import { resolveVideos } from "../videos/videoResolver.js";
import { getBasePath } from "../../utils/sharedFunctions.js";
import { updateVideoListLazyHome } from "../videos/home-page/homePageLazyLoad.js"
import { resolveChannelVideos } from "../videos/channelVideos.js";

var searchResults = document.getElementById("searchResults");
var resultsList = document.getElementById("resultsList");
var searchBar = document.getElementById("searchBar");



document.addEventListener('DOMContentLoaded', () => {
    
    if (searchBar) {
        searchBar.addEventListener("input", function (event) {
            var searchQuery = event.target.value.toLowerCase(); // Get the search query

            if (searchQuery === "") {
                searchResults.style.display = "none"; // Hide results if search bar is empty
                return;
            }

            var searchFieldsArray = JSON.parse(localStorage.getItem("searchFieldsArray")) || [];

            var filteredSubcontents = searchFieldsArray.filter(function (item) {
            return item.subcontentName.toLowerCase().includes(searchQuery.toLowerCase());
            });

            // Display the filtered results
            displaySearchResults(filteredSubcontents);
        });

    }
});


// Display search results
function displaySearchResults(filteredSubcontents) {
    // Clear previous results
    resultsList.innerHTML = "";

    if (filteredSubcontents.length === 0) {
        resultsList.innerHTML = "<li>No results found.</li>";
        searchResults.style.display = "block"; // Show results dropdown
        return;
    }

    // Render each subcontent
    filteredSubcontents.forEach(function (subcontent) {
        var listItem = document.createElement("li");
        listItem.textContent = subcontent.subcontentName;

        // Store the full path in a data attribute
        //listItem.setAttribute("data-path", subcontent.path);

        // Add click listener to handle subcontent selection
        listItem.addEventListener("click", function () {
             

             if (!subcontent.locator.channel_id) {
                    
                                   resolveVideos(subcontent.locator, subcontent.subcontentName).then(videos => { 
                                    if (!videos || videos.length === 0) {
                                        console.warn("No videos resolved for locator:", subcontent.locator);
                                        return;
                                    } 
                                    videos.forEach(video => {
                                        video.locator = subcontent.locator; // Attach the locator to each video
                                    });
                                    console.log("Videos resolved on click:", videos);
                                    const isAfterLogin = localStorage.getItem("isAfterLogin");
                                    if (isAfterLogin) {
                                        localStorage.removeItem("isAfterLogin");
                                    }
                                        localStorage.setItem("videoList", JSON.stringify(videos)); // Store the resolved videos in localStorage for the home page to load
                                     searchResults.style.display = "none"; // Show results dropdown
                                     window.location.href = getBasePath()   + "index.html"; // Redirect to home page to reset the state
                                    
                                        
                                   }).catch(err => console.error("Error resolving videos on click:", err));

             }else{
                 // Fetch videos for this channel using the channel resolver
                                    resolveChannelVideos(subcontent.locator)
                                        .then(function(videos) {
                                            if (!videos || videos.length === 0) {
                                                console.warn("No videos found for channel:", channelName);
                                                return;
                                            }
                
                                          
                                           localStorage.setItem("videoList", JSON.stringify(videos)); // Store the resolved videos in localStorage for the home page to load
                                     searchResults.style.display = "none"; // Show results dropdown
                                     window.location.href = getBasePath()   + "index.html"; // Redirect to home page to reset the state
                                        })
                                        ["catch"](function(err) {
                                            console.error("Error fetching channel videos:", err);
                                        });
             }
                                 
                               
                           
        
        
        });

        resultsList.appendChild(listItem);
    });

    // Show results dropdown
    searchResults.style.display = "block";
}
//=========================== search ==============================


// Select the image
const backArrow = document.querySelector('.black-back-arrow');
const searchBox = document.querySelector('.search-box');
const searchSmall = document.querySelector('.search-small');
const navLeft = document.querySelector('.nav-left');
const navRight = document.querySelector('.nav-right');


// Add event listener
backArrow.addEventListener('click', () => {
    // Example action: go back one page
    navLeft.style.display = "block";
    navRight.style.display = "block";
    searchBox.style.display = "none";
    searchSmall.style.display = "block";
    backArrow.style.display = "none";
    // Or you can do something else, like:
    // console.log("Back arrow clicked!");
    // window.location.href = "/home"; // redirect
});
// Add event listener
searchSmall.addEventListener('click', () => {
    // Example action: go back one page
    navLeft.style.display = "none";
    navRight.style.display = "none";
    searchBox.style.display = "flex";
    searchSmall.style.display = "none";
    backArrow.style.display = "block";

    // Or you can do something else, like:
    // console.log("Back arrow clicked!");
    // window.location.href = "/home"; // redirect
});

export const fetchSubcontentsByGrade = async (gradeId) => {
  try {
    const url = getBaseUrl() + "/api/v1/search/subcontents/" + gradeId;
console.log("url:", url);
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken
      }
    });

    const data = await response.json();

    console.log("Subcontents:", data);

    return data;

  } catch (error) {
    console.error("Error fetching subcontents:", error);
  }
};