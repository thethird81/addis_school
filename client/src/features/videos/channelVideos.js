/*********************************
 * CHANNEL VIDEOS RESOLVER
 * Handles fetching, caching, and saving
 * videos for channels clicked in the sidebar.
 *********************************/
import { getBaseUrl } from '../../utils/path.js';
import { refresh } from '../../utils/sharedFunctions.js';

const YOUTUBE_API_KEY = "AIzaSyC4t0hI2mQx58U3u5hKS6TiTboPMzaienM";
const YOUTUBE_MAX_RESULTS = 30;

/*********************************
 * INDEXED DB (CHANNEL VIDEOS STORE)
 * Uses the same profiles_db database.
 * Store is created by profileStore.js with keyPath: "profileId"
 * Data structure:
 *   { profileId, channels: { [channelId]: { videos, locator, cached_at } } }
 *********************************/
const DB_NAME = "profiles_db";
const DB_VERSION = 8;
const STORE_NAME = "channels";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Ensure subjects store exists (used by videoResolver.js)
      // Note: channels store is created by profileStore.js with keyPath: "profileId"
      if (!db.objectStoreNames.contains("subjects")) {
        db.createObjectStore("subjects", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/*********************************
 * GET CHANNEL VIDEOS FROM INDEXED DB
 *********************************/
async function getFromIndexedDB(profileId, channelId) {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(profileId);

    req.onsuccess = () => {
      const entry = req.result;
      if (!entry) return resolve(null);

      const channelEntry = entry.channels && entry.channels[channelId];
      if (!channelEntry) return resolve(null);

      // Check if cache is still fresh (24 hours)
      const cacheAge = Date.now() - (channelEntry.cached_at || 0);
      const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge > CACHE_TTL) {
        console.log("Channel cache expired for", channelId);
        return resolve(null);
      }

      console.log("Loaded channel videos from IndexedDB for channel:", channelId);

      // Embed subject_name from channel metadata into the locator
      const entryLocator = channelEntry.locator || {};
      const locatorWithSubject = {
        ...entryLocator,
        subject_name: channelEntry.subject_name || entryLocator.subject_name || null
      };

      // Attach locator (with subject_name) to each video before returning
      const videosWithLocator = (channelEntry.videos || []).map(v => ({
        ...v,
        locator: locatorWithSubject
      }));

      resolve(videosWithLocator);
    };

    req.onerror = () => resolve(null);
  });
}

/*********************************
 * SAVE CHANNEL VIDEOS TO INDEXED DB
 *********************************/
