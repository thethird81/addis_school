import express from "express";
import { signUp, signIn, signOut, refresh, getMe, deleteAccount } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/refresh", refresh);
router.post("/signout", signOut);
router.get("/me", authMiddleware, getMe);
router.delete("/account/:id", authMiddleware, deleteAccount);

export default router;