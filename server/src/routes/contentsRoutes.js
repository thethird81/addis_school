import express from "express";
import {
  getContents,
  getContentsBySubject,
  getContentById,
  createContent,
  updateContent,
  deleteContent
} from "../controllers/contentsController.js";

const router = express.Router();

router.get("/", getContents);
router.get("/subject/:subjectId", getContentsBySubject);
router.get("/:id", getContentById);
router.post("/", createContent);
router.put("/:id", updateContent);
router.delete("/:id", deleteContent);

export default router;
