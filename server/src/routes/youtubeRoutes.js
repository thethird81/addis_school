import express from "express";
import { searchChannels, searchCurriculum, saveVideosToDatabase } from "../controllers/youtubeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All YouTube fetch routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// Fetch videos by channel
// Body: { isAdvert?: boolean }
router.post("/channel/:channelId", async (req, res) => {
  try {
    const { channelId } = req.params;
    const { isAdvert } = req.body;

    const type = isAdvert ? "advert" : "curricular";

    const videos = await searchChannels({ channelId, type });
    
    res.status(200).json(videos);
  } catch (error) {
    console.error("Error in /channel/:channelId:", error);
    res.status(500).json({ error: error.message || "Failed to fetch channel videos" });
  }
});

// Fetch videos by search term (curriculum search)
// Body: { searchTerm: string }
router.post("/search", async (req, res) => {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm || !searchTerm.trim()) {
      return res.status(400).json({ error: "Missing required field: searchTerm" });
    }

    const videos = await searchCurriculum({ query: searchTerm });
    
    res.status(200).json(videos);
  } catch (error) {
    console.error("Error in /search:", error);
    res.status(500).json({ error: error.message || "Failed to search videos" });
  }
});

// Save videos to database with curriculum assignment
// Body: { videos: Array, grade_id: string, subject_id?: string, content_id?: string, subcontent_id?: string, type?: string }
router.post("/save", async (req, res) => {
  try {
    const { videos, grade_id, subject_id, content_id, subcontent_id } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: "Missing required field: videos array" });
    }

    if (!grade_id) {
      return res.status(400).json({ error: "Missing required field: grade_id" });
    }

    const result = await saveVideosToDatabase(videos, {
      grade_id,
      subject_id,
      content_id,
      subcontent_id,
    });

    res.status(201).json({
      message: "Videos saved successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error in /save:", error);
    res.status(500).json({ error: error.message || "Failed to save videos" });
  }
});

export default router;
