import { prisma } from "../config/db.js";

const getChannelsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;

    const gradeChannels = await prisma.channel_assignments.findMany({
      where: { 
        grade_id: gradeId,
        subject_id: null,
        content_id: null,
        subcontent_id: null,
      },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            thumbnail_url: true,
            type: true,
          },
        },
      },
    });

    if (!gradeChannels.length) {
      return res.status(404).json({ error: "No channels found for this grade" });
    }

    const channels = gradeChannels
      .map((row) => row.channels)
      .filter((channel, index, self) =>
        index === self.findIndex((c) => c.id === channel.id)
      )
      .filter((channel) => channel.type !== "advert");
      console.log("Fetched channels for grade:", gradeId, channels);

    res.status(200).json(channels);
  } catch (error) {
    console.error("Error fetching channels by grade:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
};

const getSubjectChannelsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;

    // Also fetch grade-level channels to exclude them from subject results
    const [gradeChannels, subjects] = await Promise.all([
      prisma.channel_assignments.findMany({
        where: { 
          grade_id: gradeId,
          subject_id: null,
          content_id: null,
          subcontent_id: null,
        },
        select: { channel_id: true },
      }),
      // Find all subjects belonging to this grade, then get their channel assignments
      prisma.subjects.findMany({
        where: { grade_id: gradeId },
        include: {
          channel_assignments: {
            where: {
              subject_id: { not: null },
            },
            include: {
              channels: {
                select: {
                  id: true,
                  name: true,
                  thumbnail_url: true,
                  type: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!subjects.length) {
      return res.status(404).json({ error: "No subjects found for this grade" });
    }

    // Build a set of grade-level channel IDs to exclude
    const gradeChannelIds = new Set(gradeChannels.map((gc) => gc.channel_id));

    // Collect unique channels from all subjects (excluding grade-level and adverts)
    // Include subject name(s) for each channel
    const channelMap = new Map();

    subjects.forEach((subject) => {
      subject.channel_assignments.forEach((ca) => {
        if (ca.channels && !gradeChannelIds.has(ca.channels.id)) {
          if (channelMap.has(ca.channels.id)) {
            // Channel already exists; add subject name if not already present
            const existing = channelMap.get(ca.channels.id);
            if (!existing.subject_names.includes(subject.name)) {
              existing.subject_names.push(subject.name);
            }
          } else {
            channelMap.set(ca.channels.id, {
              ...ca.channels,
              subject_name: subject.name,
            });
          }
        }
      });
    });

    const channels = Array.from(channelMap.values());

    if (!channels.length) {
      return res.status(404).json({ error: "No subject channels found for this grade" });
    }

    console.log("Fetched subject channels for grade:", gradeId, channels);
    res.status(200).json(channels);
  } catch (error) {
    console.error("Error fetching subject channels by grade:", error);
    res.status(500).json({ error: "Failed to fetch subject channels" });
  }
};

export { getChannelsByGrade, getSubjectChannelsByGrade };