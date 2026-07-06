/**
 * IndexedDB utilities for removing a video from caches on report.
 *
 * Removes the video from both:
 * - "subjects" store (keyed by subcontent_id)
 * - "channels" store (keyed by channel_id)
 *
 * Both stores are in the "profiles_db" database.
 * Gracefully handles missing stores.
 */
const DB_NAME = "profiles_db";
const DB_VERSION = 4;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Ensure stores exist on upgrade (safe no-op if already present)
      if (!db.objectStoreNames.contains("subjects")) {
        db.createObjectStore("subjects", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("channels")) {
        db.createObjectStore("channels", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Safely get an object store if it exists.
 * Returns null if the store is not found (prevents NotFoundError).
 */
function safeTransaction(db, storeName, mode) {
  if (!db.objectStoreNames.contains(storeName)) {
    console.warn("IndexedDB store '" + storeName + "' not found — skipping.");
    return null;
  }
  return db.transaction(storeName, mode);
}

/**
 * Remove a video from the subjects store (keyed by subcontent_id).
 */
async function removeFromSubjectsStore(subcontentId, videoId) {
  if (!subcontentId || !videoId) return;

  const db = await openDB();
  const tx = safeTransaction(db, "subjects", "readwrite");
  if (!tx) return;

  const store = tx.objectStore("subjects");

  return new Promise((resolve) => {
    const req = store.get(subcontentId);

    req.onsuccess = () => {
      const entry = req.result;
      if (!entry || !Array.isArray(entry.videos)) {
        resolve();
        return;
      }

      const before = entry.videos.length;
      entry.videos = entry.videos.filter(function (v) {
        return v.videoId !== videoId && v.id !== videoId;
      });

      if (entry.videos.length === before) {
        resolve();
        return;
      }

      store.put(entry);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = function () {
      console.warn("Error removing video from subjects store (non-critical).");
      resolve();
    };
  });
}

/**
 * Remove a video from the channels store (keyed by channel_id).
 */
async function removeFromChannelsStore(channelId, videoId) {
  if (!channelId || !videoId) return;

  const db = await openDB();
  const tx = safeTransaction(db, "channels", "readwrite");
  if (!tx) return;

  const store = tx.objectStore("channels");

  return new Promise((resolve) => {
    const req = store.get(channelId);

    req.onsuccess = () => {
      const entry = req.result;
      if (!entry || !Array.isArray(entry.videos)) {
        resolve();
        return;
      }

      const before = entry.videos.length;
      entry.videos = entry.videos.filter(function (v) {
        return v.videoId !== videoId && v.id !== videoId;
      });

      if (entry.videos.length === before) {
        resolve();
        return;
      }

      store.put(entry);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = function () {
      console.warn("Error removing video from channels store (non-critical).");
      resolve();
    };
  });
}

/**
 * Remove a video from all IndexedDB caches by scanning both stores.
 * Gracefully handles missing stores and errors.
 * @param {string} videoId
 */
export async function removeVideoFromAllCaches(videoId) {
  if (!videoId) return;

  var db;
  try {
    db = await openDB();
  } catch (e) {
    console.warn("Could not open IndexedDB for cache cleanup (non-critical).", e);
    return;
  }

  // Subjects store
  try {
    if (db.objectStoreNames.contains("subjects")) {
      var tx1 = db.transaction("subjects", "readonly");
      var store1 = tx1.objectStore("subjects");
      var allReq1 = store1.getAll();

      await new Promise(function (resolve) {
        allReq1.onsuccess = async function () {
          var entries = allReq1.result || [];
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (!Array.isArray(entry.videos)) continue;
            var hasVideo = entry.videos.some(function (v) {
              return v.videoId === videoId || v.id === videoId;
            });
            if (hasVideo) {
              await removeFromSubjectsStore(entry.id, videoId);
            }
          }
          resolve();
        };
        allReq1.onerror = function () { resolve(); };
      });
    }
  } catch (e) {
    console.warn("Error reading subjects store (non-critical).", e);
  }

  // Channels store
  try {
    if (db.objectStoreNames.contains("channels")) {
      var tx2 = db.transaction("channels", "readonly");
      var store2 = tx2.objectStore("channels");
      var allReq2 = store2.getAll();

      await new Promise(function (resolve) {
        allReq2.onsuccess = async function () {
          var entries = allReq2.result || [];
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (!Array.isArray(entry.videos)) continue;
            var hasVideo = entry.videos.some(function (v) {
              return v.videoId === videoId || v.id === videoId;
            });
            if (hasVideo) {
              await removeFromChannelsStore(entry.id, videoId);
            }
          }
          resolve();
        };
        allReq2.onerror = function () { resolve(); };
      });
    }
  } catch (e) {
    console.warn("Error reading channels store (non-critical).", e);
  }
}