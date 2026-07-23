import { prisma } from "../config/db.js";
import axios from "axios";
import { serializeObject, safeJsonResponse } from "../utils/bigIntSerializer.js";

// Helper function to format view counts in compact notation
export const formatViewCount = (count) => {
  if (count === null || count === undefined) return null;
  if (typeof count === 'bigint') {
    return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(Number(count));
  }
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(count);
};

const getVideosBySubcontent = async (req, res) => {
  try {
    const { subcontentId } = req.params;
    const { gradeId, subjectId, contentId, profileId } = req.query;

    const where = {
      subcontent_id: subcontentId,
      videos: {
        duration: {
          gte: 120,
        },
      },
    };
    if (gradeId) where.grade_id = gradeId;
    if (subjectId) where.subject_id = subjectId;
    if (contentId) where.content_id = contentId;

    if (profileId) {
      where.videos = {
        reports: {
          none: {
            profile_id: profileId,
          },
        },
      };
    }

    const assignments = await prisma.video_assignments.findMany({
      take: 100,
      where,
      include: {
        videos: true,
        subjects: true,
      },
    });

    if (!assignments.length) {
      return safeJsonResponse(res, 404, { message: "No videos found" });
    }

    const formattedVideos = assignments.map((a) => ({
      videoId: a.videos.id,
      title: a.videos.title,
      thumbnails: a.videos.thumbnails,
      publishedAt: a.videos.published_at,
      channelTitle: a.videos.channel_title,
      channelId: a.videos.channel_id,
      duration: a.videos.duration,
      viewCount: formatViewCount(a.videos.view_count),
      locator: {
        grade_id: a.grade_id,
        subject_id: a.subject_id,
        content_id: a.content_id,
        subcontent_id: a.subcontent_id,
        channel_id: a.videos.channel_id,
        subject_name: a.subjects?.name || null,
      },
    }));

    return safeJsonResponse(res, 200, formattedVideos);
  } catch (err) {
    console.error(err);
    return safeJsonResponse(res, 500, { message: "Server error" });
  }
};

const getRandomVideos = async (req, res) => {
  try {
    const { profileId } = req.query;

    const videos = await prisma.$queryRaw`
      SELECT * FROM get_global_random_assigned_videos();
    `;

    if (!videos || !videos.length) {
      return safeJsonResponse(res, 404, { message: "No videos found" });
    }

    const result = videos.map((v) => ({
      videoId: v.id,
      title: v.title,
      thumbnails: v.thumbnails,
      publishedAt: v.published_at,
      channelTitle: v.channel_title,
      duration: v.duration,
      viewCount: formatViewCount(v.view_count),
      locator: {
        grade_id: v.grade_id,
        subject_id: v.subject_id,
        content_id: v.content_id,
        subcontent_id: v.subcontent_id,
        channel_id: v.channel_id,
        subject_name: v.subject_name || null,
      },
    }));

    return safeJsonResponse(res, 200, result);
  } catch (err) {
    console.error("Error fetching random videos:", err);
    return safeJsonResponse(res, 500, { message: "Internal server error" });
  }
};

const getVideosByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { profileId } = req.query;

    const assignments = await prisma.$queryRaw`
      SELECT * FROM get_videos_by_grade(
        ${gradeId}::uuid,
        ${profileId ? profileId : null}::uuid
      );
    `;

    const formattedVideos = assignments.map((a) => ({
      videoId: a.id,
      title: a.title,
      thumbnails: a.thumbnails,
      publishedAt: a.published_at,
      channelTitle: a.channel_title,
      duration: a.duration,
      viewCount: formatViewCount(a.view_count),
      locator: {
        grade_id: a.grade_id,
        subject_id: a.subject_id,
        content_id: a.content_id,
        subcontent_id: a.subcontent_id,
        channel_id: a.channel_id,
        subject_name: a.subject_name || null,
      },
    }));

    return safeJsonResponse(res, 200, formattedVideos);
  } catch (error) {
    console.error(error);
    return safeJsonResponse(res, 500, { error: "Failed to fetch videos" });
  }
};

const getVideosByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { profileId } = req.query;

    // First, get all videos from this channel with duration >= 120
    const videosWhere = {
      channel_id: channelId,
      duration: {
        gte: 120,
      },
    };

    const videos = await prisma.videos.findMany({
      where: videosWhere,
    });

    if (!videos.length) {
      return safeJsonResponse(res, 404, { error: "No videos found for this channel" });
    }

    const videoIds = videos.map((v) => v.id);
    
    // Get assignments for these videos
    const assignmentWhere = {
      video_id: { in: videoIds },
    };

    if (profileId) {
      assignmentWhere.reports = {
        none: {
          profile_id: profileId,
        },
      };
    }

    const assignments = await prisma.video_assignments.findMany({
      where: assignmentWhere,
      include: {
        subjects: true,
      },
    });

    const assignmentMap = {};
    for (const a of assignments) {
      assignmentMap[a.video_id] = a;
    }

    const formattedVideos = videos.map((video) => {
      const assignment = assignmentMap[video.id];
      return {
        videoId: video.id,
        title: video.title,
        thumbnails: video.thumbnails,
        publishedAt: video.published_at,
        channelTitle: video.channel_title,
        duration: video.duration,
        viewCount: formatViewCount(video.view_count),
        id: video.id,
        locator: assignment
          ? {
              grade_id: assignment.grade_id,
              subject_id: assignment.subject_id,
              content_id: assignment.content_id,
              subcontent_id: assignment.subcontent_id,
              channel_id: video.channel_id,
              subject_name: assignment.subjects?.name || null,
            }
          : null,
      };
    });

    return safeJsonResponse(res, 200, formattedVideos);
  } catch (error) {
    console.error("Error fetching videos by channel:", error);
    return safeJsonResponse(res, 500, { error: "Failed to fetch videos" });
  }
};

const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await prisma.videos.findUnique({ where: { id } });

    if (!video) {
      return safeJsonResponse(res, 404, { error: "Video not found 2" });
    }

    return safeJsonResponse(res, 200, video);
  } catch (error) {
    console.error("Error fetching video:", error);
    return safeJsonResponse(res, 500, { error: "Failed to fetch video" });
  }
};

const createVideo = async (req, res) => {
  try {
    const { title, thumbnails, id, published_at, channel_title, channel_id } = req.body;

    if (!title || !id) {
      return safeJsonResponse(res, 400, { error: "Missing required fields: title, id" });
    }

    const video = await prisma.videos.create({
      data: {
        id,
        title,
        thumbnails,
        published_at: published_at ? new Date(published_at) : undefined,
        channel_title,
        channel_id,
      },
    });

    return safeJsonResponse(res, 201, video);
  } catch (error) {
    console.error("Error creating video:", error);
    return safeJsonResponse(res, 500, { error: "Failed to create video" });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, thumbnails, published_at, channel_title, channel_id } = req.body;

    const video = await prisma.videos.update({
      where: { id },
      data: {
        title,
        thumbnails,
        published_at: published_at ? new Date(published_at) : undefined,
        channel_title,
        channel_id,
      },
    });

    return safeJsonResponse(res, 200, video);
  } catch (error) {
    console.error("Error updating video:", error);
    return safeJsonResponse(res, 500, { error: "Failed to update video" });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    // Archive the video before deletion
    let archived = false;
    try {
      await prisma.deleted_videos.upsert({
        where: { video_id: id },
        update: { deleted_at: new Date() },
        create: {
          video_id: id,
          deleted_at: new Date(),
        },
      });
      archived = true;
    } catch (archiveError) {
      // Log but don't fail if archiving fails (RLS might block it)
      console.warn("Could not archive deleted video:", archiveError.message);
    }

    // Delete the video - CASCADE constraints will handle related records
    await prisma.videos.delete({
      where: { id },
    });

    const message = archived 
      ? "Video deleted and archived"
      : "Video deleted";
    
    return safeJsonResponse(res, 200, { message });
  } catch (error) {
    console.error("Error deleting video:", error);
    return safeJsonResponse(res, 500, { 
      error: error.message || "Failed to delete video" 
    });
  }
};

const removeFromWatchHistory = async (req, res) => {
  try {
    const { profileId, videoId } = req.body;

    if (!profileId || !videoId) {
      return safeJsonResponse(res, 400, { error: "Missing required fields: profileId, videoId" });
    }

    await prisma.watch_histories.deleteMany({
      where: {
        profile_id: profileId,
        video_id: videoId,
      },
    });

    return safeJsonResponse(res, 200, { message: "Watch history entries removed" });
  } catch (error) {
    console.error("Error removing watch history:", error);
    return safeJsonResponse(res, 500, { error: "Failed to remove watch history" });
  }
};

