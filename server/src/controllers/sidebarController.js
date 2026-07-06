import { prisma } from "../config/db.js";


const getSidebarContentByGrade = async (req, res) => {
    // get the profile id from body
    // get the grade id from profiles table

  const { id } = req.params
  console.log("Received grade_id:", id) // Debug log to check the received grade_id
  

  try {
    const data = await prisma.grades.findUnique({
      where: {
        id: id // UUID → keep as string
      },
      include: {
        subjects: {
          include: {
            contents: {
              include: {
                subcontents: true
              }
            },
            channel_assignments: {
              where: {
                subject_id: { not: null }
              },
              include: {
                channels: true
              }
            }
          }
        }
      }
    })

    if (!data) {
      return res.status(404).json({ error: 'Grade not found' })
    }

     const transformed = {
  gradeId: data.id,              // grade_id
  gradeName: data.name,          // grade_name
  subjects: (data.subjects || []).map(subject => ({
    subjectId: subject.id,
    subjectName: subject.name,
    channels: (subject.channel_assignments || []).map(ca => ({
      channelId: ca.channels.id,
      channelName: ca.channels.name,
      channelThumbnail: ca.channels.thumbnail_url
    })),
    contents: (subject.contents || []).map(content => ({
      contentId: content.id,
      contentName: content.name,
      subcontents: (content.subcontents || []).map(sc => ({
        subcontentId: sc.id,
        subcontentName: sc.name
      }))
    }))
  }))
};

    res.status(200).json(transformed)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

const getGradeList = async (req, res) => {
    try {
    const grades = await prisma.grades.findMany({
      select: { id: true, name: true } // match your table columns (name)
    });

    // convert to id: name object
    const result = grades.reduce((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching grades:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getSidebarQuizzesByGrade = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Received grade_id for quizzes:", id);

    // Get all quiz assignments for this grade with quiz details
    const quizAssignments = await prisma.quiz_assignments.findMany({
      where: { grade_id: id },
      include: {
        quizzes: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Fetch general quizzes (is_general: true) to include in the general quizzes section
    const generalQuizRecords = await prisma.quizzes.findMany({
      where: { is_general: true },
      select: { id: true, title: true }
    });

    if (quizAssignments.length === 0 && generalQuizRecords.length === 0) {
      return res.status(200).json({ gradeId: id, subjects: [], generalQuizzes: [] });
    }

    // Separate assignments by hierarchy level
    const generalQuizzes = generalQuizRecords.map(function(q) {
      return { quizId: q.id, quizTitle: q.title };
    });  // grade-level only (no subject_id)
    const subjectLevelQuizzes = [];  // has subject_id, no content_id
    const contentLevelQuizzes = [];  // has content_id, no subcontent_id
    const subcontentLevelQuizzes = []; // has subcontent_id

    quizAssignments.forEach((qa) => {
      if (!qa.quiz_id) return;

      const quizObj = {
        quizId: qa.quizzes.id,
        quizTitle: qa.quizzes.title
      };

      if (qa.subcontent_id) {
        subcontentLevelQuizzes.push({ ...qa, quizObj });
      } else if (qa.content_id) {
        contentLevelQuizzes.push({ ...qa, quizObj });
      } else if (qa.subject_id) {
        subjectLevelQuizzes.push({ ...qa, quizObj });
      } else {
        generalQuizzes.push(quizObj);
      }
    });

    // Collect all subject IDs that have any quiz assignment
    const subjectIds = new Set([
      ...subjectLevelQuizzes.map(qa => qa.subject_id),
      ...contentLevelQuizzes.map(qa => qa.subject_id),
      ...subcontentLevelQuizzes.map(qa => qa.subject_id)
    ]);

    if (subjectIds.size === 0) {
      return res.status(200).json({ gradeId: id, subjects: [], generalQuizzes });
    }

    // Fetch only subjects that have quizzes
    const allSubjects = await prisma.subjects.findMany({
      where: { id: { in: Array.from(subjectIds) }, grade_id: id },
      include: {
        contents: {
          include: {
            subcontents: true
          }
        }
      }
    });

    // Build subject-level quiz lookup: subjectId -> [quizzes]
    const subjectQuizLookup = new Map();
    subjectLevelQuizzes.forEach((qa) => {
      if (!subjectQuizLookup.has(qa.subject_id)) {
        subjectQuizLookup.set(qa.subject_id, []);
      }
      subjectQuizLookup.get(qa.subject_id).push(qa.quizObj);
    });

    // Build content-level quiz lookup: contentId -> [quizzes]
    const contentQuizLookup = new Map();
    contentLevelQuizzes.forEach((qa) => {
      if (!contentQuizLookup.has(qa.content_id)) {
        contentQuizLookup.set(qa.content_id, []);
      }
      contentQuizLookup.get(qa.content_id).push(qa.quizObj);
    });

    // Build subcontent-level quiz lookup: subcontentId -> [quizzes]
    const subcontentQuizLookup = new Map();
    subcontentLevelQuizzes.forEach((qa) => {
      if (!subcontentQuizLookup.has(qa.subcontent_id)) {
        subcontentQuizLookup.set(qa.subcontent_id, []);
      }
      subcontentQuizLookup.get(qa.subcontent_id).push(qa.quizObj);
    });

    // Build hierarchy with quizzes placed at their actual level
    const subjectsWithQuizzes = allSubjects.map((subject) => {
      // Only include contents that have quizzes at content or subcontent level
      const relevantContents = subject.contents.filter((content) => {
        const hasContentQuizzes = contentQuizLookup.has(content.id);
        const hasSubcontentQuizzes = content.subcontents.some(sc => subcontentQuizLookup.has(sc.id));
        return hasContentQuizzes || hasSubcontentQuizzes;
      });

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        quizzes: subjectQuizLookup.get(subject.id) || [],
        contents: relevantContents.map((content) => {
          // Only include subcontents that actually have quizzes
          const relevantSubcontents = content.subcontents.filter(sc =>
            subcontentQuizLookup.has(sc.id)
          );

          return {
            contentId: content.id,
            contentName: content.name,
            quizzes: contentQuizLookup.get(content.id) || [],
            subcontents: relevantSubcontents.map((sc) => ({
              subcontentId: sc.id,
              subcontentName: sc.name,
              quizzes: subcontentQuizLookup.get(sc.id) || []
            }))
          };
        })
      };
    });

    const transformed = {
      gradeId: id,
      subjects: subjectsWithQuizzes,
      generalQuizzes: generalQuizzes
    };

    res.status(200).json(transformed);
  } catch (error) {
    console.error("Error fetching sidebar quizzes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export {getSidebarContentByGrade, getGradeList, getSidebarQuizzesByGrade}