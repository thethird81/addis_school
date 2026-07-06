import { getBaseUrl } from '../../utils/path.js';
import { refresh } from '../../utils/sharedFunctions.js';

const BASE_URL = getBaseUrl();

/**
 * Fetch all reported video IDs for a profile from backend.
 * Returns an array of { profileId, videoId, reportedAt, video: { ... } }
 * or null on failure.
 */
export async function fetchReportedVideos(profileId) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken || !profileId) return null;

  const url = `${BASE_URL}/api/v1/reports/profile/${profileId}`;

  try {
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      const newToken = await refresh();
      if (!newToken) throw new Error('Unable to refresh token');
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Error fetching reported videos:', err);
    return null;
  }
}

/**
 * Report a video on the backend.
 * Returns true on success, false on failure.
 */
export async function reportVideo(profileId, videoId) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken || !profileId || !videoId) return false;

  const url = `${BASE_URL}/api/v1/reports`;

  try {
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ profileId, videoId }),
    });

    if (response.status === 401) {
      const newToken = await refresh();
      if (!newToken) throw new Error('Unable to refresh token');
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify({ profileId, videoId }),
      });
    }

    if (response.status === 409) return true; // already reported
    return response.ok;
  } catch (err) {
    console.error('Error reporting video:', err);
    return false;
  }
}