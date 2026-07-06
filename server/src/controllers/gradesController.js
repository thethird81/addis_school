import { prisma } from "../config/db.js";

const getGrades = async (req, res) => {
  try {
    const grades = await prisma.grades.findMany({ orderBy: { name: "asc" } });
    res.status(200).json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
};

const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const grade = await prisma.grades.findUnique({ where: { id } });

    if (!grade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    res.status(200).json(grade);
  } catch (error) {
    console.error("Error fetching grade:", error);
    res.status(500).json({ error: "Failed to fetch grade" });
  }
};

const createGrade = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing grade name" });
    }

    const created = await prisma.grades.create({ data: { name } });
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating grade:", error);
    res.status(500).json({ error: "Failed to create grade" });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await prisma.grades.update({
      where: { id },
      data: { name }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ error: "Failed to update grade" });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.grades.delete({ where: { id } });
    res.status(200).json({ message: "Grade deleted" });
  } catch (error) {
    console.error("Error deleting grade:", error);
    res.status(500).json({ error: "Failed to delete grade" });
  }
};

export { getGrades, getGradeById, createGrade, updateGrade, deleteGrade };