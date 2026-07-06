import express from "express";
import { getReportedVideosByProfile, getAllReports, reportVideo, unreportVideo } from "../controllers/reportsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/profile/:profileId", getReportedVideosByProfile);
router.get("/", getAllReports);
router.post("/", reportVideo);
router.delete("/", unreportVideo);

export default router;
