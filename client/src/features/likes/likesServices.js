import { getBaseUrl } from '../../utils/path.js';
import { refresh } from '../../utils/sharedFunctions.js';

const BASE_URL = getBaseUrl();

/**
 * Fetch all liked videos for a profile from backend.
 * Returns an array of { profileId, videoId, likedAt, video: { ... } }
 * or null on failure.
 */
export async function fetchLikedVideos(profileId) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken || !profileId) return null;

  const url = `${BASE_URL}/api/v1/likes/profile/${profileId}`;

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
    console.error('Error fetching liked videos:', err);
    return null;
  }
}

/**
 * Like a video on the backend.
 * Returns true on success, false on failure.
 */
export async function likeVideo(profileId, videoId) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken || !profileId || !videoId) return false;

  const url = `${BASE_URL}/api/v1/likes`;

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

    if (response.status === 409) return true; // already liked
    return response.ok;
  } catch (err) {
    console.error('Error liking video:', err);
    return false;
  }
}

/**
 * Unlike a video on the backend.
 * Returns true on success, false on failure.
 */
export async function unlikeVideo(profileId, videoId) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken || !profileId || !videoId) return false;

  const url = `${BASE_URL}/api/v1/likes`;

  try {
    let response = await fetch(url, {
      method: 'DELETE',
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
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify({ profileId, videoId }),
      });
    }

    return response.ok;
  } catch (err) {
    console.error('Error unliking video:', err);
    return false;
  }
}