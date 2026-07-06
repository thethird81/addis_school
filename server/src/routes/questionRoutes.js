import express from "express";
import {
  getSelctedQuestions,
  getQuestionsBySubcontent,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";

const router = express.Router();

router.get("/subcontent/:subcontentId", getQuestionsBySubcontent);
router.get("/:id", getQuestionById);
router.post("/selected", getSelctedQuestions);
router.post("/", createQuestion);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

export default router;