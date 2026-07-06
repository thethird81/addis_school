import express from "express";
import {
  getFavoritesByProfile,
  addFavorite,
  removeFavorite
} from "../controllers/favoritesQuizController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:profileId", authMiddleware, getFavoritesByProfile);
router.post("/add", authMiddleware, addFavorite);
router.delete("/:profileId/:quizId", authMiddleware, removeFavorite);

export default router;