import express from "express";
import {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getSubjectsByGrade,
  createSubject,
  updateSubject,
  deleteSubject,
  getContentsBySubject,
  createContent,
  updateContent,
  deleteContent,
  getSubcontentsByContent,
  createSubcontent,
  updateSubcontent,
  deleteSubcontent,
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  assignChannelToGrade,
  removeChannelFromGrade,
  assignChannelToSubject,
  removeChannelFromSubject,
  assignChannelToPosition,
  getChannelAssignments,
  removeChannelAssignment,
  getChannelsByGrade,
  getFullTree,
  getGradeChannels,
  getSubjectChannels,
  getAllUsers,
  updateUserRole,
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  importQuizJSON,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizAssignments,
  assignQuiz,
  removeQuizAssignment,
  deleteVideosByPosition,
  getVideosBySubcontentAdmin,
  getVideosByChannelAdmin,
  addVideosBulk,
  deleteVideosByIds,
  getAllReportedVideos,
  resolveReportedVideo,
  deleteReportedVideo,
} from "../controllers/adminController.js";
import {
  getQuizAssignmentsByFilters,
  bulkAssignQuizzes,
  getQuizAssignmentById,
  deleteQuizAssignment,
} from "../controllers/quizAssignmentController.js";
import { authMiddleware, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, restrictTo('admin'));

// Tree
router.get("/tree", getFullTree);

// Grades
router.get("/grades", getGrades);
router.post("/grades", createGrade);
router.put("/grades/:id", updateGrade);
router.delete("/grades/:id", deleteGrade);

// Subjects
router.get("/subjects/:gradeId", getSubjectsByGrade);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

// Contents
router.get("/contents/:subjectId", getContentsBySubject);
router.post("/contents", createContent);
router.put("/contents/:id", updateContent);
router.delete("/contents/:id", deleteContent);

// Subcontents
router.get("/subcontents/:contentId", getSubcontentsByContent);
router.post("/subcontents", createSubcontent);
router.put("/subcontents/:id", updateSubcontent);
router.delete("/subcontents/:id", deleteSubcontent);

// Channels
router.get("/channels", getChannels);
router.post("/channels", createChannel);
router.put("/channels/:id", updateChannel);
router.delete("/channels/:id", deleteChannel);

// User management
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);

// Channel assignments
router.get("/grade-channels/:gradeId", getGradeChannels);
router.post("/assign/grade-channel", assignChannelToGrade);
router.delete("/assign/grade-channel", removeChannelFromGrade);
router.get("/subject-channels/:subjectId", getSubjectChannels);
router.post("/assign/subject-channel", assignChannelToSubject);
router.delete("/assign/subject-channel", removeChannelFromSubject);
router.post("/assign/channel-to-position", assignChannelToPosition);
router.get("/channels/:channelId/assignments", getChannelAssignments);
router.delete("/channel-assignments/:id", removeChannelAssignment);
router.get("/grades/:gradeId/channels", getChannelsByGrade);
router.post("/channel-assignments/bulk", async (req, res) => {
  const { channelIds, grade_id, subject_id } = req.body;

  if (!Array.isArray(channelIds) || channelIds.length === 0) {
    return res.status(400).json({ error: "No channels selected" });
  }

  if (!grade_id) {
    return res.status(400).json({ error: "grade_id is required" });
  }

  if (!subject_id) {
    return res.status(400).json({ error: "subject_id is required for channel assignment" });
  }

  try {
    const { prisma } = await import("../config/db.js");

    const assignments = await prisma.channel_assignments.createMany({
      data: channelIds.map((channelId) => ({
        channel_id: channelId,
        grade_id,
        subject_id,
        content_id: null,
        subcontent_id: null,
      })),
      skipDuplicates: true,
    });

    const skipped = channelIds.length - assignments.count;

    res.status(201).json({
      inserted: assignments.count,
      skipped,
      message: `Successfully assigned ${assignments.count} channel(s)${skipped > 0 ? `, ${skipped} already assigned` : ""}`,
    });
  } catch (error) {
    console.error("Error bulk assigning channels:", error);
    res.status(500).json({ error: "Failed to assign channels" });
  }
});

// Quizzes
router.get("/quizzes", getQuizzes);
router.post("/quizzes", createQuiz);
router.put("/quizzes/:id", updateQuiz);
router.delete("/quizzes/:id", deleteQuiz);
router.post("/quizzes/import", importQuizJSON);

// Questions
router.get("/questions/quiz/:quizId", getQuestionsByQuiz);
router.post("/questions", createQuestion);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);

// Quiz Assignments
router.get("/quiz-assignments", getQuizAssignments);
router.post("/quiz-assignments/assign", assignQuiz);
router.delete("/quiz-assignments/:id", removeQuizAssignment);

// New bulk assignment endpoints
router.get("/quiz-assignments/filter", getQuizAssignmentsByFilters);
router.post("/quiz-assignments/bulk", bulkAssignQuizzes);
router.get("/quiz-assignments/:id", getQuizAssignmentById);
router.delete("/quiz-assignments/bulk/:id", deleteQuizAssignment);

// Videos
router.get("/subcontents/:subcontentId/videos", getVideosBySubcontentAdmin);
router.get("/channels/:channelId/videos", getVideosByChannelAdmin);
router.post("/videos/bulk", addVideosBulk);
router.delete("/videos/bulk", deleteVideosByPosition);
router.delete("/videos/bulk-ids", deleteVideosByIds);

// Reported Videos
router.get("/reported-videos", getAllReportedVideos);
router.post("/reported-videos/:videoId/resolve", resolveReportedVideo);
router.delete("/reported-videos/:videoId", deleteReportedVideo);

export default router;
