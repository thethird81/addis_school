import express from "express";
import {
  getSubcontents,
  getSubcontentsByContent,
  getSubcontentById,
  createSubcontent,
  updateSubcontent,
  deleteSubcontent
} from "../controllers/subcontentsController.js";

const router = express.Router();

router.get("/", getSubcontents);
router.get("/content/:contentId", getSubcontentsByContent);
router.get("/:id", getSubcontentById);
router.post("/", createSubcontent);
router.put("/:id", updateSubcontent);
router.delete("/:id", deleteSubcontent);

export default router;
