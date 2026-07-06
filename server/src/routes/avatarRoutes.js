import express from "express";
import { uploadAvatar, deleteAvatar } from "../controllers/avatarController.js";

const router = express.Router();

router.post("/upload", uploadAvatar);
router.post("/delete", deleteAvatar);

export default router;