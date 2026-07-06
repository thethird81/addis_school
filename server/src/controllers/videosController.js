import { prisma } from "../config/db.js";

// Helper function to format view counts in compact notation
export const formatViewCount = (count) => {
  if (count === null || count === undefined) return null;
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(count);
};

const getVideosBySubcontent = async (req, res) => {
  try {
    const { subcontentId } = req.params;
    const { gradeId, subjectId, contentId, profileId } = req.query;

    // Build a dynamic where clause to filter by full curriculum context
    // Only return non-advert (curricular) video assignments (duration >= 120 seconds)
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

    // If profileId is provided, exclude videos reported by this profile
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
      return res.status(404).json({ message: "No videos found" });
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

    res.status(200).json(formattedVideos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getRandomVideos = async (req, res) => {
  try {
    const { profileId } = req.query;

    // Calling the new global, parameter-free database function
    const videos = await prisma.$queryRaw`
      SELECT * FROM get_global_random_assigned_videos();
    `;

    if (!videos || !videos.length) {
      return res.status(404).json({ message: "No videos found" });
    }

    // Convert BigInt values to strings to avoid serialization errors
    const result = videos.map((v) => ({
      videoId: v.id,
      title: v.title,
      thumbnails: v.thumbnails,
      publishedAt: v.published_at,
      channelTitle: v.channel_title,
      duration: v.duration,
      viewCount: formatViewCount(v.view_count),
      locator:  {
        grade_id: v.grade_id,
        subject_id: v.subject_id,
        content_id: v.content_id,
        subcontent_id: v.subcontent_id,
        channel_id: v.channel_id,
        subject_name: v.subject_name || null,
      } 
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching random videos:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getVideosByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { profileId } = req.query;

   // Call the stored function using raw query. 
    // Prisma maps the template variables safely into the query execution string.
    const assignments = await prisma.$queryRaw`
      SELECT * FROM get_videos_by_grade(
        ${gradeId}::uuid, 
        ${profileId ? profileId : null}::uuid
      );
    `;
// Process flat rows into the response structure you expect
const formattedVideos = assignments.map((a) => ({
  videoId: a.id,                  // FIXED: Read directly from row
  title: a.title,                 // FIXED: Read directly from row
  thumbnails: a.thumbnails,       // FIXED: Read directly from row
  publishedAt: a.published_at,    // FIXED: Read directly from row
  channelTitle: a.channel_title,  // FIXED: Read directly from row
  duration: a.duration,           // FIXED: Read directly from row
  viewCount: formatViewCount(a.view_count),
  locator: {
    grade_id: a.grade_id,
    subject_id: a.subject_id,
    content_id: a.content_id,
    subcontent_id: a.subcontent_id,
    channel_id: a.channel_id,     // FIXED: Read directly from row
    subject_name: a.subject_name || null, // FIXED: Read directly from row
  },
}));

    res.status(200).json(formattedVideos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

const getVideosByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { profileId } = req.query;

    const where = {
      channel_id: channelId,
    };

    // If profileId is provided, exclude videos reported by this profile
    if (profileId) {
      where.reports = {
        none: {
          profile_id: profileId,
        },
      };
    }

    const videos = await prisma.videos.findMany({
      where,
    });

    if (!videos.length) {
      return res.status(404).json({ error: "No videos found for this channel" });
    }

    // Get video_assignments for all found videos to build locators
    // Only return non-advert (curricular) assignments (duration >= 120 seconds)
    const videoIds = videos.map((v) => v.id);
    const assignments = await prisma.video_assignments.findMany({
      where: {
        video_id: { in: videoIds },
        videos: {
          duration: {
            gte: 120,
          },
        },
      },
      include: {
        subjects: true,
      },
    });

    // Build a map of video_id -> assignment for locator lookup
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

    res.status(200).json(formattedVideos);
  } catch (error) {
    console.error("Error fetching videos by channel:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await prisma.videos.findUnique({ where: { id } });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.status(200).json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
};

const createVideo = async (req, res) => {
  try {
    const { title, thumbnails, id, published_at, channel_title, channel_id } = req.body;

    if (!title || !id) {
      return res.status(400).json({ error: "Missing required fields: title, id" });
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

    res.status(201).json(video);
  } catch (error) {
    console.error("Error creating video:", error);
    res.status(500).json({ error: "Failed to create video" });
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

    res.status(200).json(video);
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ error: "Failed to update video" });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.videos.delete({ where: { id } });
    res.status(200).json({ message: "Video deleted" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
};

const removeFromWatchHistory = async (req, res) => {
  try {
    const { profileId, videoId } = req.body;

    if (!profileId || !videoId) {
      return res.status(400).json({ error: "Missing required fields: profileId, videoId" });
    }

    await prisma.watch_histories.deleteMany({
      where: {
        profile_id: profileId,
        video_id: videoId,
      },
    });

    res.status(200).json({ message: "Watch history entries removed" });
  } catch (error) {
    console.error("Error removing watch history:", error);
    res.status(500).json({ error: "Failed to remove watch history" });
  }
};

const saveVideos = async (req, res) => {
  try {
   
    const { subcontentId, contentId, subjectId, gradeId ,videos } = req.body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: "Missing required fields: videos array is required" });
    }

    // Channel-level saves don't need subcontentId; grade-level saves need at least gradeId
    if (!gradeId && !subcontentId) {
      return res.status(400).json({ error: "Either gradeId or subcontentId is required" });
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
          // Upsert the video record (create if not exists)
          const existing = await tx.videos.findUnique({ where: { id: row.id } });
          if (!existing) {
            await tx.videos.create({ data: row });
            savedCount++;
          }

          // Build the where clause based on what's available
          const assignmentWhere = {
            video_id: row.id,
            grade_id: gradeId || null,
            subject_id: subjectId || null,
            content_id: contentId || null,
          };
          // Only add subcontent_id to the where if it's provided (channel saves send null)
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
            // Only include subcontent_id if provided
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

    res.status(201).json({
      message: "Videos saved",
      count: result.savedCount,
      assignmentsCreated: result.assignedCount,
    });
  } catch (error) {
    console.error("Error saving videos:", error);
    res.status(500).json({ error: "Failed to save videos" });
  }
};

const getAdvertVideos = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { profileId } = req.query;

    // Only return advert videos (duration < 120 seconds) excluding Entertainment subject
    const videosFilter = {
      duration: {
        lt: 120,
      },
    };

    // If profileId is provided, exclude videos reported by this profile
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
      return res.status(200).json([]);
    }

    // Filter out Entertainment subject
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

    res.status(200).json(formattedVideos);
  } catch (err) {
    console.error("Error fetching advert videos:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export { getVideosBySubcontent, getRandomVideos, getVideosByGrade, getVideosByChannel, getVideoById, createVideo, updateVideo, deleteVideo, saveVideos, removeFromWatchHistory, getAdvertVideos }