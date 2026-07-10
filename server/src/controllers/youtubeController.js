import { prisma } from "../config/db.js";

/**
 * Checks if an error is a quota exceeded error
 * @param {Object} errorData - The error object from YouTube API
 * @returns {boolean} True if quota exceeded
 */
const isQuotaExceeded = (errorData) => {
  if (!errorData || !errorData.error) return false;
  
  const message = errorData.error.message || '';
  const code = errorData.error.code;
  
  return message.toLowerCase().includes('quota') || 
         code === 403 || 
         code === 429;
};

/**
 * Parses ISO 8601 duration format (e.g., "PT4M13S") to total seconds
 * @param {string} duration - ISO 8601 duration string
 * @returns {number} Total seconds
 */
const parseDurationToSeconds = (duration) => {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Fetches video details in bulk from YouTube API
 * @param {string[]} videoIds - Array of video IDs (max 50 per batch)
 * @returns {Promise<Array>} Array of formatted video objects
 */
const fetchVideoDetailsBulk = async (videoIds) => {
  if (!videoIds || videoIds.length === 0) {
    return [];
  }

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key not configured on server");
  }

  // Process in batches of 50 (YouTube's max)
  const batches = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50));
  }

  const allVideos = [];

  for (const batch of batches) {
    const idsParam = batch.join(",");
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${encodeURIComponent(idsParam)}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error fetching video details:", data);
      
      if (isQuotaExceeded(data)) {
        throw new Error('YouTube API quota exceeded. Please try again later or increase your quota limit.');
      }
      
      throw new Error(`YouTube API error: ${data.error?.message || "Unknown error"}`);
    }

    if (!data.items || data.items.length === 0) {
      continue;
    }

    const formattedVideos = data.items.map((video) => ({
      videoId: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      channelId: video.snippet.channelId,
      duration: parseDurationToSeconds(video.contentDetails?.duration),
      viewCount: parseInt(video.statistics?.viewCount || 0, 10) || 0,
      thumbnails: {
        default: video.snippet.thumbnails?.default?.url || "",
        medium: video.snippet.thumbnails?.medium?.url || "",
        high: video.snippet.thumbnails?.high?.url || "",
      },
    }));

    allVideos.push(...formattedVideos);
  }

  return allVideos;
};

/**
 * Searches for curriculum videos (medium and long duration)
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {number} [params.maxResults=25] - Target number of unique videos
 * @returns {Promise<Array>} Array of formatted video objects
 */
const searchCurriculum = async ({ query, maxResults = 25 }) => {
  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured on server");
    }

    if (!query || !query.trim()) {
      throw new Error("Missing required field: query");
    }

    const uniqueVideoIds = new Set();

    // Search 1: Medium duration videos (4-20 minutes)
    const searchUrlMedium =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&type=video&maxResults=50` +
      `&q=${encodeURIComponent(query)}` +
      `&videoDuration=medium` +
      `&key=${YOUTUBE_API_KEY}`;

    const responseMedium = await fetch(searchUrlMedium);
    const dataMedium = await responseMedium.json();

    if (!responseMedium.ok) {
      console.error("YouTube API error (medium duration):", dataMedium);
      
      if (isQuotaExceeded(dataMedium)) {
        throw new Error('YouTube API quota exceeded. Please try again later or increase your quota limit.');
      }
      
      throw new Error(`YouTube API error: ${dataMedium.error?.message || "Unknown error"}`);
    }

    if (dataMedium.items && dataMedium.items.length > 0) {
      dataMedium.items.forEach((item) => {
        if (item.id && item.id.kind === "youtube#video") {
          uniqueVideoIds.add(item.id.videoId);
        }
      });
    }

    // Search 2: Long duration videos (>20 minutes)
    const searchUrlLong =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&type=video&maxResults=50` +
      `&q=${encodeURIComponent(query)}` +
      `&videoDuration=long` +
      `&key=${YOUTUBE_API_KEY}`;

    const responseLong = await fetch(searchUrlLong);
    const dataLong = await responseLong.json();

    if (!responseLong.ok) {
      console.error("YouTube API error (long duration):", dataLong);
      
      if (isQuotaExceeded(dataLong)) {
        throw new Error('YouTube API quota exceeded. Please try again later or increase your quota limit.');
      }
      
      throw new Error(`YouTube API error: ${dataLong.error?.message || "Unknown error"}`);
    }

    if (dataLong.items && dataLong.items.length > 0) {
      dataLong.items.forEach((item) => {
        if (item.id && item.id.kind === "youtube#video") {
          uniqueVideoIds.add(item.id.videoId);
        }
      });
    }

    // Limit to target maxResults
    const limitedVideoIds = Array.from(uniqueVideoIds).slice(0, 50);

    if (limitedVideoIds.length === 0) {
      return [];
    }

    // Fetch full video details
    const videos = await fetchVideoDetailsBulk(limitedVideoIds);

    return videos;
  } catch (error) {
    console.error("Error in searchCurriculum:", error);
    throw error;
  }
};