const saveVideos = async (req, res) => {
  try {
    const { subcontentId, contentId, subjectId, gradeId, videos } = req.body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return safeJsonResponse(res, 400, { error: "Missing required fields: videos array is required" });
    }

    if (!gradeId && !subcontentId) {
      return safeJsonResponse(res, 400, { error: "Either gradeId or subcontentId is required" });
    }

    const rows = videos.map((v) => ({
      id: v.videoId,
      title: v.title,
      thumbnails: v.thumbnails,
      published_at: v.publishedAt ? new Date(v.publishedAt) : undefined,
      channel_title: v.channelTitle,
      channel_id: v.channelId || null,
    }));

    const result = await prisma.$transaction(
      async (tx) => {
        let savedCount = 0;
        let assignedCount = 0;

        for (const row of rows) {
          const existing = await tx.videos.findUnique({ where: { id: row.id } });
          if (!existing) {
            await tx.videos.create({ data: row });
            savedCount++;
          }

          const assignmentWhere = {
            video_id: row.id,
            grade_id: gradeId || null,
            subject_id: subjectId || null,
            content_id: contentId || null,
          };
          if (subcontentId) {
            assignmentWhere.subcontent_id = subcontentId;
          }

          const existingAssignment = await tx.video_assignments.findFirst({
            where: assignmentWhere,
          });

          if (!existingAssignment) {
            const assignmentData = {
              video_id: row.id,
              grade_id: gradeId || null,
              subject_id: subjectId || null,
              content_id: contentId || null,
            };
            if (subcontentId) {
              assignmentData.subcontent_id = subcontentId;
            }

            await tx.video_assignments.create({
              data: assignmentData,
            });
            assignedCount++;
          }
        }

        return { savedCount, assignedCount };
      },
      {
        timeout: 120000,
        maxWait: 30000,
      }
    );

    return safeJsonResponse(res, 201, {
      message: "Videos saved",
      count: result.savedCount,
      assignmentsCreated: result.assignedCount,
    });
  } catch (error) {
    console.error("Error saving videos:", error);
    return safeJsonResponse(res, 500, { error: "Failed to save videos" });
  }
};

const getAdvertVideos = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { profileId } = req.query;

    const videosFilter = {
      duration: {
        lt: 120,
      },
    };

    if (profileId) {
      videosFilter.reports = {
        none: {
          profile_id: profileId,
        },
      };
    }

    const where = {
      grade_id: gradeId,
      videos: videosFilter,
    };

    const assignments = await prisma.video_assignments.findMany({
      where,
      include: {
        videos: true,
        subjects: true,
      },
    });

    if (!assignments.length) {
      return safeJsonResponse(res, 200, []);
    }

    const filteredAssignments = assignments.filter((a) => {
      const subjectName = a.subjects?.name;
      return subjectName !== "Entertainment";
    });

    const formattedVideos = filteredAssignments.map((a) => ({
      videoId: a.videos.id,
      title: a.videos.title,
      thumbnails: a.videos.thumbnails,
      publishedAt: a.videos.published_at,
      channelTitle: a.videos.channel_title,
      channelId: a.videos.channel_id,
      duration: a.videos.duration,
      viewCount: formatViewCount(a.videos.view_count),
      locator: {
        grade_id: a.grade_id,
        subject_id: a.subject_id,
        content_id: a.content_id,
        subcontent_id: a.subcontent_id,
        channel_id: a.videos.channel_id,
        subject_name: a.subjects?.name || null,
      },
    }));

    return safeJsonResponse(res, 200, formattedVideos);
  } catch (err) {
    console.error("Error fetching advert videos:", err);
    return safeJsonResponse(res, 500, { message: "Server error" });
  }
};

