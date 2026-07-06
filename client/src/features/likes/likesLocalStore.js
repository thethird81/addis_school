/**
 * IndexedDB-based storage for per-profile liked videos.
 * Uses profileStore.js for all storage operations.
 */

import { 
  getLikedVideos as getLikedVideosFromStore, 
  setLikedVideos as setLikedVideosToStore, 
  addLikedVideo as addLikedVideoToStore, 
  removeLikedVideo as removeLikedVideoFromStore, 
  isLiked as isLikedInStore 
} from '../store/profileStore.js';

/**
 * Get all liked videos for the current active profile.
 * @param {string} profileId - The profile ID
 * @returns {Array} Array of video objects
 */
export async function getLikedVideos(profileId) {
  if (!profileId) return [];
  return await getLikedVideosFromStore(profileId);
}

/**
 * Replace the entire likedVideos list for a profile.
 * @param {string} profileId - The profile ID
 * @param {Array} videos - Array of video objects
 */
export async function setLikedVideos(profileId, videos) {
  if (!profileId) return;
  await setLikedVideosToStore(profileId, videos);
}

/**
 * Add a single video to the liked list (if not already present).
 * @param {string} profileId - The profile ID
 * @param {Object} video - Video object with a `videoId` property
 */
export async function addLikedVideo(profileId, video) {
  if (!profileId || !video) return;
  await addLikedVideoToStore(profileId, video);
}

/**
 * Remove a video from the liked list by its videoId.
 * @param {string} profileId - The profile ID
 * @param {string} videoId - The video ID to remove
 */
export async function removeLikedVideo(profileId, videoId) {
  if (!profileId || !videoId) return;
  await removeLikedVideoFromStore(profileId, videoId);
}

/**
 * Check whether a video is liked for a profile.
 * @param {string} profileId - The profile ID
 * @param {string} videoId - The video ID to check
 * @returns {boolean}
 */
export async function isLiked(profileId, videoId) {
  if (!profileId || !videoId) return false;
  return await isLikedInStore(profileId, videoId);
}
