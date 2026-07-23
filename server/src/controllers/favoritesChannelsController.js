import { prisma } from "../config/db.js";

const getFavoriteChannelsByProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      return res.status(400).json({ error: "profileId is required" });
    }

    const favorites = await prisma.favorite_channels.findMany({
      where: { profile_id: profileId },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            thumbnail_url: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = favorites.map((fav) => ({
      channelId: fav.channel_id,
      channelName: fav.channels.name,
      thumbnailUrl: fav.channels.thumbnail_url,
      favoritedAt: fav.created_at,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching favorite channels:", error);
    res.status(500).json({ error: "Failed to fetch favorite channels" });
  }
};

const addFavoriteChannel = async (req, res) => {
  try {
    const { profileId, channelId } = req.body;

    if (!profileId || !channelId) {
      return res.status(400).json({ error: "profileId and channelId are required" });
    }

    const existing = await prisma.favorite_channels.findUnique({
      where: {
        profile_id_channel_id: {
          profile_id: profileId,
          channel_id: channelId,
        },
      },
    });

    if (existing) {
      return res.status(200).json({ message: "Channel already favorited" });
    }

    await prisma.favorite_channels.create({
      data: {
        profile_id: profileId,
        channel_id: channelId,
      },
    });

    res.status(201).json({ message: "Channel added to favorites" });
  } catch (error) {
    console.error("Error adding favorite channel:", error);
    res.status(500).json({ error: "Failed to add favorite channel" });
  }
};

const removeFavoriteChannel = async (req, res) => {
  try {
    const { profileId, channelId } = req.params;

    if (!profileId || !channelId) {
      return res.status(400).json({ error: "profileId and channelId are required" });
    }

    await prisma.favorite_channels.delete({
      where: {
        profile_id_channel_id: {
          profile_id: profileId,
          channel_id: channelId,
        },
      },
    });

    res.status(200).json({ message: "Channel removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite channel:", error);
    res.status(500).json({ error: "Failed to remove favorite channel" });
  }
};

export { getFavoriteChannelsByProfile, addFavoriteChannel, removeFavoriteChannel };