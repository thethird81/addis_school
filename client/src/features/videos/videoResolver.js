//import { supabase } from "../../utils/supabaseClient.js";
import { getBasePath,getBaseUrl} from '../../utils/path.js';
import { getGradeName ,refresh } from '../../utils/sharedFunctions.js';
/*********************************
 * CONFIG
 *********************************/
const YOUTUBE_API_KEY = "AIzaSyC4t0hI2mQx58U3u5hKS6TiTboPMzaienM";
const YOUTUBE_MAX_RESULTS = 30;

/*********************************
 * INDEXED DB (SUBJECTS STORE — flat, keyed by subcontent_id)
 * 
 * Design:
 * - Uses a flat "subjects" store, keyed by the subcontent_id.
 * - The entry stores videos WITHOUT locator embedded.
 * - Locator is stored once on the entry and attached to each video
 *   only when data is retrieved/returned.
 *********************************/
const DB_NAME = "profiles_db";
const DB_VERSION = 8;
const STORE_NAME = "subjects";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

   request.onupgradeneeded = (e) => {
  const db = e.target.result;

  if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" }); // subcontent_id
  }
  // Ensure channels store also exists (added by channelVideos.js at version 2)
  if (!db.objectStoreNames.contains("channels")) {
        db.createObjectStore("channels", { keyPath: "id" });
  }
};

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/*********************************
 * GET VIDEOS FROM INDEXED DB
 * Flat lookup by subcontent_id.
 * Attaches entry-level locator to each video before returning.
 *********************************/
async function getFromIndexedDB(locator) {
  const subcontentId = locator.subcontent_id;
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(subcontentId);

    req.onsuccess = () => {
      const entry = req.result;
      if (!entry) return resolve(null);

      // Check if cache is still fresh (24 hours)
      const cacheAge = Date.now() - (entry.cached_at || 0);
      const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge > CACHE_TTL) {
        console.log("Subcontent cache expired for", subcontentId);
        return resolve(null);
      }

      console.log("Loaded videos from IndexedDB for subcontent:", subcontentId);

      // Attach entry-level locator to each video before returning
      const videosWithLocator = (entry.videos || []).map(v => ({
        ...v,
        locator: entry.locator || null
      }));

      resolve(videosWithLocator);
    };

    req.onerror = () => resolve(null);
  });
}

/*********************************
 * SAVE VIDEOS INTO INDEXED DB
 * Flat save — entry is keyed by subcontent_id.
 * Locator stored once on the entry, not on individual videos.
 *********************************/
async function saveToIndexedDB(locator, videos) {
  const subcontentId = locator.subcontent_id;
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const entry = {
      id: subcontentId,
      videos: videos,
      cached_at: Date.now(),
      locator: locator
    };

    const putReq = store.put(entry);

    putReq.onsuccess = () => {
      console.log("Saved videos to IndexedDB for subcontent:", subcontentId);
      resolve(true);
    };
    putReq.onerror = () => reject(putReq.error);
  });
}

/*********************************
 * SUPABASE
 *********************************/
