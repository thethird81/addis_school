'use strict';

/**
 * advertServices.js
 *
 * Fetches advert videos for the active profile's grade from the backend
 * and caches them in IndexedDB via profileStore.js.
 */

import { getBaseUrl } from '../../utils/path.js';
import { getAdvertVideos, setAdvertVideos } from '../store/profileStore.js';

/**
 * Fetch advert videos for a given grade from the backend API.
 * @param {string} gradeId - The grade ID to fetch adverts for.
 * @param {string} profileId - The profile ID to store adverts for.
 * @returns {Promise<Array>} Array of advert video objects.
 */
export async function fetchAdvertVideos(gradeId, profileId) {
  if (!gradeId || !profileId) {
    console.warn('[advertServices] No gradeId or profileId provided.');
    return [];
  }

  const accessToken = localStorage.getItem('accessToken');
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/v1/videos/adverts/${encodeURIComponent(gradeId)}?profileId=${encodeURIComponent(profileId)}`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error('[advertServices] Failed to fetch adverts:', response.statusText);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.log('[advertServices] No advert videos found for grade:', gradeId);
      return [];
    }

    // Cache in IndexedDB via profileStore
    await setAdvertVideos(profileId, gradeId, data);
    console.log(`[advertServices] Cached ${data.length} advert videos for profile ${profileId}, grade ${gradeId}`);
    return data;
  } catch (error) {
    console.error('[advertServices] Error fetching advert videos:', error);
    return [];
  }
}

/**
 * Get cached advert videos from IndexedDB.
 * @param {string} gradeId - The grade ID to look up.
 * @param {string} profileId - The profile ID to look up.
 * @returns {Array} Array of advert video objects, or empty array.
 */
export async function getStoredAdvertVideos(gradeId, profileId) {
  if (!gradeId || !profileId) return [];
  try {
    const stored = await getAdvertVideos(profileId, gradeId);
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error('[advertServices] Error reading stored adverts:', error);
    return [];
  }
}

/**
 * Select a random advert video from the stored list.
 * @param {string} gradeId - The grade ID to look up.
 * @param {string} profileId - The profile ID to look up.
 * @returns {Object|null} A random advert video object, or null if none available.
 */
export async function selectRandomAdvert(gradeId, profileId) {
  const adverts = await getStoredAdvertVideos(gradeId, profileId);
  if (!adverts.length) {
    console.warn('[advertServices] No advert videos available to select from.');
    return null;
  }
  const randomIndex = Math.floor(Math.random() * adverts.length);
  return adverts[randomIndex];
}

/**
 * Ensure advert videos are available in IndexedDB for a given grade and profile.
 * Checks cache first; if empty or missing, fetches from backend.
 * @param {string} gradeId - The grade ID.
 * @param {string} profileId - The profile ID.
 * @returns {Promise<Array>} The advert videos array.
 */
export async function ensureAdvertVideos(gradeId, profileId) {
  if (!gradeId || !profileId) {
    console.warn('[advertServices] ensureAdvertVideos: no gradeId or profileId provided.');
    return [];
  }

  // Check cache first
  const cached = await getStoredAdvertVideos(gradeId, profileId);
  if (cached.length > 0) {
    console.log('[advertServices] Using cached advert videos for grade:', gradeId);
    return cached;
  }

  // Not cached — fetch from backend
  console.log('[advertServices] No cached adverts for grade', gradeId, '— fetching from backend...');
  return await fetchAdvertVideos(gradeId, profileId);
}