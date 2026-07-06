import express from "express";
import { getSubcontentsByGrade } from "../controllers/searchController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/subcontents/:gradeId", authMiddleware, getSubcontentsByGrade);

export default router;