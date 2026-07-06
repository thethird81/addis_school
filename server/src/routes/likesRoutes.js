import express from "express";
import { getLikedVideosByProfile, likeVideo, unlikeVideo } from "../controllers/likesController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/profile/:profileId", getLikedVideosByProfile);
router.post("/", likeVideo);
router.delete("/", unlikeVideo);

export default router;
