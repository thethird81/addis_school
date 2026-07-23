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
  getAdvertVideosFromFavoriteChannels,
  getAdvertVideosByChannel,
  searchYouTubeVideos,
  getCurriculumTree,
  bulkDeleteVideoAssignments,
  deleteVideoAssignment,
  getWorkspaceVideosBySubcontent,
} from "../controllers/videosController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/random", getRandomVideos);
router.get("/subcontents/:subcontentId", getVideosBySubcontent);
router.get("/workspace/subcontents/:subcontentId", getWorkspaceVideosBySubcontent);
router.get("/grade/:gradeId", getVideosByGrade);
router.get("/channel/:channelId", getVideosByChannel);
router.get("/adverts/:gradeId", getAdvertVideos);
router.get("/adverts/favorite-channels/:profileId", getAdvertVideosFromFavoriteChannels);
router.get("/adverts/channel/:channelId", getAdvertVideosByChannel);
router.get("/curriculum/tree", getCurriculumTree);
router.get("/:id", getVideoById);
router.post("/save", saveVideos);
router.post("/search-youtube", searchYouTubeVideos);
router.post("/", createVideo);
router.put("/:id", updateVideo);
router.delete("/bulk", bulkDeleteVideoAssignments);
router.delete("/:id", deleteVideo);
router.delete("/assignments/:assignmentId", deleteVideoAssignment);
router.delete("/watch-history", removeFromWatchHistory);

export default router;
