import { prisma } from "../config/db.js";

const getFavoritesByProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      return res.status(400).json({ error: "profileId is required" });
    }

    const favorites = await prisma.favorite_quizzes.findMany({
      where: { profile_id: profileId },
      include: {
        quizzes: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { favorited_at: "desc" }
    });

    const result = favorites.map((fav) => ({
      quizId: fav.quiz_id,
      quizTitle: fav.quizzes.title,
      favoritedAt: fav.favorited_at
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching favorite quizzes:", error);
    res.status(500).json({ error: "Failed to fetch favorite quizzes" });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { profileId, quizId } = req.body;

    if (!profileId || !quizId) {
      return res.status(400).json({ error: "profileId and quizId are required" });
    }

    const existing = await prisma.favorite_quizzes.findUnique({
      where: {
        profile_id_quiz_id: {
          profile_id: profileId,
          quiz_id: quizId
        }
      }
    });

    if (existing) {
      return res.status(200).json({ message: "Quiz already favorited" });
    }

    await prisma.favorite_quizzes.create({
      data: {
        profile_id: profileId,
        quiz_id: quizId
      }
    });

    res.status(201).json({ message: "Quiz added to favorites" });
  } catch (error) {
    console.error("Error adding favorite quiz:", error);
    res.status(500).json({ error: "Failed to add favorite quiz" });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { profileId, quizId } = req.params;

    if (!profileId || !quizId) {
      return res.status(400).json({ error: "profileId and quizId are required" });
    }

    await prisma.favorite_quizzes.delete({
      where: {
        profile_id_quiz_id: {
          profile_id: profileId,
          quiz_id: quizId
        }
      }
    });

    res.status(200).json({ message: "Quiz removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite quiz:", error);
    res.status(500).json({ error: "Failed to remove favorite quiz" });
  }
};

export { getFavoritesByProfile, addFavorite, removeFavorite };