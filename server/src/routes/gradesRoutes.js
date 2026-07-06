import express from "express";
import {
  getGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade
} from "../controllers/gradesController.js";

const router = express.Router();

router.get("/", getGrades);
router.get("/:id", getGradeById);
router.post("/", createGrade);
router.put("/:id", updateGrade);
router.delete("/:id", deleteGrade);

export default router;
