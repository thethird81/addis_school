import { prisma } from "../config/db.js";

const getContents = async (req, res) => {
  try {
    const contents = await prisma.contents.findMany({ orderBy: { name: "asc" } });
    res.status(200).json(contents);
  } catch (error) {
    console.error("Error fetching contents:", error);
    res.status(500).json({ error: "Failed to fetch contents" });
  }
};

const getContentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const contents = await prisma.contents.findMany({ where: { subject_id: subjectId } });
    res.status(200).json(contents);
  } catch (error) {
    console.error("Error fetching contents by subject:", error);
    res.status(500).json({ error: "Failed to fetch contents" });
  }
};

const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await prisma.contents.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }
    res.status(200).json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
};

const createContent = async (req, res) => {
  try {
    const { subject_id, name } = req.body;
    if (!subject_id || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const created = await prisma.contents.create({ data: { subject_id, name } });
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating content:", error);
    res.status(500).json({ error: "Failed to create content" });
  }
};

const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject_id } = req.body;
    const updated = await prisma.contents.update({
      where: { id },
      data: { name, subject_id }
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating content:", error);
    res.status(500).json({ error: "Failed to update content" });
  }
};

const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contents.delete({ where: { id } });
    res.status(200).json({ message: "Content deleted" });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({ error: "Failed to delete content" });
  }
};

export { getContents, getContentsBySubject, getContentById, createContent, updateContent, deleteContent };