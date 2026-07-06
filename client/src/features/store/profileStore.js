/**
 * profileStore.js
 *
 * IndexedDB object stores for per-profile user data.
 * Uses the existing `profiles_db` database (version 8).
 * Stores: likedVideos, lastwatched, advert, sidebarData, channels, profile_questions.
 */

const DB_NAME = 'profiles_db';
const DB_VERSION = 8;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Ensure existing stores still exist
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id' });
      }

      // likedVideos store — keyed by profileId
      if (!db.objectStoreNames.contains('likedVideos')) {
        db.createObjectStore('likedVideos', { keyPath: 'profileId' });
      }

      // lastwatched store — keyed by profileId
      if (!db.objectStoreNames.contains('lastwatched')) {
        db.createObjectStore('lastwatched', { keyPath: 'profileId' });
      }

      // advert store — keyed by profileId
      if (!db.objectStoreNames.contains('advert')) {
        db.createObjectStore('advert', { keyPath: 'profileId' });
      }

      // sidebarData store — keyed by profileId
      if (!db.objectStoreNames.contains('sidebarData')) {
        db.createObjectStore('sidebarData', { keyPath: 'profileId' });
      }

      // questions store — keyed by profileId
      if (!db.objectStoreNames.contains('questions')) {
        db.createObjectStore('questions', { keyPath: 'profileId' });
      }
      // channels store — keyed by profileId
      // Unified structure: { profileId, channels: { [channelId]: { channelInfo, videos, cached_at, locator } } }
      if (!db.objectStoreNames.contains('channels')) {
        db.createObjectStore('channels', { keyPath: 'profileId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* =========================================================
   LIKED VIDEOS
   ========================================================= */

export async function getLikedVideos(profileId) {
  if (!profileId) return [];
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('likedVideos', 'readonly');
    const store = tx.objectStore('likedVideos');
    const req = store.get(profileId);
    req.onsuccess = () => resolve(req.result ? req.result.videos : []);
    req.onerror = () => resolve([]);
  });
}

export async function setLikedVideos(profileId, videos) {
  if (!profileId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('likedVideos', 'readwrite');
    const store = tx.objectStore('likedVideos');
    store.put({ profileId, videos });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function addLikedVideo(profileId, video) {
  if (!profileId || !video) return;
  const current = await getLikedVideos(profileId);
  const exists = current.some(v => v.videoId === video.videoId);
  if (!exists) {
    current.push(video);
    await setLikedVideos(profileId, current);
  }
}

export async function removeLikedVideo(profileId, videoId) {
  if (!profileId || !videoId) return;
  const current = await getLikedVideos(profileId);
  const filtered = current.filter(v => v.videoId !== videoId);
  await setLikedVideos(profileId, filtered);
}

export async function isLiked(profileId, videoId) {
  const videos = await getLikedVideos(profileId);
  return videos.some(v => v.videoId === videoId);
}

export async function clearLikedVideos(profileId) {
  if (!profileId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('likedVideos', 'readwrite');
    const store = tx.objectStore('likedVideos');
    store.delete(profileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* =========================================================
   LAST WATCHED
   ========================================================= */

const MAX_LAST_WATCHED = 50;

export async function getLastWatchedVideos(profileId) {
  if (!profileId) return [];
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('lastwatched', 'readonly');
    const store = tx.objectStore('lastwatched');
    const req = store.get(profileId);
    req.onsuccess = () => resolve(req.result ? req.result.videos : []);
    req.onerror = () => resolve([]);
  });
}

export async function setLastWatchedVideos(profileId, videos) {
  if (!profileId) return;
  const trimmed = videos.slice(0, MAX_LAST_WATCHED);
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('lastwatched', 'readwrite');
    const store = tx.objectStore('lastwatched');
    store.put({ profileId, videos: trimmed });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function addLastWatchedVideo(profileId, video) {
  if (!profileId || !video || !video.videoId) return;
  const current = await getLastWatchedVideos(profileId);
  const filtered = current.filter(v => v.videoId !== video.videoId);
  filtered.unshift(video);
  const trimmed = filtered.slice(0, MAX_LAST_WATCHED);
  await setLastWatchedVideos(profileId, trimmed);
}

export async function removeLastWatchedVideo(profileId, videoId) {
  if (!profileId || !videoId) return;
  const current = await getLastWatchedVideos(profileId);
  const filtered = current.filter(v => v.videoId !== videoId);
  await setLastWatchedVideos(profileId, filtered);
}

export async function clearLastWatchedVideos(profileId) {
  if (!profileId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('lastwatched', 'readwrite');
    const store = tx.objectStore('lastwatched');
    store.delete(profileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* =========================================================
   ADVERT
   ========================================================= */

export async function getAdvertVideos(profileId, gradeId) {
  if (!profileId || !gradeId) return [];
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('advert', 'readonly');
    const store = tx.objectStore('advert');
    const req = store.get(profileId);
    req.onsuccess = () => {
      const result = req.result;
      if (result && result.videosByGrade && result.videosByGrade[gradeId]) {
        resolve(result.videosByGrade[gradeId]);
      } else {
        resolve([]);
      }
    };
    req.onerror = () => resolve([]);
  });
}

export async function setAdvertVideos(profileId, gradeId, videos) {
  if (!profileId || !gradeId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('advert', 'readwrite');
    const store = tx.objectStore('advert');
    const getReq = store.get(profileId);
    
    getReq.onsuccess = () => {
      const existing = getReq.result || { profileId, videosByGrade: {} };
      existing.videosByGrade = existing.videosByGrade || {};
      existing.videosByGrade[gradeId] = videos;
      store.put(existing);
    };
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function clearAdvertVideos(profileId, gradeId) {
  if (!profileId || !gradeId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('advert', 'readwrite');
    const store = tx.objectStore('advert');
    const getReq = store.get(profileId);
    
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing && existing.videosByGrade) {
        delete existing.videosByGrade[gradeId];
        if (Object.keys(existing.videosByGrade).length === 0) {
          store.delete(profileId);
        } else {
          store.put(existing);
        }
      }
    };
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* =========================================================
   CHANNELS
   ========================================================= */

export async function getChannels(profileId, gradeId) {
  if (!profileId || !gradeId) return null;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('channels', 'readonly');
    const store = tx.objectStore('channels');
    const req = store.get(profileId);
    req.onsuccess = () => {
      const result = req.result;
      if (!result || !result.channels) {
        resolve(null);
        return;
      }
      // Filter channels by gradeId and return channel info only (no videos)
      const channelsByGrade = Object.values(result.channels)
        .filter(ch => ch.gradeId === gradeId)
        .map(ch => ({
          id: ch.channelId,
          name: ch.name,
          thumbnail_url: ch.thumbnail_url,
          subject_name: ch.subject_name || null
        }));
      resolve(channelsByGrade.length > 0 ? channelsByGrade : null);
    };
    req.onerror = () => resolve(null);
  });
}

export async function setChannels(profileId, gradeId, channels) {
  if (!profileId || !gradeId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('channels', 'readwrite');
    const store = tx.objectStore('channels');
    const getReq = store.get(profileId);

    getReq.onsuccess = () => {
      const existing = getReq.result || { profileId, channels: {} };
      existing.channels = existing.channels || {};

      // Add/update each channel with its gradeId and basic info
      for (const channel of channels) {
        const channelId = channel.id || channel.channelId;
        existing.channels[channelId] = {
          channelId: channelId,
          name: channel.name || channel.channelName,
          thumbnail_url: channel.thumbnail_url,
          gradeId: gradeId,
          subject_name: channel.subject_name || null,

        };
      }

      store.put(existing);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function clearChannels(profileId, gradeId) {
  if (!profileId || !gradeId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('channels', 'readwrite');
    const store = tx.objectStore('channels');
    const getReq = store.get(profileId);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing || !existing.channels) {
        resolve();
        return;
      }

      // Remove channels belonging to this gradeId
      for (const [channelId, channelData] of Object.entries(existing.channels)) {
        if (channelData.gradeId === gradeId) {
          delete existing.channels[channelId];
        }
      }

      // If no channels left, delete the entire entry
      if (Object.keys(existing.channels).length === 0) {
        store.delete(profileId);
      } else {
        store.put(existing);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* =========================================================
   SIDEBAR DATA
   ========================================================= */

export async function getSidebarData(profileId, gradeId) {
  if (!profileId || !gradeId) return null;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('sidebarData', 'readonly');
    const store = tx.objectStore('sidebarData');
    const req = store.get(profileId);
    req.onsuccess = () => {
      const result = req.result;
      if (result && result.dataByGrade && result.dataByGrade[gradeId]) {
        resolve(result.dataByGrade[gradeId]);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => resolve(null);
  });
}

export async function setSidebarData(profileId, gradeId, data) {
  if (!profileId || !gradeId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('sidebarData', 'readwrite');
    const store = tx.objectStore('sidebarData');
    const getReq = store.get(profileId);
    
    getReq.onsuccess = () => {
      const existing = getReq.result || { profileId, dataByGrade: {} };
      existing.dataByGrade = existing.dataByGrade || {};
      existing.dataByGrade[gradeId] = data;
      store.put(existing);
    };
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function clearSidebarData(profileId, gradeId) {
  if (!profileId || !gradeId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('sidebarData', 'readwrite');
    const store = tx.objectStore('sidebarData');
    const getReq = store.get(profileId);
    
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing && existing.dataByGrade) {
        delete existing.dataByGrade[gradeId];
        if (Object.keys(existing.dataByGrade).length === 0) {
          store.delete(profileId);
        } else {
          store.put(existing);
        }
      }
    };
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* =========================================================
   QUESTIONS
   ========================================================= */

export async function getQuestions(profileId) {
  if (!profileId) return [];
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('questions', 'readonly');
    const store = tx.objectStore('questions');
    const req = store.get(profileId);
    req.onsuccess = () => resolve(req.result ? req.result.questions : []);
    req.onerror = () => resolve([]);
  });
}

export async function setQuestions(profileId, questions) {
  if (!profileId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('questions', 'readwrite');
    const store = tx.objectStore('questions');
    store.put({ profileId, questions });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function clearQuestions(profileId) {
  if (!profileId) return;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('questions', 'readwrite');
    const store = tx.objectStore('questions');
    store.delete(profileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
