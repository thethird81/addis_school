/**
 * LocalStorage helpers for per-profile reported video IDs.
 * Each profile gets its own key: `reportedVideos_{profileId}`.
 * Stores an array of videoId strings (just the IDs, not full objects).
 */

/**
 * Get the storage key for the current active profile.
 * Falls back to 'reportedVideos' if no profile is found.
 * @returns {string}
 */
function getStorageKey() {
  try {
    const profile = JSON.parse(localStorage.getItem('activeProfile'));
    if (profile && profile.id) {
      return `reportedVideos_${profile.id}`;
    }
  } catch (err) {
    console.error('Error reading activeProfile for reports storage key:', err);
  }
  return 'reportedVideos';
}

/**
 * Get all reported video IDs for the current active profile from localStorage.
 * @returns {string[]} Array of video ID strings
 */
export function getReportedVideoIds() {
  try {
    const data = localStorage.getItem(getStorageKey());
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading reportedVideos from localStorage:', err);
    return [];
  }
}

/**
 * Replace the entire reported video IDs list for the current active profile.
 * @param {string[]} videoIds - Array of video ID strings
 */
export function setReportedVideoIds(videoIds) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(videoIds));
  } catch (err) {
    console.error('Error writing reportedVideos to localStorage:', err);
  }
}

/**
 * Add a single video ID to the reported list (if not already present).
 * @param {string} videoId
 */
export function addReportedVideoId(videoId) {
  const ids = getReportedVideoIds();
  if (!ids.includes(videoId)) {
    ids.push(videoId);
    setReportedVideoIds(ids);
  }
}

/**
 * Check whether a video has been reported by the current active profile.
 * @param {string} videoId
 * @returns {boolean}
 */
export function isReported(videoId) {
  const ids = getReportedVideoIds();
  return ids.includes(videoId);
}

/**
 * Filter out reported videos from a video list.
 * @param {Array} videoList - Array of video objects with `videoId` property
 * @returns {Array} Filtered array with reported videos removed
 */
export function filterOutReportedVideos(videoList) {
  const reportedIds = getReportedVideoIds();
  if (!reportedIds.length) return videoList;
  return videoList.filter(v => !reportedIds.includes(v.videoId));
}