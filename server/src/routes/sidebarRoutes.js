import express from "express";
import { getSidebarContentByGrade, getGradeList, getSidebarQuizzesByGrade } from "../controllers/sidebarController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/grades", getGradeList);
router.get("/contents/:id",  getSidebarContentByGrade);
router.get("/quizzes/:id", getSidebarQuizzesByGrade);



export default router;