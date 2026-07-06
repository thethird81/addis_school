import express from "express";
import {
  getVideosBySubcontent,
  getRandomVideos,
  getVideosByGrade,
  getVideosByChannel,
  saveVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  removeFromWatchHistory,
  getAdvertVideos,
} from "../controllers/videosController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/random", getRandomVideos);
router.get("/subcontents/:subcontentId", getVideosBySubcontent);
router.get("/grade/:gradeId", getVideosByGrade);
router.get("/channel/:channelId", getVideosByChannel);
router.get("/adverts/:gradeId", getAdvertVideos);
router.get("/:id", getVideoById);
router.post("/save", saveVideos);
router.post("/", createVideo);
router.put("/:id", updateVideo);
router.delete("/:id", deleteVideo);
router.delete("/watch-history", removeFromWatchHistory);

export default router;
