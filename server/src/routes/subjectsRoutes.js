import express from "express";
import {
  getSubjects,
  getSubjectsByGrade,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} from "../controllers/subjectsController.js";

const router = express.Router();

router.get("/", getSubjects);
router.get("/grade/:gradeId", getSubjectsByGrade);
router.get("/:id", getSubjectById);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