/**
 * Searches for channel videos
 * @param {Object} params - Search parameters
 * @param {string} params.channelId - YouTube channel ID
 * @param {string} [params.type='advert'] - Type of search ('advert' or other)
 * @param {string} [params.query] - Optional search query
 * @param {number} [params.maxResults=50] - Maximum number of results
 * @returns {Promise<Array>} Array of formatted video objects
 */
const searchChannels = async ({ channelId, type = "advert", query, maxResults = 50 }) => {
  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured on server");
    }

    if (!channelId) {
      throw new Error("Missing required field: channelId");
    }

    const uniqueVideoIds = new Set();

    // Search 1: Fetch from uploads playlist
    // Convert channelId to uploads playlist ID (replace 'C' with 'U' in second position)
    const uploadsPlaylistId = "UU" + channelId.substring(2);
    const playlistUrl =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=snippet&playlistId=${encodeURIComponent(uploadsPlaylistId)}` +
      `&maxResults=50&key=${YOUTUBE_API_KEY}`;

    const playlistResponse = await fetch(playlistUrl);
    const playlistData = await playlistResponse.json();

    if (!playlistResponse.ok) {
      console.error("YouTube API error fetching playlist:", playlistData);
      
      if (isQuotaExceeded(playlistData)) {
        throw new Error('YouTube API quota exceeded. Please try again later or increase your quota limit.');
      }
      
      throw new Error(`YouTube API error: ${playlistData.error?.message || "Unknown error"}`);
    }

    if (playlistData.items && playlistData.items.length > 0) {
      // Extract video IDs from playlist items
      playlistData.items.forEach((item) => {
        const videoId = item.snippet?.resourceId?.videoId;
        if (videoId) {
          uniqueVideoIds.add(videoId);
        }
      });
    }

    // Search 2: Regular channel search
    // Build search URL based on type
    let searchUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&type=video&maxResults=${maxResults}` +
      `&channelId=${encodeURIComponent(channelId)}` +
      `&key=${YOUTUBE_API_KEY}`;

    // Add videoDuration=short only for advert type
    if (type === "advert") {
      searchUrl += `&videoDuration=short`;
    }

    // Add query if provided
    if (query && query.trim()) {
      searchUrl += `&q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error searching channels:", data);
      
      if (isQuotaExceeded(data)) {
        throw new Error('YouTube API quota exceeded. Please try again later or increase your quota limit.');
      }
      
      throw new Error(`YouTube API error: ${data.error?.message || "Unknown error"}`);
    }

    if (data.items && data.items.length > 0) {
      // Collect unique video IDs from search
      data.items.forEach((item) => {
        if (item.id && item.id.kind === "youtube#video") {
          uniqueVideoIds.add(item.id.videoId);
        }
      });
    }

    const videoIds = Array.from(uniqueVideoIds);

    if (videoIds.length === 0) {
      return [];
    }

    // Fetch full video details with duration and view count
    const videos = await fetchVideoDetailsBulk(videoIds);

    return videos;
  } catch (error) {
    console.error("Error in searchChannels:", error);
    throw error;
  }
};

/**
 * Saves videos to database with curriculum assignments
 * @param {Array} videos - Array of formatted video objects
 * @param {Object} params - Assignment parameters
 * @param {string} params.grade_id - Grade ID
 * @param {string} [params.subject_id] - Subject ID (optional)
 * @param {string} [params.content_id] - Content ID (optional)
 * @param {string} [params.subcontent_id] - Subcontent ID (optional)
 * @param {string} [params.type='advert'] - Video type
 * @returns {Promise<Object>} Save statistics
 */
const saveVideosToDatabase = async (videos, { grade_id, subject_id, content_id, subcontent_id}) => {
  if (!videos || videos.length === 0) {
    return { savedCount: 0, assignedCount: 0, totalFetched: 0 };
  }

  if (!grade_id) {
    throw new Error("At least grade_id is required for curriculum position");
  }

  // Extract video IDs for bulk lookups
  const videoIds = videos.map((v) => v.videoId);

  // Save videos and create assignments in transaction
  const result = await prisma.$transaction(async (tx) => {
    let savedCount = 0;
    let assignedCount = 0;

    // Step 1: Ensure all videos exist (upsert to handle duplicates)
    for (const video of videos) {
      await tx.videos.upsert({
        where: { id: video.videoId },
        update: {
          title: video.title,
          channel_title: video.channelTitle,
          thumbnails: video.thumbnails,
          published_at: video.publishedAt ? new Date(video.publishedAt) : null,
          channel_id: video.channelId,
          duration: video.duration || 0,
          view_count: video.viewCount || 0,
        },
        create: {
          id: video.videoId,
          title: video.title,
          channel_title: video.channelTitle,
          thumbnails: video.thumbnails,
          published_at: video.publishedAt ? new Date(video.publishedAt) : null,
          channel_id: video.channelId,
          duration: video.duration || 0,
          view_count: video.viewCount || 0,
        },
      });
      savedCount++;
    }

    // Step 2: Verify which videos actually exist in database (double-check after creation attempts)
    const allVideoIds = videos.map(v => v.videoId);
    const existingVideosInDb = await tx.videos.findMany({
      where: { id: { in: allVideoIds } },
      select: { id: true }
    });
    const videosThatActuallyExist = new Set(existingVideosInDb.map(v => v.id));
    console.log(`Verified ${videosThatActuallyExist.size} videos exist in database out of ${allVideoIds.length} requested`);

    // Step 3: Find existing assignments for this curriculum position (only for videos that exist)
    const existingAssignments = await tx.video_assignments.findMany({
      where: {
        video_id: { in: allVideoIds },
        grade_id: grade_id,
        subject_id: subject_id || null,
        content_id: content_id || null,
        subcontent_id: subcontent_id || null,
      },
      select: { video_id: true },
    });
    const assignedVideoIds = new Set(existingAssignments.map((a) => a.video_id));

    // Step 4: Create assignments one by one (only for videos that verified exist)
    // This ensures no foreign key constraint violations
    for (const video of videos) {
      // Skip if assignment already exists
      if (assignedVideoIds.has(video.videoId)) {
        continue;
      }
      
      // Skip if video doesn't actually exist in database
      if (!videosThatActuallyExist.has(video.videoId)) {
        console.log(`Video ${video.videoId} not in database, skipping assignment`);
        continue;
      }

      try {
        await tx.video_assignments.create({
          data: {
            video_id: video.videoId,
            grade_id: grade_id,
            subject_id: subject_id || null,
            content_id: content_id || null,
            subcontent_id: subcontent_id || null,
          },
        });
        assignedCount++;
      } catch (error) {
        // If assignment already exists (unique constraint), skip it
        if (error.code === 'P2002') {
          console.log(`Assignment already exists for video ${video.videoId}`);
        } else {
          throw error;
        }
      }
    }

    return { savedCount, assignedCount, totalFetched: videos.length };
  }, {
    timeout: 120000,
    maxWait: 30000,
  });

  return result;
};

/**
 * Fetches channel thumbnail from YouTube API
 * @param {string} channelId - The YouTube channel ID
 * @returns {Promise<Object|null>} - The thumbnail object with url, width, height or null if not found
 */
const fetchChannelThumbnail = async (channelId) => {
  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      console.error("YouTube API key not configured");
      return null;
    }

    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(channelId)}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error fetching channel:", data);
      return null;
    }

    if (!data.items || data.items.length === 0) {
      console.error("Channel not found:", channelId);
      return null;
    }

    const channel = data.items[0];

    // Get thumbnail object with url, width, and height
    const thumbnailObj = channel.snippet?.thumbnails?.medium ||
                         channel.snippet?.thumbnails?.default ||
                         null;

    if (!thumbnailObj) {
      return null;
    }

    return {
      url: thumbnailObj.url || null,
      width: thumbnailObj.width || null,
      height: thumbnailObj.height || null,
    };
  } catch (error) {
    console.error("Error fetching channel thumbnail:", error);
    return null;
  }
};

export {
  fetchVideoDetailsBulk,
  searchCurriculum,
  searchChannels,
  saveVideosToDatabase,
  fetchChannelThumbnail,
};