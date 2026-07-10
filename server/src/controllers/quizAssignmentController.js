import { prisma } from "../config/db.js";

const getQuizAssignmentsByFilters = async (req, res) => {
  try {
    const { grade_id, subject_id, content_id, subcontent_id } = req.query;

    const where = {};
    if (grade_id) where.grade_id = grade_id;
    if (subject_id) where.subject_id = subject_id;
    if (content_id) where.content_id = content_id;
    if (subcontent_id) where.subcontent_id = subcontent_id;

    const assignments = await prisma.quiz_assignments.findMany({
      where,
      include: {
        quizzes: { select: { id: true, title: true } },
        grades: { select: { name: true } },
        subjects: { select: { name: true } },
        contents: { select: { name: true } },
        subcontents: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching quiz assignments:", error);
    res.status(500).json({ error: "Failed to fetch quiz assignments" });
  }
};

const bulkAssignQuizzes = async (req, res) => {
  try {
    const { quizIds, grade_id, subject_id, content_id, subcontent_id } = req.body;

    if (!Array.isArray(quizIds) || quizIds.length === 0) {
      return res.status(400).json({ error: "quizIds must be a non-empty array" });
    }

    if (!grade_id) {
      return res.status(400).json({ error: "grade_id is required" });
    }

    let inserted = 0;
    let skipped = 0;

    // Standardize incoming missing values to null for strict comparison
    const targetSubject = subject_id ?? null;
    const targetContent = content_id ?? null;
    const targetSubcontent = subcontent_id ?? null;

    for (const quizId of quizIds) {
      try {
        // 1. Check if the exact assignment combination already exists
        const existingAssignment = await prisma.quiz_assignments.findFirst({
          where: {
            quiz_id: quizId,
            grade_id,
            subject_id: targetSubject,
            content_id: targetContent,
            subcontent_id: targetSubcontent,
          },
        });

        if (existingAssignment) {
          // 2. If it exists, update it by ID (or just count it as skipped if you have no changes)
          await prisma.quiz_assignments.update({
            where: { id: existingAssignment.id },
            data: {}, // Since your update block was empty, this keeps it unchanged
          });
          inserted++; 
        } else {
          // 3. If it doesn't exist, create it safely
          await prisma.quiz_assignments.create({
            data: {
              quiz_id: quizId,
              grade_id,
              subject_id: targetSubject,
              content_id: targetContent,
              subcontent_id: targetSubcontent,
            },
          });
          inserted++;
        }
      } catch (err) {
        skipped++;
        console.warn(`Skipped assignment for quiz ${quizId}:`, err.message);
      }
    }

    res.status(200).json({
      message: `Assigned ${inserted} quiz(es), skipped ${skipped} error(s)`,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error("Error bulk assigning quizzes:", error);
    res.status(500).json({ error: "Failed to assign quizzes" });
  }
};
const getQuizAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.quiz_assignments.findUnique({
      where: { id },
      include: {
        quizzes: true,
        grades: true,
        subjects: true,
        contents: true,
        subcontents: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.status(200).json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
};

const deleteQuizAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quiz_assignments.delete({ where: { id } });
    res.status(200).json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
};

export {
  getQuizAssignmentsByFilters,
  bulkAssignQuizzes,
  getQuizAssignmentById,
  deleteQuizAssignment,
};