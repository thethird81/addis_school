/**
 * IndexedDB-based storage for per-profile last watched videos.
 * Uses profileStore.js for all storage operations.
 * Maintains a FIFO list with a maximum of 50 videos.
 * When a video is watched again, it moves to the top (most recent).
 */

import { 
  getLastWatchedVideos as getLastWatchedFromStore, 
  setLastWatchedVideos as setLastWatchedToStore, 
  addLastWatchedVideo as addLastWatchedToStore, 
  removeLastWatchedVideo as removeLastWatchedFromStore 
} from '../store/profileStore.js';

const MAX_LAST_WATCHED = 50;

/**
 * Get all last watched videos for a profile.
 * @param {string} profileId - The profile ID
 * @returns {Array} Array of video objects
 */
export async function getLastWatchedVideos(profileId) {
  if (!profileId) return [];
  return await getLastWatchedFromStore(profileId);
}

/**
 * Replace the entire last watched list for a profile.
 * @param {string} profileId - The profile ID
 * @param {Array} videos - Array of video objects
 */
export async function setLastWatchedVideos(profileId, videos) {
  if (!profileId) return;
  // Ensure we never exceed the max limit
  const trimmed = videos.slice(0, MAX_LAST_WATCHED);
  await setLastWatchedToStore(profileId, trimmed);
}

/**
 * Add a video to the last watched list.
 * - If the video already exists, it is moved to the top (position 0).
 * - If the list already has MAX_LAST_WATCHED items, the oldest is removed.
 * @param {string} profileId - The profile ID
 * @param {Object} video - Video object with a `videoId` property
 */
export async function addLastWatchedVideo(profileId, video) {
  if (!profileId || !video || !video.videoId) {
    console.warn('addLastWatchedVideo: invalid video object', video);
    return;
  }
  console.log("Adding video to last watched:", video.videoId);
  await addLastWatchedToStore(profileId, video);
}

/**
 * Clear all last watched videos for a profile.
 * @param {string} profileId - The profile ID
 */
export async function clearLastWatchedVideos(profileId) {
  if (!profileId) return;
  // Note: profileStore doesn't have a clear function, but we can set empty array
  await setLastWatchedToStore(profileId, []);
}

/**
 * Remove a video from the last watched list by its videoId.
 * @param {string} profileId - The profile ID
 * @param {string} videoId - The video ID to remove
 */
export async function removeLastWatchedVideo(profileId, videoId) {
  if (!profileId || !videoId) return;
  const videos = await getLastWatchedFromStore(profileId);
  const filtered = videos.filter(v => v.videoId !== videoId);
  console.log(`Removed videoId ${videoId} from last watched. New list length: ${filtered.length}`);
  await setLastWatchedToStore(profileId, filtered);
}