import { prisma } from "../config/db.js";
import { fetchChannelThumbnail } from "./youtubeController.js";
import { formatViewCount } from "./videosController.js";

// ==================== GRADES ====================

const getGrades = async (req, res) => {
  try {
    const grades = await prisma.grades.findMany({
      orderBy: { sort_order: "asc" },
    });
    res.status(200).json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
};

const createGrade = async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    if (!name || sort_order === undefined) {
      return res.status(400).json({ error: "Missing required fields: name, sort_order" });
    }
    const grade = await prisma.grades.create({
      data: { name, sort_order: parseInt(sort_order) },
    });
    res.status(201).json(grade);
  } catch (error) {
    console.error("Error creating grade:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Grade name or sort_order already exists" });
    }
    res.status(500).json({ error: "Failed to create grade" });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;
    const grade = await prisma.grades.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sort_order !== undefined && { sort_order: parseInt(sort_order) }),
      },
    });
    res.status(200).json(grade);
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

// ==================== SUBJECTS ====================

const getSubjectsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const subjects = await prisma.subjects.findMany({
      where: { grade_id: gradeId },
      orderBy: { name: "asc" },
    });
    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

const createSubject = async (req, res) => {
  try {
    const { grade_id, name } = req.body;
    if (!grade_id || !name) {
      return res.status(400).json({ error: "Missing required fields: grade_id, name" });
    }
    const subject = await prisma.subjects.create({
      data: { grade_id, name },
    });
    res.status(201).json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Subject already exists for this grade" });
    }
    res.status(500).json({ error: "Failed to create subject" });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const subject = await prisma.subjects.update({
      where: { id },
      data: { name },
    });
    res.status(200).json(subject);
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

// ==================== CONTENTS ====================

const getContentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const contents = await prisma.contents.findMany({
      where: { subject_id: subjectId },
      orderBy: { name: "asc" },
    });
    res.status(200).json(contents);
  } catch (error) {
    console.error("Error fetching contents:", error);
    res.status(500).json({ error: "Failed to fetch contents" });
  }
};

const createContent = async (req, res) => {
  try {
    const { subject_id, name } = req.body;
    if (!subject_id || !name) {
      return res.status(400).json({ error: "Missing required fields: subject_id, name" });
    }
    const content = await prisma.contents.create({
      data: { subject_id, name },
    });
    res.status(201).json(content);
  } catch (error) {
    console.error("Error creating content:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Content already exists for this subject" });
    }
    res.status(500).json({ error: "Failed to create content" });
  }
};

const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const content = await prisma.contents.update({
      where: { id },
      data: { name },
    });
    res.status(200).json(content);
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

// ==================== SUBCONTENTS ====================

const getSubcontentsByContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const subcontents = await prisma.subcontents.findMany({
      where: { content_id: contentId },
      orderBy: { name: "asc" },
    });
    res.status(200).json(subcontents);
  } catch (error) {
    console.error("Error fetching subcontents:", error);
    res.status(500).json({ error: "Failed to fetch subcontents" });
  }
};

const createSubcontent = async (req, res) => {
  try {
    const { content_id, name } = req.body;
    if (!content_id || !name) {
      return res.status(400).json({ error: "Missing required fields: content_id, name" });
    }
    const subcontent = await prisma.subcontents.create({
      data: { content_id, name },
    });
    res.status(201).json(subcontent);
  } catch (error) {
    console.error("Error creating subcontent:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Subcontent already exists for this content" });
    }
    res.status(500).json({ error: "Failed to create subcontent" });
  }
};

const updateSubcontent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const subcontent = await prisma.subcontents.update({
      where: { id },
      data: { name },
    });
    res.status(200).json(subcontent);
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

// ==================== CHANNELS ====================

const getChannels = async (req, res) => {
  try {
    const channels = await prisma.channels.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
};

const createChannel = async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "Missing required fields: id, name" });
    }

    // Fetch thumbnail from YouTube API
    const thumbnail_url = await fetchChannelThumbnail(id);

    const channel = await prisma.channels.create({
      data: { id, name, thumbnail_url },
    });
    res.status(201).json(channel);
  } catch (error) {
    console.error("Error creating channel:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Channel ID already exists" });
    }
    res.status(500).json({ error: "Failed to create channel" });
  }
};

const updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Fetch thumbnail from YouTube API
    const thumbnail_url = await fetchChannelThumbnail(id);

    const channel = await prisma.channels.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(thumbnail_url !== undefined && { thumbnail_url }),
      },
    });
    res.status(200).json(channel);
  } catch (error) {
    console.error("Error updating channel:", error);
    res.status(500).json({ error: "Failed to update channel" });
  }
};

const deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.channels.delete({ where: { id } });
    res.status(200).json({ message: "Channel deleted" });
  } catch (error) {
    console.error("Error deleting channel:", error);
    res.status(500).json({ error: "Failed to delete channel" });
  }
};

// ==================== CHANNEL ASSIGNMENTS ====================

const assignChannelToGrade = async (req, res) => {
  try {
    const { grade_id, channel_id } = req.body;
    if (!grade_id || !channel_id) {
      return res.status(400).json({ error: "Missing required fields: grade_id, channel_id" });
    }
    const assignment = await prisma.channel_assignments.create({
      data: {
        channel_id,
        grade_id,
        subject_id: null,
        content_id: null,
        subcontent_id: null,
      },
      include: {
        channels: true,
        grades: true,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error assigning channel to grade:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Channel already assigned to this grade" });
    }
    res.status(500).json({ error: "Failed to assign channel" });
  }
};

const removeChannelFromGrade = async (req, res) => {
  try {
    const { grade_id, channel_id } = req.body;
    if (!grade_id || !channel_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Find and delete from channel_assignments table
    // Match any assignment with this grade_id and channel_id (regardless of subject/content/subcontent)
    const assignment = await prisma.channel_assignments.findFirst({
      where: {
        grade_id,
        channel_id,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Channel assignment not found" });
    }

    await prisma.channel_assignments.delete({
      where: { id: assignment.id },
    });
    
    res.status(200).json({ message: "Channel removed from grade" });
  } catch (error) {
    console.error("Error removing channel from grade:", error);
    res.status(500).json({ error: "Failed to remove channel" });
  }
};

const assignChannelToSubject = async (req, res) => {
  try {
    const { subject_id, channel_id } = req.body;
    if (!subject_id || !channel_id) {
      return res.status(400).json({ error: "Missing required fields: subject_id, channel_id" });
    }
    
    // Get the grade_id from the subject
    const subject = await prisma.subjects.findUnique({
      where: { id: subject_id },
      select: { grade_id: true },
    });
    
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    
    const assignment = await prisma.channel_assignments.create({
      data: {
        channel_id,
        grade_id: subject.grade_id,
        subject_id,
        content_id: null,
        subcontent_id: null,
      },
      include: {
        channels: true,
        subjects: true,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error assigning channel to subject:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Channel already assigned to this subject" });
    }
    res.status(500).json({ error: "Failed to assign channel" });
  }
};

const removeChannelFromSubject = async (req, res) => {
  try {
    const { subject_id, channel_id } = req.body;
    if (!subject_id || !channel_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Find the assignment
    const assignment = await prisma.channel_assignments.findFirst({
      where: {
        subject_id,
        channel_id,
        content_id: null,
        subcontent_id: null,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Channel assignment not found" });
    }
    
    await prisma.channel_assignments.delete({
      where: { id: assignment.id },
    });
    
    res.status(200).json({ message: "Channel removed from subject" });
  } catch (error) {
    console.error("Error removing channel from subject:", error);
    res.status(500).json({ error: "Failed to remove channel" });
  }
};

// ==================== FULL TREE ====================

const getFullTree = async (req, res) => {
  try {
    const grades = await prisma.grades.findMany({
      orderBy: { sort_order: "asc" },
      include: {
        subjects: {
          orderBy: { name: "asc" },
          include: {
            contents: {
              orderBy: { name: "asc" },
              include: {
                subcontents: {
                  orderBy: { name: "asc" },
                },
              },
            },
            channel_assignments: {
              where: {
                subject_id: { not: null }
              },
              include: {
                channels: true,
              },
            },
          },
        },
        channel_assignments: {
          where: {
            subject_id: null,
            content_id: null,
            subcontent_id: null,
          },
          include: {
            channels: true,
          },
        },
      },
    });

    // Transform to clean nested structure
    const tree = grades.map((grade) => ({
      id: grade.id,
      name: grade.name,
      sort_order: grade.sort_order,
      channels: grade.channel_assignments.map((ca) => ({
        channelId: ca.channel_id,
        channelName: ca.channels.name,
      })),
      subjects: grade.subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        channels: subject.channel_assignments.map((ca) => ({
          channelId: ca.channel_id,
          channelName: ca.channels.name,
        })),
        contents: subject.contents.map((content) => ({
          id: content.id,
          name: content.name,
          subcontents: content.subcontents.map((sc) => ({
            id: sc.id,
            name: sc.name,
          })),
        })),
      })),
    }));

    // Get video counts for all subcontents
    const allSubcontentIds = [];
    tree.forEach(grade => {
      grade.subjects.forEach(subject => {
        subject.contents.forEach(content => {
          content.subcontents.forEach(sc => {
            allSubcontentIds.push(sc.id);
          });
        });
      });
    });

    const subcontentVideoCounts = {};
    if (allSubcontentIds.length > 0) {
      const videoCounts = await prisma.video_assignments.groupBy({
        by: ['subcontent_id'],
        where: {
          subcontent_id: { in: allSubcontentIds }
        },
        _count: {
          video_id: true
        }
      });
      videoCounts.forEach(item => {
        subcontentVideoCounts[item.subcontent_id] = item._count.video_id;
      });
    }

    // Get video counts for all channels
    const allChannelIds = [];
    tree.forEach(grade => {
      grade.channels.forEach(ch => allChannelIds.push(ch.channelId));
      grade.subjects.forEach(subject => {
        subject.channels.forEach(ch => allChannelIds.push(ch.channelId));
      });
    });

    const channelVideoCounts = {};
    if (allChannelIds.length > 0) {
      const channelCounts = await prisma.video_assignments.findMany({
        where: {
          videos: {
            channel_id: { in: allChannelIds }
          }
        },
        select: {
          videos: {
            select: { channel_id: true }
          }
        }
      });

      channelCounts.forEach(item => {
        const chId = item.videos.channel_id;
        channelVideoCounts[chId] = (channelVideoCounts[chId] || 0) + 1;
      });
    }

    // Add video counts to tree
    const treeWithCounts = tree.map((grade) => ({
      ...grade,
      channels: grade.channels.map((ch) => ({
        ...ch,
        videoCount: channelVideoCounts[ch.channelId] || 0
      })),
      subjects: grade.subjects.map((subject) => ({
        ...subject,
        channels: subject.channels.map((ch) => ({
          ...ch,
          videoCount: channelVideoCounts[ch.channelId] || 0
        })),
        contents: subject.contents.map((content) => ({
          ...content,
          subcontents: content.subcontents.map((sc) => ({
            ...sc,
            videoCount: subcontentVideoCounts[sc.id] || 0
          }))
        }))
      }))
    }));

    res.status(200).json(treeWithCounts);
  } catch (error) {
    console.error("Error fetching full tree:", error);
    res.status(500).json({ error: "Failed to fetch tree" });
  }
};

// ==================== GET GRADE CHANNELS & SUBJECT CHANNELS ====================

const getGradeChannels = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const assignments = await prisma.channel_assignments.findMany({
      where: { 
        grade_id: gradeId,
        subject_id: null,
        content_id: null,
        subcontent_id: null,
      },
      include: { channels: true },
    });
    res.status(200).json(assignments.map((a) => a.channels));
  } catch (error) {
    console.error("Error fetching grade channels:", error);
    res.status(500).json({ error: "Failed to fetch grade channels" });
  }
};

const getSubjectChannels = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const assignments = await prisma.channel_assignments.findMany({
      where: { 
        subject_id: subjectId,
        content_id: null,
        subcontent_id: null,
      },
      include: { channels: true },
    });
    res.status(200).json(assignments.map((a) => a.channels));
  } catch (error) {
    console.error("Error fetching subject channels:", error);
    res.status(500).json({ error: "Failed to fetch subject channels" });
  }
};

// ==================== CHANNEL ASSIGNMENTS ====================

const assignChannelToPosition = async (req, res) => {
  try {
    const { channel_id, grade_id, subject_id, content_id, subcontent_id } = req.body;
    
    if (!channel_id || !grade_id) {
      return res.status(400).json({ error: "Missing required fields: channel_id, grade_id" });
    }

    const assignment = await prisma.channel_assignments.create({
      data: {
        channel_id,
        grade_id,
        subject_id: subject_id || null,
        content_id: content_id || null,
        subcontent_id: subcontent_id || null,
      },
      include: {
        channels: true,
        grades: true,
        subjects: true,
        contents: true,
        subcontents: true,
      },
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error assigning channel to position:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Channel already assigned to this position" });
    }
    res.status(500).json({ error: "Failed to assign channel" });
  }
};

const getChannelAssignments = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const assignments = await prisma.channel_assignments.findMany({
      where: { channel_id: channelId },
      include: {
        grades: true,
        subjects: true,
        contents: true,
        subcontents: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching channel assignments:", error);
    res.status(500).json({ error: "Failed to fetch channel assignments" });
  }
};

const removeChannelAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.channel_assignments.delete({ where: { id } });
    res.status(200).json({ message: "Channel assignment removed" });
  } catch (error) {
    console.error("Error removing channel assignment:", error);
    res.status(500).json({ error: "Failed to remove channel assignment" });
  }
};

const getChannelsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    console.log("Fetching channels for grade:", gradeId);
    
    // Get all channel assignments for this grade (both grade-level and subject-level)
    const assignments = await prisma.channel_assignments.findMany({
      where: { 
        grade_id: gradeId,
      },
      include: {
        channels: true,
      },
    });

    console.log("Found assignments:", assignments.length);
    
    // Deduplicate channels (a channel might be assigned at both grade and subject level)
    const uniqueChannels = [];
    const channelIds = new Set();
    
    for (const assignment of assignments) {
      if (!channelIds.has(assignment.channel_id)) {
        channelIds.add(assignment.channel_id);
        uniqueChannels.push(assignment.channels);
      }
    }
    
    console.log("Unique channels:", uniqueChannels.length);
    
    res.status(200).json(uniqueChannels);
  } catch (error) {
    console.error("Error fetching channels by grade:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
};

// ==================== USER MANAGEMENT ====================

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.users_metadata.findMany({
      orderBy: { created_at: "desc" },
      include: {
        profiles: {
          include: {
            grades: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const transformed = users.map((user) => ({
      id: user.id,
      role: user.role,
      tier: user.tier,
      number_of_profiles: user.number_of_profiles,
      created_at: user.created_at,
      profiles: user.profiles.map((p) => ({
        id: p.id,
        profile_name: p.profile_name,
        grade_name: p.grades?.name || null,
        grade_id: p.grade_id,
        is_active: p.is_active,
        coins: p.coins,
      })),
    }));

    res.status(200).json(transformed);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "parent"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'parent'" });
    }

    const user = await prisma.users_metadata.update({
      where: { id },
      data: { role },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

// ==================== QUIZ QUESTION CONVERSION HELPERS ====================

// Converts questions from JSON import format to database format
// Format: { question_text, options: [{id:"a",text:"A",option_image:"..."}], correct_answer: 1 (index) or "b" (letter) }
// DB format: { question_text, options: [{id:"a",text:"A",option_image:"..."},...], correct_answer: "c" (letter ID) }
function convertImportQuestion(q) {
  if (!q.question_text || !Array.isArray(q.options) || !q.options.length || q.correct_answer === undefined || q.correct_answer === null) {
    throw new Error(`Question missing required fields: question_text, options, correct_answer`);
  }

  const optionLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  // Options are objects with id, text, and optional option_image
  var options = q.options.map(function(opt, index) {
    var cleanOpt = {
      id: opt.id || optionLetters[index] || String(index),
      text: String(opt.text)
    };
    // Include option_image only if non-empty
    if (opt.option_image && opt.option_image.trim()) {
      cleanOpt.option_image = opt.option_image.trim();
    }
    return cleanOpt;
  });

  // correct_answer can be a 0-based index (number) or already a letter ID (string)
  var correctAnswer;
  if (typeof q.correct_answer === 'number') {
    // Numeric index: find the id at that index
    correctAnswer = options[q.correct_answer]
      ? options[q.correct_answer].id
      : optionLetters[q.correct_answer] || String(q.correct_answer);
  } else {
    correctAnswer = String(q.correct_answer);
  }

  return {
    question_text: q.question_text,
    options: options,
    correct_answer: correctAnswer,
    difficulty: q.difficulty || "easy",
    question_image: q.question_image && q.question_image.trim() ? q.question_image.trim() : null
  };
}

// ==================== QUIZZES ====================

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await prisma.quizzes.findMany({
      orderBy: { created_at: "desc" },
      include: {
        _count: { select: { questions: true } },
      },
    });
    res.status(200).json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { title, is_general, grade_id, subject_id, content_id, subcontent_id, questions } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Missing required field: title" });
    }
    if (!is_general && !grade_id) {
      return res.status(400).json({ error: "Missing required field: grade_id" });
    }
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ error: "Missing required field: questions array must be provided" });
    }

    // Create quiz, questions, and optionally assignment in a single transaction with increased timeout
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the quiz
      const quiz = await tx.quizzes.create({
        data: { title, is_general: is_general || false },
      });

      // 2. Create all questions in batch (convert from JSON import format to DB format)
      const questionsData = questions.map((q) => {
        const converted = convertImportQuestion(q);
        return {
          quiz_id: quiz.id,
          question_text: converted.question_text,
          options: converted.options,
          correct_answer: converted.correct_answer,
          difficulty: converted.difficulty,
          question_image: converted.question_image,
        };
      });

      await tx.questions.createMany({
        data: questionsData,
      });

      // 3. Create quiz assignment to curriculum position (only for non-general quizzes)
      if (!is_general) {
        await tx.quiz_assignments.create({
          data: {
            quiz_id: quiz.id,
            grade_id,
            subject_id: subject_id || null,
            content_id: content_id || null,
            subcontent_id: subcontent_id || null,
          },
        });
      }

      return { quiz, questionCount: questionsData.length };
    }, {
      maxWait: 15000, // 15s max wait for the connection
      timeout: 30000  // 30s transaction timeout
    });

    res.status(201).json({
      message: "Quiz created successfully",
      quiz: result.quiz,
      questionCount: result.questionCount,
    });
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ error: error.message || "Failed to create quiz" });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, is_general } = req.body;
    const quiz = await prisma.quizzes.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(is_general !== undefined && { is_general }),
      },
    });
    res.status(200).json(quiz);
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

