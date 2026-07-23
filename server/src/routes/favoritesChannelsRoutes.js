import express from "express";
import {
  getFavoriteChannelsByProfile,
  addFavoriteChannel,
  removeFavoriteChannel
} from "../controllers/favoritesChannelsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:profileId", authMiddleware, getFavoriteChannelsByProfile);
router.post("/add", authMiddleware, addFavoriteChannel);
router.delete("/:profileId/:channelId", authMiddleware, removeFavoriteChannel);

export default router;