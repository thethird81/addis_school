import express from "express";
import { getChannelsByGrade, getSubjectChannelsByGrade, getAdvertChannelsByGrade } from "../controllers/channelsController.js";

const router = express.Router();
router.get("/grade/:gradeId", getChannelsByGrade);
router.get("/grade/:gradeId/subject-channels", getSubjectChannelsByGrade);
router.get("/grade/:gradeId/advert-channels", getAdvertChannelsByGrade);

export default router;
