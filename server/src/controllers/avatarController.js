import { supabase } from "../../supabase/supabase-config.js";

const uploadAvatar = async (req, res) => {
  try {
    const { blob, fileName, filePath } = req.body;

    if (!blob || !fileName || !filePath) {
      return res.status(400).json({ error: "Missing required fields: blob, fileName, filePath" });
    }

    // Convert base64 blob to buffer
    const buffer = Buffer.from(blob, 'base64');

    const { data, error } = await supabase.storage
      .from('avatar')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: "Failed to upload avatar" });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatar')
      .getPublicUrl(filePath);

    res.status(200).json({ publicUrl });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "Missing filePath" });
    }

    const { error } = await supabase.storage
      .from('avatar')
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      return res.status(500).json({ error: "Failed to delete avatar" });
    }

    res.status(200).json({ message: "Avatar deleted successfully" });
  } catch (err) {
    console.error("Avatar delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { uploadAvatar, deleteAvatar };