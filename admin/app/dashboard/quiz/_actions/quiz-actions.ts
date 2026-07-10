export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

interface QuestionInput {
  question_text: string;
  options: any;
  correct_answer: string;
  difficulty?: string;
  explanation?: string | null;
  question_image?: string | null;
}

interface CreateQuizParams {
  title: string;
  questions: QuestionInput[];
  grade_id?: string;
  subject_id?: string;
  content_id?: string;
  subcontent_id?: string;
}

/**
 * Creates a new quiz and bulk inserts its questions via backend API.
 */
export async function createQuizWithQuestions({
  title,
  questions,
  grade_id,
  subject_id,
  content_id,
  subcontent_id,
}: CreateQuizParams) {
  try {
    if (!title?.trim()) {
      return { success: false, error: "Quiz title is required" };
    }

    if (!questions || questions.length === 0) {
      return { success: false, error: "At least one question is required" };
    }

    const response = await fetch(`${API_BASE}/admin/quizzes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: title.trim(),
        grade_id,
        subject_id,
        content_id,
        subcontent_id,
        questions,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create quiz" };
    }

    return { success: true, quizId: data.quiz.id, count: data.questionCount };
  } catch (error: any) {
    console.error("Error creating quiz with questions:", error);
    return { success: false, error: error.message || "Failed to create quiz" };
  }
}

interface AssignmentNode {
  grade_id: string;
  subject_id?: string | null;
  content_id?: string | null;
  subcontent_id?: string | null;
}

interface BulkAssignParams {
  quizIds: string[];
  node: AssignmentNode;
}

/**
 * Bulk assigns quizzes to a curriculum node path via backend API.
 */
export async function bulkAssignQuizzes({ quizIds, node }: BulkAssignParams) {
  try {
    if (!quizIds || quizIds.length === 0) {
      return { success: false, error: "No quizzes selected" };
    }

    if (!node.grade_id) {
      return { success: false, error: "Grade is required for assignment" };
    }

    const response = await fetch(`${API_BASE}/admin/quiz-assignments/bulk`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        quizIds,
        grade_id: node.grade_id,
        subject_id: node.subject_id || null,
        content_id: node.content_id || null,
        subcontent_id: node.subcontent_id || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to assign quizzes" };
    }

    return {
      success: true,
      inserted: data.inserted,
      skipped: data.skipped,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Error bulk assigning quizzes:", error);
    return { success: false, error: error.message || "Failed to assign quizzes" };
  }
}

interface FilterParams {
  search?: string;
  gradeId?: string;
  subjectId?: string;
  contentId?: string;
  subcontentId?: string;
}

/**
 * Fetches quizzes with filtering by name and curriculum hierarchy via backend API.
 */
export async function getFilteredQuizzes({
  search,
  gradeId,
  subjectId,
  contentId,
  subcontentId,
}: FilterParams) {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append("search", search.trim());
    if (gradeId) params.append("grade_id", gradeId);
    if (subjectId) params.append("subject_id", subjectId);
    if (contentId) params.append("content_id", contentId);
    if (subcontentId) params.append("subcontent_id", subcontentId);

    const response = await fetch(`${API_BASE}/admin/quiz-assignments/filter?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch filtered quizzes" };
    }

    return { success: true, quizzes: data || [] };
  } catch (error: any) {
    console.error("Error fetching filtered quizzes:", error);
    return { success: false, error: error.message || "Failed to fetch quizzes" };
  }
}

/**
 * Fetches all quizzes via backend API.
 */
export async function getAllQuizzes() {
  try {
    const response = await fetch(`${API_BASE}/admin/quizzes`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch quizzes" };
    }

    return { success: true, quizzes: data || [] };
  } catch (error: any) {
    console.error("Error fetching quizzes:", error);
    return { success: false, error: error.message || "Failed to fetch quizzes" };
  }
}

/**
 * Removes a quiz assignment by ID via backend API.
 */
export async function removeQuizAssignment(assignmentId: string) {
  try {
    const response = await fetch(`${API_BASE}/admin/quiz-assignments/bulk/${assignmentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to remove assignment" };
    }

    return { success: true, message: data.message || "Assignment removed" };
  } catch (error: any) {
    console.error("Error removing quiz assignment:", error);
    return { success: false, error: error.message || "Failed to remove assignment" };
  }
}

/**
 * Fetches the curriculum tree via backend API.
 */
export async function getCurriculumTree() {
  try {
    const response = await fetch(`${API_BASE}/admin/tree`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch curriculum tree" };
    }

    return { success: true, tree: data };
  } catch (error: any) {
    console.error("Error fetching curriculum tree:", error);
    return { success: false, error: error.message || "Failed to fetch curriculum" };
  }
}