async function getVideosFromSupabase(subcontentId, locator) {

    
 try {
    // Include full curriculum context so the backend returns only matching videos
    const params = new URLSearchParams();
    if (locator?.grade_id) params.append("gradeId", locator.grade_id);
    if (locator?.subject_id) params.append("subjectId", locator.subject_id);
    if (locator?.content_id) params.append("contentId", locator.content_id);
    // Include profileId to filter out reported videos
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
    if (activeProfile && activeProfile.id) {
      params.append("profileId", activeProfile.id);
    }
    const queryString = params.toString();
    const url = `${getBaseUrl()}/api/v1/videos/subcontents/${subcontentId}${queryString ? `?${queryString}` : ""}`;
    console.log("Fetching videos from Supabase with URL:", url);
    const accessToken = localStorage.getItem("accessToken");
    let response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    });
    // If access token expired
  if (response.status === 401) {
    // call refresh token endpoint
    console.log("Access token expired. Attempting to refresh...");
    const newAccessToken = await refresh();
    console.log("New access token obtained:", newAccessToken);
    if (!newAccessToken) {
      throw new Error("Unable to refresh access token");
    } 
    // retry original request with new access token
     response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newAccessToken}`
      }
    }); 
  }
    if (!response.ok) {
      console.error(`Supabase response error: ${response.status} ${response.statusText}`);
      return null;
    };

    const data = await response.json();

    if (!data || !data.length) return null;
    console.log("Fetched videos from Supabase for subcontentId", subcontentId, ":", data);

    return data;


    
  } catch (error) {
    console.error("Error fetching videos:", error);
    return null;
  }
}

async function saveVideosToSupabase(locator, videos) {
   try {
    const accessToken = localStorage.getItem("accessToken");
    const url = `${getBaseUrl()}/api/v1/videos/save`;
    
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        subcontentId: locator.subcontent_id,
        contentId: locator.content_id,
        subjectId: locator.subject_id,
        gradeId: locator.grade_id,
        videos
      })
    });
     // If access token expired
  if (response.status === 401) {
    // call refresh token endpoint
    console.log("Access token expired. Attempting to refresh...");
    const newAccessToken = await refresh();
    console.log("New access token obtained:", newAccessToken);
    if (!newAccessToken) {
      throw new Error("Unable to refresh access token");
    } 
    // retry original request with new access token
      response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newAccessToken}`
      },
      body: JSON.stringify({
        subcontentId: locator.subcontent_id,
        contentId: locator.content_id,
        subjectId: locator.subject_id,
        gradeId: locator.grade_id,
        videos
      })
    });
  }
    if (!response.ok) {
      throw new Error("Failed to save videos");
    }

    return await response.json();

  } catch (error) {
    console.error("Save videos error:", error);
  }
}

/*********************************
 * YOUTUBE
 * Returns videos WITHOUT locator attached.
 * The caller (resolveVideos) attaches locator.
 *********************************/
async function fetchFromYouTube(query) {
  console.log("Fetching medium and long videos from YouTube with query:", query);

  // 1. Helper function to generate the API URL for a specific duration
  const getUrl = (duration) => 
    "https://www.googleapis.com/youtube/v3/search" +
    `?part=snippet&type=video&maxResults=${YOUTUBE_MAX_RESULTS}` +
    `&q=${encodeURIComponent(query)}` +
    `&videoDuration=${duration}` + 
    `&key=${YOUTUBE_API_KEY}`;

  try {
    // 2. Fire both requests concurrently to save time
    const [mediumRes, longRes] = await Promise.all([
      fetch(getUrl('medium')),
      fetch(getUrl('long'))
    ]);

    const mediumJson = await mediumRes.json();
    const longJson = await longRes.json();

    // 3. Combine items from both responses safely
    const combinedItems = [...(mediumJson.items || []), ...(longJson.items || [])];

    // 4. Use a Map to filter duplicates dynamically while transforming the data
    const uniqueVideosMap = new Map();

    combinedItems.forEach(item => {
      const videoId = item.id?.videoId;
      
      // Only add to the Map if we haven't seen this videoId yet
      if (videoId && !uniqueVideosMap.has(videoId)) {
        uniqueVideosMap.set(videoId, {
          videoId: videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          channelId: item.snippet.channelId,
          thumbnails: {
            default: item.snippet.thumbnails?.default?.url || "",
            medium: item.snippet.thumbnails?.medium?.url || "",
            high: item.snippet.thumbnails?.high?.url || ""
          }
          // NOTE: locator is NOT embedded here.
          // It's attached by resolveVideos when saving/returning.
        });
      }
    });

    // 5. Convert the map values back to a standard array
    return Array.from(uniqueVideosMap.values());

  } catch (error) {
    console.error("Error fetching or merging YouTube videos:", error);
    return [];
  }
}

/*********************************
 * ATTACH LOCATOR TO VIDEOS
 * Helper to spread locator onto each video in the array.
 *********************************/
function attachLocator(videos, locator) {
  return (videos || []).map(v => ({ ...v, locator }));
}

