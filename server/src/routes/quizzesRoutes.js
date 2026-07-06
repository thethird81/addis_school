import express from "express";
import {
  getQuizzes,
  getQuizById,
  getQuizzesBySubcontent,
  createQuiz,
  updateQuiz,
  deleteQuiz
} from "../controllers/quizzesController.js";

const router = express.Router();

router.get("/", getQuizzes);
router.get("/subcontent/:subcontentId", getQuizzesBySubcontent);
router.get("/:id", getQuizById);
router.post("/", createQuiz);
router.put("/:id", updateQuiz);
router.delete("/:id", deleteQuiz);

export default router;