async function saveToIndexedDB(profileId, channelId, videos, locator) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Get existing entry or create new one
    const getReq = store.get(profileId);

    getReq.onsuccess = () => {
      const existing = getReq.result || { profileId, channels: {} };
      existing.channels = existing.channels || {};

      // Merge with existing channel info (preserves name, thumbnail_url, gradeId from setChannels)
      const existingChannel = existing.channels[channelId] || {};
      existing.channels[channelId] = {
        ...existingChannel,   // keep channel info if present (name, thumbnail_url, gradeId)
        videos: videos,
        cached_at: Date.now(),
        locator: locator || null
      };

      const putReq = store.put(existing);
      putReq.onsuccess = () => {
        console.log("Saved channel videos to IndexedDB for channel:", channelId);
        resolve(true);
      };
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/*********************************
 * FETCH FROM BACKEND
 *********************************/
async function getVideosFromBackend(channelId) {
  try {
    const url = `${getBaseUrl()}/api/v1/videos/channel/${channelId}`;
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
      const newAccessToken = await refresh();
      if (!newAccessToken) throw new Error("Unable to refresh access token");
      response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${newAccessToken}`
        }
      });
    }

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Response status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.length) return null;

    console.log(`Fetched ${data.length} channel videos from backend for channel ${channelId}`);
    return data;
  } catch (error) {
    console.error("Error fetching channel videos from backend:", error);
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
        subcontentId: null,
        contentId: null,
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
        subcontentId: null,
        contentId: null,
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
 * FETCH FROM YOUTUBE (FALLBACK)
 * Videos are returned WITHOUT locator attached.
 * The caller (resolveChannelVideo) attaches locator.
 *********************************/
async function fetchFromYouTubeByChannelId(channelId) {
  console.log("Fetching medium and long videos from YouTube for channel:(" + channelId + ")");
  
  // Helper function to build the channel-specific URL for a specific duration
  const getUrl = (duration) =>
    "https://www.googleapis.com/youtube/v3/search" +
    `?part=snippet&type=video&maxResults=${YOUTUBE_MAX_RESULTS}` +
    `&channelId=${channelId}` + 
    `&videoDuration=${duration}` +
    `&key=${YOUTUBE_API_KEY}`;

  try {
    // 1. Fire both API requests simultaneously 
    const [mediumRes, longRes] = await Promise.all([
      fetch(getUrl('medium')),
      fetch(getUrl('long'))
    ]);

    const mediumJson = await mediumRes.json();
    const longJson = await longRes.json();

    // 2. Combine results from both batches safely
    const combinedItems = [...(mediumJson.items || []), ...(longJson.items || [])];

    // 3. Use a Map to guarantee O(1) duplicate checks and clean structure mapping
    const uniqueVideosMap = new Map();

    combinedItems.forEach(item => {
      const videoId = item.id?.videoId;
      
      // Ensure the videoId exists and we haven't already processed it
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
          // It's attached by resolveChannelVideo when saving/returning.
        });
      }
    });

    // 4. Return map values as a clean, final array
    return Array.from(uniqueVideosMap.values());

  } catch (error) {
    console.error("Error fetching or merging videos for channel:", error);
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
 * Cache hierarchy: IndexedDB → Backend → YouTube
 * Locator is stored once on the IDB entry and
 * attached to each video only when returning.
 *********************************/
export async function resolveChannelVideos(locator) {
  const channelId = locator.channel_id;
  const profileId = locator.profile_id || (JSON.parse(localStorage.getItem('activeProfile')) || {}).id;

  if (!channelId) {
    console.error("No channel_id provided in locator");
    return [];
  }

  if (!profileId) {
    console.error("Missing profileId for channel cache lookup");
    // Fall through to backend fetch without cache
  }

  // 1️⃣ Check IndexedDB cache (if we have profileId)
  if (profileId) {
    const cached = await getFromIndexedDB(profileId, channelId);
    if (cached) {
      console.log("Loaded channel videos from cache");
      return cached;
    }
  }

  let videos = null;

  // 2️⃣ Fetch from backend (Supabase)
  const dbVideos = await getVideosFromBackend(channelId);
  if (dbVideos) {
    console.log("Loaded channel videos from backend");
    videos = dbVideos;
  } else {
    // // 3️⃣ Fallback: fetch from YouTube, filtered to this specific channel
    // console.log("Fetching channel videos from YouTube as fallback");
    // videos = await fetchFromYouTubeByChannelId(channelId);
  }

  if (videos && videos.length > 0) {
    // Attach locator and save to IndexedDB / Supabase
    const videosWithLocator = attachLocator(videos, locator);
    if (profileId) {
      saveToIndexedDB(profileId, channelId, videos, locator);
    }
    saveVideosToSupabase(locator, videos);
    console.log("channel videos",videosWithLocator);
    return videosWithLocator;
  }

  return videos || [];
}

/*********************************
 * GET ALL CHANNEL VIDEOS FROM INDEXED DB
 *********************************/
export async function getAllChannelVideosFromIndexedDB(profileId) {
  if (!profileId) return [];
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(profileId);

    req.onsuccess = () => {
      const entry = req.result;
      if (!entry || !entry.channels) {
        resolve([]);
        return;
      }

      const allVideos = [];
      for (const channelEntry of Object.values(entry.channels)) {
        if (!channelEntry.videos || !Array.isArray(channelEntry.videos)) continue;
        const entryLocator = channelEntry.locator || {};
        // Embed subject_name from channel metadata into the locator
        const locatorWithSubject = {
          ...entryLocator,
          subject_name: channelEntry.subject_name || entryLocator.subject_name || null
        };
        for (const video of channelEntry.videos) {
          allVideos.push({
            ...video,
            locator: locatorWithSubject
          });
        }
      }
console.log("All channel videos from IndexedDB:", allVideos);
      resolve(allVideos);
    };

    req.onerror = () => reject(req.error);
  });
}
