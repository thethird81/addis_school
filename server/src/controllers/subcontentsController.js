import { prisma } from "../config/db.js";

const getSubcontents = async (req, res) => {
  try {
    const subcontents = await prisma.subcontents.findMany({ orderBy: { name: "asc" } });
    res.status(200).json(subcontents);
  } catch (error) {
    console.error("Error fetching subcontents:", error);
    res.status(500).json({ error: "Failed to fetch subcontents" });
  }
};

const getSubcontentsByContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const subcontents = await prisma.subcontents.findMany({ where: { content_id: contentId } });
    res.status(200).json(subcontents);
  } catch (error) {
    console.error("Error fetching subcontents by content:", error);
    res.status(500).json({ error: "Failed to fetch subcontents" });
  }
};

const getSubcontentById = async (req, res) => {
  try {
    const { id } = req.params;
    const subcontent = await prisma.subcontents.findUnique({ where: { id } });
    if (!subcontent) {
      return res.status(404).json({ error: "Subcontent not found" });
    }
    res.status(200).json(subcontent);
  } catch (error) {
    console.error("Error fetching subcontent:", error);
    res.status(500).json({ error: "Failed to fetch subcontent" });
  }
};

const createSubcontent = async (req, res) => {
  try {
    const { content_id, name } = req.body;
    if (!content_id || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const created = await prisma.subcontents.create({ data: { content_id, name } });
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating subcontent:", error);
    res.status(500).json({ error: "Failed to create subcontent" });
  }
};

const updateSubcontent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content_id } = req.body;
    const updated = await prisma.subcontents.update({
      where: { id },
      data: { name, content_id }
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating subcontent:", error);
    res.status(500).json({ error: "Failed to update subcontent" });
  }
};

const deleteSubcontent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subcontents.delete({ where: { id } });
    res.status(200).json({ message: "Subcontent deleted" });
  } catch (error) {
    console.error("Error deleting subcontent:", error);
    res.status(500).json({ error: "Failed to delete subcontent" });
  }
};

export { getSubcontents, getSubcontentsByContent, getSubcontentById, createSubcontent, updateSubcontent, deleteSubcontent };