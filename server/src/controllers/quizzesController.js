import { prisma } from "../config/db.js";

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await prisma.quizzes.findMany({
      orderBy: { created_at: "desc" },
      include: { _count: { select: { questions: true } } },
    });
    res.status(200).json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Missing required field: title" });
    }
    const created = await prisma.quizzes.create({
      data: { title }
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
    const { title } = req.body;
    const updated = await prisma.quizzes.update({
      where: { id },
      data: { ...(title !== undefined && { title }) }
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

export { getQuizzes, createQuiz, updateQuiz, deleteQuiz };

