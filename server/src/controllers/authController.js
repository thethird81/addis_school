import { prisma } from "../config/db.js";
import { supabase } from "../../supabase/supabase-config.js";
import { generateTokens } from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

const signUp = async (req, res) => {
  try {
    const { email, password, children, role } = req.body;

    if (!email || !password || !children || !Array.isArray(children) || children.length === 0) {
      return res.status(400).json({ error: "Missing required fields: email, password, and at least one child profile" });
    }

    const validRoles = ["admin", "parent"];
    const userRole = validRoles.includes(role) ? role : "parent";
    console.log("Signup - Role from request:", role, "- Assigned role:", userRole);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error(authError);
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;
    const userData = {
      id: userId,
      role: userRole,
      number_of_profiles: children.length,
    };

    const profiles = children.map((child) => ({
      user_id: userId,
      grade_id: child.gradeId,
      avatar_url: child.avatarUrl || "",
      profile_name: child.name,
    }));

    let user;
    try {
      await prisma.$transaction([
        prisma.users_metadata.upsert({
          where: { id: userId },
          update: { role: userRole, number_of_profiles: userData.number_of_profiles },
          create: userData,
        }),
        prisma.profiles.createMany({ data: profiles, skipDuplicates: true }),
      ]);

      user = await prisma.users_metadata.findUnique({ where: { id: userId } });
      console.log("User retrieved from DB:", { id: user.id, role: user.role });
    } catch (dbError) {
      console.error("Database creation failed:", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      });
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("Failed to delete Supabase auth user during rollback:", deleteError);
      }
      return res.status(500).json({ error: dbError.message || "Failed to create user metadata and profiles" });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: "/",
    });

    res.status(201).json({ accessToken, user, profiles });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const userId = data.user.id;
    const user = await prisma.users_metadata.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const profiles = await prisma.profiles.findMany({ where: { user_id: userId } });
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: "/",
    });

    res.status(200).json({ accessToken, user, profiles });
  } catch (err) {
    console.error("Sign in error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const signOut = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({ message: "Signed out successfully" });
  } catch (err) {
    console.error("Sign out error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(403);

      const newAccessToken = jwt.sign(
        { sub: decoded.sub },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
      );

      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.users_metadata.findUnique({ where: { id: req.userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    // Only admins can delete other users
    const requesterRole = req.user?.role;
    if (requesterRole !== "admin") {
      return res.status(403).json({ error: "Forbidden - admin only" });
    }

    const targetUserId = req.params.id;
    if (!targetUserId) {
      return res.status(400).json({ error: "Missing target user id" });
    }

    // collect profile ids for the target user
    const profileRows = await prisma.profiles.findMany({ where: { user_id: targetUserId }, select: { id: true } });
    const profileIds = profileRows.map((p) => p.id);

    try {
      await prisma.$transaction([
        prisma.watch_histories.deleteMany({ where: { profile_id: { in: profileIds } } }),
        prisma.reports.deleteMany({ where: { profile_id: { in: profileIds } } }),
        prisma.likes.deleteMany({ where: { profile_id: { in: profileIds } } }),
        prisma.favorite_quizzes.deleteMany({ where: { profile_id: { in: profileIds } } }),
        prisma.profiles.deleteMany({ where: { user_id: targetUserId } }),
        prisma.users_metadata.delete({ where: { id: targetUserId } }),
      ]);
    } catch (dbError) {
      console.error("Database deletion failed:", dbError);
      return res.status(500).json({ error: "Failed to delete user data" });
    }

    // Delete from Supabase auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (authDeleteError) {
      console.error("Failed to delete Supabase auth user:", authDeleteError);
      return res.status(500).json({ error: "Failed to delete auth user" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { signUp, signIn, signOut, refresh, getMe, deleteAccount };
