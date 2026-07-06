import express from "express";
import {
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile
} from "../controllers/profilesController.js";

const router = express.Router();

router.get("/user/:userId", getProfiles);
router.get("/:id", getProfileById);
router.post("/create", createProfile);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

export default router;