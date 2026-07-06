
import { populateRightSidebarLazy } from "./playVideoPageLazyLoad.js"
import { getLikedVideos } from "../../likes/likesLocalStore.js";   



const videoList = JSON.parse(localStorage.getItem("videoList"));
 if (videoList) {
    console.log("Video List from localStorage:", videoList.length);
    populateRightSidebarLazy(videoList, true);

} 