const getAdvertVideosFromFavoriteChannels = async (req, res) => {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      return safeJsonResponse(res, 400, { error: "profileId is required" });
    }

    // Get profile to fetch grade_id
    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { grade_id: true },
    });

    if (!profile) {
      return safeJsonResponse(res, 404, { error: "Profile not found" });
    }

    // Get all favorite channel IDs for this profile
    const favoriteChannels = await prisma.favorite_channels.findMany({
      where: { profile_id: profileId },
      select: { channel_id: true },
    });

    if (!favoriteChannels.length) {
      return safeJsonResponse(res, 200, []);
    }

    const channelIds = favoriteChannels.map(fc => fc.channel_id);

    // Fetch videos with duration > 120s from favorite channels
    const videos = await prisma.videos.findMany({
      where: {
        channel_id: { in: channelIds },
        duration: { gte: 120 },
        reports: {
          none: {
            profile_id: profileId,
          },
        },
      },
    });

    if (!videos.length) {
      return safeJsonResponse(res, 200, []);
    }

    const videoIds = videos.map(v => v.id);

    // Get assignments for these videos
    const assignments = await prisma.video_assignments.findMany({
      where: {
        video_id: { in: videoIds },
        grade_id: profile.grade_id,
      },
      include: {
        subjects: true,
      },
    });

    const assignmentMap = {};
    for (const a of assignments) {
      assignmentMap[a.video_id] = a;
    }

    const formattedVideos = videos.map((video) => {
      const assignment = assignmentMap[video.id];
      return {
        videoId: video.id,
        title: video.title,
        thumbnails: video.thumbnails,
        publishedAt: video.published_at,
        channelTitle: video.channel_title,
        channelId: video.channel_id,
        duration: video.duration,
        viewCount: formatViewCount(video.view_count),
        locator: assignment
          ? {
              grade_id: assignment.grade_id,
              subject_id: assignment.subject_id,
              content_id: assignment.content_id,
              subcontent_id: assignment.subcontent_id,
              channel_id: video.channel_id,
              subject_name: assignment.subjects?.name || null,
            }
          : null,
      };
    });

    return safeJsonResponse(res, 200, formattedVideos);
  } catch (err) {
    console.error("Error fetching advert videos from favorite channels:", err);
    return safeJsonResponse(res, 500, { message: "Server error" });
  }
};

const getAdvertVideosByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { profileId } = req.query;

    if (!channelId) {
      return safeJsonResponse(res, 400, { error: "channelId is required" });
    }

    // Fetch videos with duration > 120s from the specific channel
    const videos = await prisma.videos.findMany({
      where: {
        channel_id: channelId,
        duration: { lt: 150 },
        ...(profileId && {
          reports: {
            none: {
              profile_id: profileId,
            },
          },
        }),
      },
    });

    if (!videos.length) {
      return safeJsonResponse(res, 200, []);
    }

    const videoIds = videos.map(v => v.id);

    // Get assignments for these videos
    const assignments = await prisma.video_assignments.findMany({
      where: {
        video_id: { in: videoIds },
      },
      include: {
        subjects: true,
      },
    });

    const assignmentMap = {};
    for (const a of assignments) {
      assignmentMap[a.video_id] = a;
    }

    const formattedVideos = videos.map((video) => {
      const assignment = assignmentMap[video.id];
      return {
        videoId: video.id,
        title: video.title,
        thumbnails: video.thumbnails,
        publishedAt: video.published_at,
        channelTitle: video.channel_title,
        channelId: video.channel_id,
        duration: video.duration,
        viewCount: formatViewCount(video.view_count),
        locator: assignment
          ? {
              grade_id: assignment.grade_id,
              subject_id: assignment.subject_id,
              content_id: assignment.content_id,
              subcontent_id: assignment.subcontent_id,
              channel_id: video.channel_id,
              subject_name: assignment.subjects?.name || null,
            }
          : null,
      };
    });

    return safeJsonResponse(res, 200, formattedVideos);
  } catch (err) {
    console.error("Error fetching advert videos by channel:", err);
    return safeJsonResponse(res, 500, { message: "Server error" });
  }
};

// Search YouTube API for videos
const searchYouTubeVideos = async (req, res) => {
  try {
    const { query, maxResults = 10 } = req.query;

    if (!query) {
      return safeJsonResponse(res, 400, { error: "Search query is required" });
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return safeJsonResponse(res, 500, { error: "YouTube API key not configured" });
    }

    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        maxResults: maxResults,
        key: YOUTUBE_API_KEY,
      },
    });

    const videos = response.data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnails: item.snippet.thumbnails,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
    }));

    return safeJsonResponse(res, 200, videos);
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return safeJsonResponse(res, 500, { error: "Failed to search YouTube videos" });
  }
};