const importQuizJSON = async (req, res) => {
  try {
    const { title, grade_id, subject_id, content_id, subcontent_id, questions } = req.body;

    if (!title || !grade_id || !Array.isArray(questions) || !questions.length) {
      return res.status(400).json({
        error: "Missing required fields: title, grade_id, and questions array",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the quiz
      const quiz = await tx.quizzes.create({
        data: { title, is_general: false },
      });

      // 2. Create all questions in batch (convert from JSON import format to DB format)
      const questionsData = questions.map((q) => {
        const converted = convertImportQuestion(q);
        return {
          quiz_id: quiz.id,
          question_text: converted.question_text,
          options: converted.options,
          correct_answer: converted.correct_answer,
          difficulty: converted.difficulty,
          question_image: converted.question_image,
        };
      });

      await tx.questions.createMany({
        data: questionsData,
      });

      // 3. Create quiz assignment to curriculum position (any level)
      const assignment = await tx.quiz_assignments.create({
        data: {
          quiz_id: quiz.id,
          grade_id,
          subject_id: subject_id || null,
          content_id: content_id || null,
          subcontent_id: subcontent_id || null,
        },
      });

      return { quiz, questionCount: questionsData.length, assignment };
    }, {
      maxWait: 15000, // 15s max wait for the connection
      timeout: 30000  // 30s transaction timeout
    });

    res.status(201).json({
      message: "Quiz imported successfully",
      quiz: result.quiz,
      questionCount: result.questionCount,
    });
  } catch (error) {
    console.error("Error importing quiz:", error);
    res.status(500).json({ error: error.message || "Failed to import quiz" });
  }
};

// ==================== QUESTIONS ====================

const getQuestionsByQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const questions = await prisma.questions.findMany({
      where: { quiz_id: quizId },
      orderBy: { created_at: "asc" },
    });
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

const createQuestion = async (req, res) => {
  try {
    const { quiz_id, question_text, options, correct_answer, difficulty, question_image } = req.body;
    if (!quiz_id || !question_text || !options || correct_answer == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const question = await prisma.questions.create({
      data: {
        quiz_id,
        question_text,
        options,
        correct_answer,
        difficulty: difficulty || "easy",
        question_image: question_image || null,
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
    const { question_text, options, correct_answer, difficulty, question_image } = req.body;
    const question = await prisma.questions.update({
      where: { id },
      data: {
        ...(question_text !== undefined && { question_text }),
        ...(options !== undefined && { options }),
        ...(correct_answer !== undefined && { correct_answer }),
        ...(difficulty !== undefined && { difficulty }),
        ...(question_image !== undefined && { question_image }),
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

// ==================== QUIZ ASSIGNMENTS ====================

const getQuizAssignments = async (req, res) => {
  try {
    const { grade_id, subject_id, content_id, subcontent_id } = req.query;
    
    // Build dynamic where clause based on provided filters
    const where = {};
    if (grade_id) where.grade_id = grade_id;
    if (subject_id) where.subject_id = subject_id;
    if (content_id) where.content_id = content_id;
    if (subcontent_id) where.subcontent_id = subcontent_id;
    
    // If no filters provided, return empty
    if (Object.keys(where).length === 0) {
      return res.status(200).json([]);
    }

    const assignments = await prisma.quiz_assignments.findMany({
      where,
      include: {
        quizzes: {
          include: {
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching quiz assignments:", error);
    res.status(500).json({ error: "Failed to fetch quiz assignments" });
  }
};

const assignQuiz = async (req, res) => {
  try {
    const { quiz_id, grade_id, subject_id, content_id, subcontent_id } = req.body;
    if (!quiz_id || !grade_id) {
      return res.status(400).json({ error: "Missing required fields: quiz_id, grade_id" });
    }

    // Validate that at least one position level is provided (grade is always provided)
    // subject_id, content_id, subcontent_id are optional
    
    const assignment = await prisma.quiz_assignments.create({
      data: {
        quiz_id,
        grade_id,
        subject_id: subject_id || null,
        content_id: content_id || null,
        subcontent_id: subcontent_id || null,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error assigning quiz:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Quiz already assigned to this position" });
    }
    res.status(500).json({ error: "Failed to assign quiz" });
  }
};

const removeQuizAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quiz_assignments.delete({ where: { id } });
    res.status(200).json({ message: "Quiz assignment removed" });
  } catch (error) {
    console.error("Error removing quiz assignment:", error);
    res.status(500).json({ error: "Failed to remove quiz assignment" });
  }
};

// ==================== VIDEOS BY CHANNEL (ADMIN) ====================

const getVideosByChannelAdmin = async (req, res) => {
  try {
    const { channelId } = req.params;

    const assignments = await prisma.video_assignments.findMany({
      where: { 
        videos: {
          channel_id: channelId
        }
      },
      include: {
        videos: true,
        subjects: true,
      },
      orderBy: { created_at: "desc" },
    });

    const formattedVideos = assignments.map((a) => ({
      id: a.videos.id,
      title: a.videos.title,
      thumbnails: a.videos.thumbnails,
      duration: a.videos.duration,
      viewCount: formatViewCount(a.videos.view_count),
      published_at: a.videos.published_at,
      channel_title: a.videos.channel_title,
      channel_id: a.videos.channel_id,
    }));

    res.status(200).json(formattedVideos);
  } catch (error) {
    console.error("Error fetching videos by channel:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// ==================== VIDEOS BY SUBCONTENT (ADMIN) ====================

const getVideosBySubcontentAdmin = async (req, res) => {
  try {
    const { subcontentId } = req.params;

    const assignments = await prisma.video_assignments.findMany({
      where: { subcontent_id: subcontentId },
      include: {
        videos: true,
        subjects: true,
      },
      orderBy: { created_at: "desc" },
    });

    const formattedVideos = assignments.map((a) => ({
      id: a.videos.id,
      title: a.videos.title,
      thumbnails: a.videos.thumbnails,
      duration: a.videos.duration,
      viewCount: formatViewCount(a.videos.view_count),
      published_at: a.videos.published_at,
      channel_title: a.videos.channel_title,
      channel_id: a.videos.channel_id,
    }));

    res.status(200).json(formattedVideos);
  } catch (error) {
    console.error("Error fetching videos by subcontent:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// ==================== BULK ADD VIDEOS ====================

const addVideosBulk = async (req, res) => {
  try {
    const { subcontentId, videos, gradeId, subjectId, contentId } = req.body;

    if (!subcontentId || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: "Missing required fields: subcontentId and videos array" });
    }

    // Resolve grade hierarchy if not provided
    let resolvedGradeId = gradeId;
    let resolvedSubjectId = subjectId;
    let resolvedContentId = contentId;

    console.log('Received from frontend:', { gradeId, subjectId, contentId });
    console.log('Subcontent ID:', subcontentId);

    if (!resolvedGradeId || !resolvedSubjectId || !resolvedContentId) {
      // Fetch subcontent with full hierarchy
      console.log('Resolving hierarchy from database...');
      const subcontent = await prisma.subcontents.findUnique({
        where: { id: subcontentId },
        include: {
          contents: {
            select: {
              id: true,
              subject_id: true,
              subjects: {
                select: {
                  id: true,
                  grade_id: true,
                },
              },
            },
          },
        },
      });

      console.log('Found subcontent:', subcontent);

      if (subcontent && subcontent.contents) {
        resolvedContentId = subcontent.content_id;
        resolvedSubjectId = subcontent.contents.subject_id;
        
        if (subcontent.contents.subjects) {
          resolvedGradeId = subcontent.contents.subjects.grade_id;
        }
      }
    }

    console.log('Resolved hierarchy:', { resolvedGradeId, resolvedSubjectId, resolvedContentId });

    const result = await prisma.$transaction(
      async (tx) => {
        let addedCount = 0;

        for (const videoData of videos) {
          console.log('Processing video:', JSON.stringify(videoData));
          
          // Validate video data - check multiple possible ID fields
          const videoId = videoData.id || videoData.videoId;
          if (!videoId) {
            console.error('Video missing ID. Full videoData:', videoData);
            continue;
          }

          // Check if video was previously deleted - if so, skip it entirely
          const deletedVideo = await tx.deleted_videos.findUnique({
            where: { video_id: videoId },
          });

          if (deletedVideo) {
            console.log('Video was previously deleted, skipping:', videoId);
            continue;
          }

          // Upsert video
          const existingVideo = await tx.videos.findUnique({
            where: { id: videoId },
          });

          if (!existingVideo) {
            console.log('Creating video with ID:', videoId);
            try {
              await tx.videos.create({
                data: {
                  id: videoId,
                  title: videoData.title || 'Untitled',
                  channel_title: videoData.channel_title || videoData.channelTitle || null,
                  thumbnails: videoData.thumbnails || null,
                  published_at: videoData.published_at || videoData.publishedAt ? new Date(videoData.published_at || videoData.publishedAt) : null,
                  channel_id: videoData.channel_id || videoData.channelId || null,
                  duration: videoData.duration || 0,
                  view_count: videoData.view_count || videoData.viewCount || 0,
                },
              });
              console.log('Video created successfully:', videoId);
            } catch (videoError) {
              console.error('Error creating video:', videoId, videoError);
              throw videoError;
            }
          } else {
            console.log('Video already exists:', videoId);
          }

          // Verify video exists before creating assignment
          const videoCheck = await tx.videos.findUnique({
            where: { id: videoId },
          });

          if (!videoCheck) {
            console.error('Video not found after creation:', videoId);
            throw new Error(`Video ${videoId} was not created successfully`);
          }

          // Create video assignment
          const existingAssignment = await tx.video_assignments.findFirst({
            where: {
              video_id: videoId,
              subcontent_id: subcontentId,
            },
          });

          if (!existingAssignment) {
            console.log('Creating assignment for video:', videoId, 'subcontent:', subcontentId);
            try {
              await tx.video_assignments.create({
                data: {
                  video_id: videoId,
                  subcontent_id: subcontentId,
                  grade_id: resolvedGradeId,
                  subject_id: resolvedSubjectId,
                  content_id: resolvedContentId,
                },
              });
              console.log('Assignment created successfully');
              addedCount++;
            } catch (assignmentError) {
              console.error('Error creating assignment:', assignmentError);
              throw assignmentError;
            }
          } else {
            console.log('Assignment already exists');
          }
        }

        return { addedCount };
      },
      {
        timeout: 60000,
        maxWait: 30000,
      }
    );

    res.status(201).json({
      message: "Videos added successfully",
      count: result.addedCount,
    });
  } catch (error) {
    console.error("Error adding videos bulk:", error);
    res.status(500).json({ error: "Failed to add videos: " + (error.message || "Unknown error") });
  }
};

// ==================== BULK DELETE VIDEOS BY IDS ====================

const deleteVideosByIds = async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: "Missing required field: videoIds array" });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Insert into deleted_videos table first
        const deleteRecords = videoIds.map(videoId => ({
          video_id: videoId,
          deleted_at: new Date(),
        }));

        await tx.deleted_videos.createMany({
          data: deleteRecords,
          skipDuplicates: true,
        });

        // Delete all video assignments for these videos
        const assignmentResult = await tx.video_assignments.deleteMany({
          where: {
            video_id: { in: videoIds },
          },
        });

        // Delete the videos themselves
        const videoResult = await tx.videos.deleteMany({
          where: {
            id: { in: videoIds },
          },
        });

        return {
          deletedAssignments: assignmentResult.count,
          deletedVideos: videoResult.count,
        };
      },
      {
        timeout: 60000,
        maxWait: 30000,
      }
    );

    res.status(200).json({
      message: "Videos deleted successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error deleting videos by IDs:", error);
    res.status(500).json({ error: "Failed to delete videos: " + (error.message || "Unknown error") });
  }
};

// ==================== DELETE VIDEOS BY POSITION ====================

const deleteVideosByPosition = async (req, res) => {
  try {
    const { subcontentId, videoIds } = req.body;

    if (!subcontentId || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: "Missing required fields: subcontentId and videoIds array" });
    }

    const result = await prisma.video_assignments.deleteMany({
      where: {
        subcontent_id: subcontentId,
        video_id: { in: videoIds },
      },
    });

    res.status(200).json({
      message: "Videos removed from subcontent successfully",
      count: result.count,
    });
  } catch (error) {
    console.error("Error deleting videos by position:", error);
    res.status(500).json({ error: "Failed to delete videos: " + (error.message || "Unknown error") });
  }
};

// ==================== REPORTED VIDEOS (ADMIN) ====================

const getAllReportedVideos = async (req, res) => {
  try {
    const reports = await prisma.reports.findMany({
      include: {
        videos: true,
        profiles: {
          include: {
            grades: true,
          },
        },
      },
      orderBy: { reported_at: "desc" },
    });

    const formatted = reports.map((r) => ({
      id: r.videos.id,
      title: r.videos.title,
      thumbnails: r.videos.thumbnails,
      duration: r.videos.duration,
      channel_title: r.videos.channel_title,
      channel_id: r.videos.channel_id,
      reason: "Reported by user",
      reported_at: r.reported_at,
      reported_by: r.profiles.profile_name,
      grade_name: r.profiles.grades?.name || null,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching all reported videos:", error);
    res.status(500).json({ error: "Failed to fetch reported videos" });
  }
};

const resolveReportedVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Delete all reports for this video
    await prisma.reports.deleteMany({
      where: { video_id: videoId },
    });

    res.status(200).json({ message: "Report resolved successfully" });
  } catch (error) {
    console.error("Error resolving report:", error);
    res.status(500).json({ error: "Failed to resolve report" });
  }
};

const deleteReportedVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Delete all reports for this video
    await prisma.reports.deleteMany({
      where: { video_id: videoId },
    });

    // Delete video assignments
    await prisma.video_assignments.deleteMany({
      where: { video_id: videoId },
    });

    // Delete the video
    await prisma.videos.delete({
      where: { id: videoId },
    });

    res.status(200).json({ message: "Reported video deleted successfully" });
  } catch (error) {
    console.error("Error deleting reported video:", error);
    res.status(500).json({ error: "Failed to delete reported video" });
  }
};

export {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getSubjectsByGrade,
  createSubject,
  updateSubject,
  deleteSubject,
  getContentsBySubject,
  createContent,
  updateContent,
  deleteContent,
  getSubcontentsByContent,
  createSubcontent,
  updateSubcontent,
  deleteSubcontent,
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  assignChannelToGrade,
  removeChannelFromGrade,
  assignChannelToSubject,
  removeChannelFromSubject,
  assignChannelToPosition,
  getChannelAssignments,
  removeChannelAssignment,
  getChannelsByGrade,
  getFullTree,
  getGradeChannels,
  getSubjectChannels,
  getAllUsers,
  updateUserRole,
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  importQuizJSON,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizAssignments,
  assignQuiz,
  removeQuizAssignment,
  deleteVideosByPosition,
  getVideosBySubcontentAdmin,
  getVideosByChannelAdmin,
  addVideosBulk,
  deleteVideosByIds,
  getAllReportedVideos,
  resolveReportedVideo,
  deleteReportedVideo,
};
