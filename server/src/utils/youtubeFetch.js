// YouTube Fetch Service - Handles dual fetch logic for admin
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class YouTubeFetchService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
  }

  // ==================== CHANNEL FETCH ====================

  async fetchChannelVideos(channelId, isAdvert = false) {
    try {
      let videoIds = [];

      if (isAdvert) {
        // Advert mode: Search with duration=short (100 quota)
        const searchResults = await this.search.list({
          part: 'id',
          channelId: channelId,
          type: 'video',
          videoDuration: 'short',
          maxResults: 50,
          order: 'viewCount',
        });
        
        videoIds = searchResults.data.items
          .filter(item => item.id?.videoId)
          .map(item => item.id.videoId);
      } else {
        // Curricular mode: Dual fetch
        
        // 1. Latest feed: Convert UC to UU and get playlist (1 quota)
        const playlistId = 'UU' + channelId.substring(2);
        const latestResults = await this.playlistItems.list({
          part: 'contentDetails',
          playlistId: playlistId,
          maxResults: 50,
        });
        
        const latestVideoIds = latestResults.data.items
          .filter(item => item.contentDetails?.videoId)
          .map(item => item.contentDetails.videoId);
        
        videoIds.push(...latestVideoIds);
        
        // 2. Most viewed feed: Search by channel with order=viewCount (100 quota)
        const popularResults = await this.search.list({
          part: 'id',
          channelId: channelId,
          type: 'video',
          order: 'viewCount',
          maxResults: 50,
        });
        
        const popularVideoIds = popularResults.data.items
          .filter(item => item.id?.videoId)
          .map(item => item.id.videoId);
        
        videoIds.push(...popularVideoIds);
      }

      // Deduplicate
      videoIds = [...new Set(videoIds)];

      if (videoIds.length === 0) {
        return [];
      }

      // 3. Hydration: Get full video details (1 quota)
      const videoDetails = await this.videos.list({
        part: 'snippet,contentDetails,statistics,status',
        id: videoIds.join(','),
      });

      // 4. Filter and format
      return this.formatAndFilter(videoDetails.data.items, isAdvert);
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw new Error('Failed to fetch videos from channel');
    }
  }

  // ==================== SEARCH FETCH ====================

  async fetchSearchVideos(searchTerm) {
    try {
      // 1. Search (100 quota)
      const searchResults = await this.search.list({
        part: 'id',
        q: searchTerm,
        type: 'video',
        maxResults: 50,
        order: 'relevance',
      });

      const videoIds = searchResults.data.items
        .filter(item => item.id?.videoId)
        .map(item => item.id.videoId);

      if (videoIds.length === 0) {
        return [];
      }

      // 2. Hydration (1 quota)
      const videoDetails = await this.videos.list({
        part: 'snippet,contentDetails,statistics,status',
        id: videoIds.join(','),
      });

      // 3. Filter and format
      return this.formatAndFilter(videoDetails.data.items, false);
    } catch (error) {
      console.error('Error fetching search videos:', error);
      throw new Error('Failed to search videos');
    }
  }

  // ==================== HELPER: Format and Filter ====================

  formatAndFilter(videos, isAdvert) {
    return videos
      .filter(video => {
        // Filter out non-embeddable videos
        return video.status?.embeddable === true;
      })
      .map(video => {
        const snippet = video.snippet;
        const contentDetails = video.contentDetails;
        const statistics = video.statistics;
        const status = video.status;

        return {
          id: video.id,
          title: snippet.title,
          channel_title: snippet.channelTitle,
          thumbnails: snippet.thumbnails,
          published_at: snippet.publishedAt,
          channel_id: snippet.channelId,
          type: isAdvert ? 'advert' : 'curricular',
          duration: this.parseDuration(contentDetails.duration),
          view_count: parseInt(statistics.viewCount || '0'),
        };
      });
  }

  // ==================== HELPER: Parse ISO 8601 Duration ====================

  parseDuration(isoDuration) {
    if (!isoDuration) return 0;

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return (hours * 3600) + (minutes * 60) + seconds;
  }

  // ==================== YOUTUBE API HELPERS ====================

  get search() {
    return {
      list: async (params) => {
        const query = new URLSearchParams(params);
        const response = await fetch(
          `${YOUTUBE_API_BASE}/search?${query}&key=${this.apiKey}`
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'YouTube search error');
        }
        
        return response.json();
      }
    };
  }

  get playlistItems() {
    return {
      list: async (params) => {
        const query = new URLSearchParams(params);
        const response = await fetch(
          `${YOUTUBE_API_BASE}/playlistItems?${query}&key=${this.apiKey}`
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'YouTube playlistItems error');
        }
        
        return response.json();
      }
    };
  }

  get videos() {
    return {
      list: async (params) => {
        const query = new URLSearchParams(params);
        const response = await fetch(
          `${YOUTUBE_API_BASE}/videos?${query}&key=${this.apiKey}`
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'YouTube videos error');
        }
        
        return response.json();
      }
    };
  }
}

// Export singleton instance
const youtubeService = new YouTubeFetchService();
export { youtubeService };