// Get curriculum tree for navigation
const getCurriculumTree = async (req, res) => {
  try {
    const grades = await prisma.grades.findMany({
      orderBy: { sort_order: 'asc' },
      include: {
        subjects: {
          orderBy: { name: 'asc' },
          include: {
            contents: {
              orderBy: { name: 'asc' },
              include: {
                subcontents: {
                  orderBy: { name: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    return safeJsonResponse(res, 200, grades);
  } catch (error) {
    console.error("Error fetching curriculum tree:", error);
    return safeJsonResponse(res, 500, { error: "Failed to fetch curriculum tree" });
  }
};

// Delete single video assignment
const deleteVideoAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    await prisma.video_assignments.delete({
      where: { id: assignmentId },
    });

    return safeJsonResponse(res, 200, { message: "Video assignment deleted" });
  } catch (error) {
    console.error("Error deleting video assignment:", error);
    return safeJsonResponse(res, 500, { error: "Failed to delete video assignment" });
  }
};

// Bulk delete videos (CASCADE constraints handle related records)
const bulkDeleteVideoAssignments = async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return safeJsonResponse(res, 400, { error: "videoIds array is required" });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(
      async (tx) => {
        // Delete videos in bulk - CASCADE constraints will handle related records
        const deleteResult = await tx.videos.deleteMany({
          where: {
            id: {
              in: videoIds,
            },
          },
        });

        // Only archive videos that were actually deleted
        let archivedCount = 0;
        if (deleteResult.count > 0) {
          // Get the list of deleted video IDs from the result
          const deletedIds = videoIds.slice(0, deleteResult.count);
          
          // Archive each successfully deleted video
          for (const videoId of deletedIds) {
            try {
              await tx.deleted_videos.upsert({
                where: { video_id: videoId },
                update: { deleted_at: new Date() },
                create: {
                  video_id: videoId,
                  deleted_at: new Date(),
                },
              });
              archivedCount++;
            } catch (archiveError) {
              // Log but don't fail if archiving fails (RLS might block it)
              console.warn(`Could not archive video ${videoId}:`, archiveError.message);
            }
          }
        }

        const message = archivedCount > 0
          ? `${deleteResult.count} video(s) deleted and ${archivedCount} archived`
          : `${deleteResult.count} video(s) deleted`;

        return {
          deletedCount: deleteResult.count,
          archivedCount,
          totalRequested: videoIds.length,
          message,
        };
      },
      {
        timeout: 60000,
        maxWait: 15000,
      }
    );

    return safeJsonResponse(res, 200, {
      message: result.message,
      deletedCount: result.deletedCount,
      archivedCount: result.archivedCount,
      totalRequested: result.totalRequested,
    });
  } catch (error) {
    console.error("Error bulk deleting videos:", error);
    return safeJsonResponse(res, 500, { 
      error: error.message || "Failed to bulk delete videos" 
    });
  }
};

// Get videos by subcontent for workspace (with assignments for deletion)
 const getWorkspaceVideosBySubcontent = async (req, res) => {
  try {
    const { subcontentId } = req.params;
    const { gradeId, subjectId, contentId } = req.query;

    const where = {
      subcontent_id: subcontentId,
      videos: {
        duration: {
          gte: 120,
        },
      },
    };

    if (gradeId) where.grade_id = gradeId;
    if (subjectId) where.subject_id = subjectId;
    if (contentId) where.content_id = contentId;

    const assignments = await prisma.video_assignments.findMany({
      where,
      include: {
        videos: true,
        subjects: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedVideos = assignments.map((a) => ({
      assignmentId: a.id,
      videoId: a.videos.id,
      title: a.videos.title,
      thumbnails: a.videos.thumbnails,
      publishedAt: a.videos.published_at,
      channelTitle: a.videos.channel_title,
      channelId: a.videos.channel_id,
      duration: a.videos.duration,
      viewCount: formatViewCount(a.videos.view_count),
      locator: {
        grade_id: a.grade_id,
        subject_id: a.subject_id,
        content_id: a.content_id,
        subcontent_id: a.subcontent_id,
        channel_id: a.videos.channel_id,
        subject_name: a.subjects?.name || null,
      },
    }));

    return safeJsonResponse(res, 200, formattedVideos);
  } catch (error) {
    console.error("Error fetching workspace videos:", error);
    return safeJsonResponse(res, 500, { error: "Failed to fetch workspace videos" });
  }
};

export {
  getVideosBySubcontent,
  getRandomVideos,
  getVideosByGrade,
  getVideosByChannel,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  saveVideos,
  removeFromWatchHistory,
  getAdvertVideos,
  getAdvertVideosFromFavoriteChannels,
  getAdvertVideosByChannel,
  searchYouTubeVideos,
  getCurriculumTree,
  bulkDeleteVideoAssignments,
  deleteVideoAssignment,
  getWorkspaceVideosBySubcontent,
};
