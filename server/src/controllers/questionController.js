import { prisma } from "../config/db.js";

const getSelctedQuestions = async (req, res) => {
  try {
    const { quizIds } = req.body;

    if (!Array.isArray(quizIds) || !quizIds.length) {
      return res.status(400).json({ error: "quizIds must be a non-empty array" });
    }

    const questions = await prisma.questions.findMany({
      where: {
        quiz_id: {
          in: quizIds,
        },
      },
    });

    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

const getQuestionsBySubcontent = async (req, res) => {
  try {
    const { subcontentId } = req.params;

    const questions = await prisma.questions.findMany({
      where: { subcontent_id: subcontentId },
    });

    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions by subcontent:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await prisma.questions.findUnique({ where: { id } });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ error: "Failed to fetch question" });
  }
};

const createQuestion = async (req, res) => {
  try {
    const { question_text, options, correct_answer, quiz_id, question_image } = req.body;

    if (!question_text || !options || correct_answer == null || !quiz_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const question = await prisma.questions.create({
      data: {
        question_text,
        options,
        correct_answer,
        quiz_id,
        question_image,
      },
    });

    res.status(201).json(question);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, options, correct_answer, quiz_id, question_image } = req.body;

    const question = await prisma.questions.update({
      where: { id },
      data: {
        question_text,
        options,
        correct_answer,
        quiz_id,
        question_image,
      },
    });

    res.status(200).json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.questions.delete({ where: { id } });
    res.status(200).json({ message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
};

export { getSelctedQuestions, getQuestionsBySubcontent, getQuestionById, createQuestion, updateQuestion, deleteQuestion };