/*********************************
 * MAIN RESOLVER
 * Cache hierarchy: IndexedDB → Supabase → YouTube
 * Locator is stored once on the IDB entry and
 * attached to each video only when returning.
 *********************************/
export async function resolveVideos(locator, subcontentName) {
  // 1️⃣ IndexedDB
  //    getFromIndexedDB already attaches locator to each video.
  const cached = await getFromIndexedDB(locator);
  if (cached) {
    console.log("subcontentName:", subcontentName);
    console.log("Loaded from IndexedDB");
    return cached;
  }

  // 2️⃣ Supabase
  const dbVideos = await getVideosFromSupabase(locator.subcontent_id, locator);
  console.log("Videos fetched from Supabase:", dbVideos); 
  if (dbVideos) {
    console.log("Loaded from Supabase");
    //const videosWithLocator = attachLocator(dbVideos, locator);
     saveToIndexedDB(locator, dbVideos);
    return dbVideos;
  }

//   // 3️⃣ YouTube
//   console.log("Fetching from YouTube");
// const gradeID = localStorage.getItem("activeProfile") ? JSON.parse(localStorage.getItem("activeProfile")).grade_id : null;  

//   const ytVideos = await fetchFromYouTube("grade " + getGradeName(gradeID)+ " " + subcontentName);
//     console.log(ytVideos);

//     if (ytVideos && ytVideos.length > 0) {
//       const videosWithLocator = attachLocator(ytVideos, locator);
//        saveVideosToSupabase(locator, ytVideos);
//        saveToIndexedDB(locator, ytVideos);
//       return videosWithLocator;
//     }

  return null;
}

/*********************************
 * GET ALL VIDEOS FROM INDEXED DB
 * Reads from the flat "subjects" store.
 * Each entry has a locator, which gets attached to its videos.
 *********************************/
export async function getAllVideosFromIndexedDB(grade_id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const allEntries = req.result || [];
      const allVideos = [];

      for (const entry of allEntries) {
        // Only include entries belonging to this grade
        if (entry.locator && entry.locator.grade_id !== grade_id) continue;        
        if (!entry.videos || !Array.isArray(entry.videos)) continue;

        const entryLocator = entry.locator || null;

        for (const video of entry.videos) {
          allVideos.push({
            ...video,
            locator: entryLocator
          });
        }
      }

console.log("Total videos fetched from IndexedDB for grade_id", grade_id, ":", allVideos.length);
console.log("Sample video from IndexedDB:", allVideos[0]);
      resolve(allVideos);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function getRandomVideos() {
  const videoListLoggedOut = JSON.parse(localStorage.getItem("videoListLoggedOut")); 
  if (videoListLoggedOut && videoListLoggedOut.length > 0) {
    console.log("Using cached random video list from localStorage for logged out user:", videoListLoggedOut);
    return videoListLoggedOut;
  } 
  try {
    const url = getBaseUrl() + "/api/v1/videos/random";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/cjson"
      }
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (!data || !data.length) return null;
    console.log("Fetched random videos from Supabase for logged out user:", data);

    return data

  } catch (error) {
    console.error("Error fetching random videos:", error);
    return null;
  }
}

export const getVideosByGrade = async (gradeId) => {
  
  try {
    // Get active profile to filter out reported videos
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
    const profileId = activeProfile ? activeProfile.id : null;
    const url = getBaseUrl() + "/api/v1/videos/grade/" + gradeId + (profileId ? "?profileId=" + profileId : "");
    const accessToken = localStorage.getItem("accessToken");
    let response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

       // If access token expired
  if (response.status === 401) {
    // call refresh token endpoint
    console.log("Access token expired. Attempting to refresh...");
    const newAccessToken = await refresh();
    console.log("New access token obtained:", newAccessToken);
    if (!newAccessToken) {
      throw new Error("Unable to refresh access token");
    } 
    // retry original request with new access token
     response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${newAccessToken}`
      }
    }); 
  }
    const data = await response.json();
    console.log("Fetched videos by grade from Supabase:", data);
    return data;
  } catch (err) {
    console.error("Error fetching videos:", err);
    return [];
  }
};