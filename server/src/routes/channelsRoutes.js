import express from "express";
import { getChannelsByGrade, getSubjectChannelsByGrade } from "../controllers/channelsController.js";

const router = express.Router();
router.get("/grade/:gradeId", getChannelsByGrade);
router.get("/grade/:gradeId/subject-channels", getSubjectChannelsByGrade);

export default router;