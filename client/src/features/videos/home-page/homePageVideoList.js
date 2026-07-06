 import { updateVideoListLazyHome } from "./homePageLazyLoad.js";
 import {  getRandomVideos ,getVideosByGrade} from "../videoResolver.js";
import { getLastWatchedVideos } from "../../../features/lastwatched/lastWatchedLocalStore.js"; 
import { displayChannels } from "../../../components/sidebar/sidebarServices.js";
 const listVideos = () => {

    const showChannelsGrid = localStorage.getItem("showChannelsGrid") === "true";
    const videoList = JSON.parse(
    localStorage.getItem("videoList"));
    console.log("Video List from localStorage:", videoList);
   
 const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));

    if (showChannelsGrid && activeProfile && activeProfile.grade_id) {
        console.log("removing showChannelsGrid and displaying channels for grade:", activeProfile.grade_id);
        localStorage.removeItem("showChannelsGrid");
        displayChannels(activeProfile.grade_id);
        return;
    }

         if (activeProfile && videoList && videoList.length > 0) {
            
                 updateVideoListLazyHome(videoList, true);
            } else if (activeProfile) {    
             getVideosByGrade(activeProfile.grade_id).then(v => {
                console.log("Video List from Supabase for grade_id", ":", v);
                localStorage.setItem("videoList", JSON.stringify(v));
                updateVideoListLazyHome(v, true);
            }).catch(error => {
                console.error("Error fetching videos by grade:", error);
            });
        }       
        
        else {
            const  videoList = JSON.parse(
          localStorage.getItem("videoList"));
            if (videoList && videoList.length > 0) {
                console.log("Video List from localStorage for logged out user:", videoList.length);
                    
              updateVideoListLazyHome(videoList, true);
              return;
            }
        
        //LOGGED OUT USER
        getRandomVideos().then(videoList => {
           if (!videoList || videoList.length === 0) {
                console.warn("No videos fetched from Supabaset");
                return;
            } 
           localStorage.setItem("videoList", JSON.stringify(videoList));
           console.log("Video List from Supabase for logged out user:", videoList.length);  
            updateVideoListLazyHome(videoList, true);
        }).catch(error => {
            console.error("Error fetching random videos from Supabase:", error);
        });
    }

 }

listVideos();
