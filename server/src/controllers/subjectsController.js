import { prisma } from "../config/db.js";

const getSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subjects.findMany({ orderBy: { name: "asc" } });
    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

const getSubjectsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const subjects = await prisma.subjects.findMany({ where: { grade_id: gradeId } });

    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects by grade:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await prisma.subjects.findUnique({ where: { id } });
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.status(200).json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    res.status(500).json({ error: "Failed to fetch subject" });
  }
};

const createSubject = async (req, res) => {
  try {
    const { grade_id, name } = req.body;
    if (!grade_id || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const created = await prisma.subjects.create({ data: { grade_id, name } });
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Failed to create subject" });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade_id } = req.body;
    const updated = await prisma.subjects.update({
      where: { id },
      data: { name, grade_id }
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ error: "Failed to update subject" });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subjects.delete({ where: { id } });
    res.status(200).json({ message: "Subject deleted" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Failed to delete subject" });
  }
};

export { getSubjects, getSubjectsByGrade, getSubjectById, createSubject, updateSubject, deleteSubject };