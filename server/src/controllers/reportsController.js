import { prisma } from "../config/db.js";

const getReportedVideosByProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const reportedVideos = await prisma.reports.findMany({
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
      orderBy: { reported_at: "desc" },
    });

    if (!reportedVideos.length) {
      return res.status(200).json([]);
    }

    const formatted = reportedVideos.map((report) => {
      // Use the first video_assignment to build the locator (if one exists)
      const assignment = report.videos.video_assignments?.[0];
      const subcontent = assignment?.subcontents;
      const content = subcontent?.contents;
      const subject = content?.subjects;

      return {
        profileId: report.profile_id,
        videoId: report.video_id,
        reportedAt: report.reported_at,
        video: {
          id: report.videos.id,
          videoId: report.videos.id,
          title: report.videos.title,
          thumbnails: report.videos.thumbnails,
          publishedAt: report.videos.published_at,
          channelTitle: report.videos.channel_title,
          channelId: report.videos.channel_id,
          subcontentId: subcontent?.id || null,
          locator: assignment
            ? {
                grade_id: assignment.grade_id,
                subject_id: assignment.subject_id,
                content_id: assignment.content_id,
                subcontent_id: assignment.subcontent_id,
                channel_id: report.videos.channel_id,
                subject_name: assignment.subjects?.name || null,
              }
            : null,
        },
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching reported videos:", error);
    res.status(500).json({ error: "Failed to fetch reported videos" });
  }
};

const getAllReports = async (req, res) => {
  try {
    const reports = await prisma.reports.findMany({
      include: {
        videos: {
          select: {
            video_id: true,
            title: true,
          },
        },
      },
      orderBy: { reported_at: "desc" },
    });

    const formatted = reports.map((report) => ({
      profileId: report.profile_id,
      videoId: report.video_id,
      reportedAt: report.reported_at,
      video: {
        videoId: report.videos.video_id,
        title: report.videos.title,
      },
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching all reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

const reportVideo = async (req, res) => {
  try {
    const { profileId, videoId } = req.body;

    if (!profileId || !videoId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const report = await prisma.reports.create({
      data: {
        profile_id: profileId,
        video_id: videoId,
      },
    });

    res.status(201).json({ message: "Video reported", report });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Video already reported" });
    }
    console.error("Error reporting video:", error);
    res.status(500).json({ error: "Failed to report video" });
  }
};

const unreportVideo = async (req, res) => {
  try {
    const { profileId, videoId } = req.body;

    if (!profileId || !videoId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await prisma.reports.delete({
      where: {
        profile_id_video_id: {
          profile_id: profileId,
          video_id: videoId,
        },
      },
    });

    res.status(200).json({ message: "Report removed" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Report not found" });
    }
    console.error("Error removing report:", error);
    res.status(500).json({ error: "Failed to remove report" });
  }
};

export { getReportedVideosByProfile, getAllReports, reportVideo, unreportVideo };
