import { prisma } from "../config/db.js";

const getProfiles = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const profiles = await prisma.profiles.findMany({
      where: { user_id: userId }
    });

    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
};

const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profiles.findUnique({ where: { id } });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const createProfile = async (req, res) => {
  try {
    const { user_id, profile_name, grade_id, avatar_url, coins } = req.body;
    if (!user_id || !profile_name || !grade_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const profile = await prisma.profiles.create({
      data: {
        user_id,
        profile_name,
        grade_id,
        avatar_url: avatar_url || "",
        coins: coins ?? 30
      }
    });
    res.status(201).json(profile);
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ error: "Failed to create profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_name, grade_id, avatar_url, coins } = req.body;
    const profile = await prisma.profiles.update({
      where: { id },
      data: {
        profile_name,
        grade_id,
        avatar_url,
        coins
      }
    });
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.profiles.delete({ where: { id } });
    res.status(200).json({ message: "Profile deleted" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Failed to delete profile" });
  }
};

export { getProfiles, getProfileById, createProfile, updateProfile, deleteProfile };