/*********************************
 * COMBINED VIDEOS RESOLVER
 * Merges videos from both the subjects store and channels store,
 * attaches correct locators, shuffles, and returns 100 random videos.
 *********************************/
import { getAllVideosFromIndexedDB } from './videoResolver.js';
import { getAllChannelVideosFromIndexedDB } from './channelVideos.js';

/*********************************
 * FISHER-YATES SHUFFLE
 * Randomizes the array in-place.
 *********************************/
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/*********************************
 * GET RANDOM VIDEOS FROM BOTH STORES
 * 1. Reads grade_id from active profile
 * 2. Fetches subject videos (filtered by grade)
 * 3. Fetches channel videos (filtered by grade)
 * 4. Merges, shuffles, returns 100
 *********************************/
export async function getRandomVideosFromStores() {
  // 1️⃣ Get active grade_id
  const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || 'null');
  if (!activeProfile || !activeProfile.grade_id) {
    console.warn("No active profile found — cannot fetch store videos by grade.");
    return [];
  }
  const grade_id = activeProfile.grade_id;

  // 2️⃣ Fetch from subjects store
  const subjectVideos = await getAllVideosFromIndexedDB(grade_id);

  // 3️⃣ Fetch from channels store
  const channelVideos = await getAllChannelVideosFromIndexedDB(activeProfile.id);

  // 4️⃣ Filter channel videos to the same grade
  const filteredChannelVideos = (channelVideos || []).filter(v => {
    return v.locator && v.locator.grade_id === grade_id;
  });

  // 5️⃣ Merge both sources
  const allVideos = [...(subjectVideos || []), ...filteredChannelVideos];

  if (allVideos.length === 0) {
    console.log("No videos found in IndexedDB stores for grade_id:", grade_id);
    return [];
  }

  // 6️⃣ Shuffle and return up to 100
  const shuffled = shuffle(allVideos);
  const result = shuffled.slice(0, 100);

  console.log(`Returning ${result.length} random videos from stores (out of ${allVideos.length} total)`);
  return result;
}