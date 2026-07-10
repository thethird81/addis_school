import express from "express";
import {
  getQuizAssignmentsByFilters,
  bulkAssignQuizzes,
  getQuizAssignmentById,
  deleteQuizAssignment,
} from "../controllers/quizAssignmentController.js";

const router = express.Router();

router.get("/", getQuizAssignmentsByFilters);
router.post("/bulk", bulkAssignQuizzes);
router.get("/:id", getQuizAssignmentById);
router.delete("/:id", deleteQuizAssignment);

export default router;