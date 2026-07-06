import { prisma } from "../config/db.js";

const getLikedVideosByProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const likedVideos = await prisma.likes.findMany({
      where: { profile_id: profileId },
      include: {
        videos: {
          include: {
            video_assignments: {
              include: {
                subcontents: {
                  include: {
                    contents: {
                      include: {
                        subjects: true,
                      },
                    },
                  },
                },
                subjects: true,
              },
            },
          },
        },
      },
      orderBy: { liked_at: "desc" },
    });

    if (!likedVideos.length) {
      return res.status(200).json([]);
    }

    const formatted = likedVideos.map((like) => {
      // Use the first video_assignment to build the locator (if one exists)
      const assignment = like.videos.video_assignments?.[0];
      const subcontent = assignment?.subcontents;
      const content = subcontent?.contents;
      const subject = content?.subjects;

      return {
        profileId: like.profile_id,
        videoId: like.video_id,
        likedAt: like.liked_at,
        video: {
          id: like.videos.id,
          videoId: like.videos.id,
          title: like.videos.title,
          thumbnails: like.videos.thumbnails,
          publishedAt: like.videos.published_at,
          channelTitle: like.videos.channel_title,
          channelId: like.videos.channel_id,
          subcontentId: subcontent?.id || null,
          locator: assignment
            ? {
                grade_id: assignment.grade_id,
                subject_id: assignment.subject_id,
                content_id: assignment.content_id,
                subcontent_id: assignment.subcontent_id,
                channel_id: like.videos.channel_id,
                subject_name: assignment.subjects?.name || null,
              }
            : null,
        },
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching liked videos:", error);
    res.status(500).json({ error: "Failed to fetch liked videos" });
  }
};

const likeVideo = async (req, res) => {
  try {
    const { profileId, videoId } = req.body;

    if (!profileId || !videoId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const like = await prisma.likes.create({
      data: {
        profile_id: profileId,
        video_id: videoId,
      },
    });

    res.status(201).json({ message: "Video liked", like });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Video already liked" });
    }
    console.error("Error liking video:", error);
    res.status(500).json({ error: "Failed to like video" });
  }
};

const unlikeVideo = async (req, res) => {
  try {
    const { profileId, videoId } = req.body;

    if (!profileId || !videoId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const like = await prisma.likes.delete({
      where: {
        profile_id_video_id: {
          profile_id: profileId,
          video_id: videoId,
        },
      },
    });

    res.status(200).json({ message: "Video unliked" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Like not found" });
    }
    console.error("Error unliking video:", error);
    res.status(500).json({ error: "Failed to unlike video" });
  }
};

export { getLikedVideosByProfile, likeVideo, unlikeVideo };
