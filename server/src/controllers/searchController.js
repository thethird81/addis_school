import { prisma } from "../config/db.js";

const getSubcontentsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;

    const subjects = await prisma.subjects.findMany({
      where: { grade_id: gradeId },
      include: {
        contents: {
          include: {
            subcontents: {
              select: {
                id: true,
                name: true,
                content_id: true,
              },
            },
          },
        },
      },
    });

    const result = [];
    for (const subject of subjects) {
      for (const content of subject.contents || []) {
        for (const sub of content.subcontents || []) {
          result.push({
            subcontentId: sub.id,
            subcontentName: sub.name,
            locator: {
              grade_id: gradeId,
              subject_id: subject.id,
              content_id: content.id,
              subcontent_id: sub.id,
            },
          });
        }
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching subcontents for search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { getSubcontentsByGrade };