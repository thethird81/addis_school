import { prisma } from "../config/db.js";

export async function adminMiddleware(req, res, next) {
  try {
    // req.userId is set by authMiddleware from the decoded JWT
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - No user ID" });
    }

    // Fetch user metadata from the database to check role
    const user = await prisma.users_metadata.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}