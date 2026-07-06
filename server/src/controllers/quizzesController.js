import { prisma } from "../config/db.js";

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await prisma.quizzes.findMany({ orderBy: { created_at: "desc" } });
    res.status(200).json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};

const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quizzes.findUnique({ where: { id } });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.status(200).json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
};

const getQuizzesBySubcontent = async (req, res) => {
  try {
    const { subcontentId } = req.params;
    const quizzes = await prisma.quizzes.findMany({ where: { subcontent_id: subcontentId } });
    res.status(200).json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes by subcontent:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { title, description, quiz_type, subcontent_id, is_active } = req.body;
    if (!title || !quiz_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const created = await prisma.quizzes.create({
      data: { title, description, quiz_type, subcontent_id, is_active }
    });
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ error: "Failed to create quiz" });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, quiz_type, subcontent_id, is_active } = req.body;
    const updated = await prisma.quizzes.update({
      where: { id },
      data: { title, description, quiz_type, subcontent_id, is_active }
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ error: "Failed to update quiz" });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quizzes.delete({ where: { id } });
    res.status(200).json({ message: "Quiz deleted" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
};

export { getQuizzes, getQuizById, getQuizzesBySubcontent, createQuiz, updateQuiz, deleteQuiz };