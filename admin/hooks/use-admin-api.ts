"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Videos
export function useVideos(subcontentId?: string) {
  return useQuery({
    queryKey: ["videos", subcontentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (subcontentId) params.append("subcontentId", subcontentId);
      const { data } = await api.get(`/admin/subcontents/${subcontentId}/videos`);
      return data;
    },
    enabled: !!subcontentId,
  });
}

export function useVideosByChannel(channelId?: string) {
  return useQuery({
    queryKey: ["videos", "channel", channelId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/channels/${channelId}/videos`);
      return data;
    },
    enabled: !!channelId,
  });
}

export function useReportedVideos() {
  return useQuery({
    queryKey: ["reportedVideos"],
    queryFn: async () => {
      const { data } = await api.get("/admin/reported-videos");
      return data;
    },
  });
}

// Channels
export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data } = await api.get("/admin/channels");
      return data;
    },
  });
}

export function useChannelsByGrade(gradeId?: string) {
  return useQuery({
    queryKey: ["channels", "grade", gradeId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/grade-channels/${gradeId}`);
      return data;
    },
    enabled: !!gradeId,
  });
}

// Users
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get("/admin/users");
      return data;
    },
  });
}

// Quizzes
export function useQuizzes() {
  return useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data } = await api.get("/admin/quizzes");
      return data;
    },
  });
}

export function useQuestionsByQuiz(quizId?: string) {
  return useQuery({
    queryKey: ["questions", quizId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/questions/quiz/${quizId}`);
      return data;
    },
    enabled: !!quizId,
  });
}

export function useQuizAssignments(filters?: { gradeId?: string; subjectId?: string; contentId?: string; subcontentId?: string }) {
  return useQuery({
    queryKey: ["quizAssignments", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.gradeId) params.append("grade_id", filters.gradeId);
      if (filters?.subjectId) params.append("subject_id", filters.subjectId);
      if (filters?.contentId) params.append("content_id", filters.contentId);
      if (filters?.subcontentId) params.append("subcontent_id", filters.subcontentId);
      const { data } = await api.get(`/admin/quiz-assignments?${params.toString()}`);
      return data;
    },
  });
}

export function useTree() {
  return useQuery({
    queryKey: ["tree"],
    queryFn: async () => {
      const { data } = await api.get("/admin/tree");
      return data;
    },
  });
}

export function useGradeList() {
  return useQuery({
    queryKey: ["gradeList"],
    queryFn: async () => {
      const { data } = await api.get("/admin/grades");
      return data;
    },
  });
}

// Mutations
export function useDeleteVideosBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoIds: string[]) => {
      const { data } = await api.delete("/admin/videos/bulk-ids", {
        data: { videoIds },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["reportedVideos"] });
    },
  });
}

export function useDeleteReportedVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const { data } = await api.delete(`/admin/reported-videos/${videoId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportedVideos"] });
    },
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const { data } = await api.post(`/admin/reported-videos/${videoId}/resolve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportedVideos"] });
    },
  });
}

export function useAddVideosBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subcontentId,
      videos,
      gradeId,
      subjectId,
      contentId,
    }: {
      subcontentId: string;
      videos: any[];
      gradeId?: string;
      subjectId?: string;
      contentId?: string;
    }) => {
      const { data } = await api.post("/admin/videos/bulk", {
        subcontentId,
        videos,
        gradeId,
        subjectId,
        contentId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.post("/admin/channels", { id, name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.put(`/admin/channels/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/channels/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quizData: any) => {
      const { data } = await api.post("/admin/quizzes", quizData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...quizData }: any) => {
      const { data } = await api.put(`/admin/quizzes/${id}`, quizData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/quizzes/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useFetchYouTubeVideos() {
  return useMutation({
    mutationFn: async ({ searchTerm, type }: { searchTerm: string; type?: string }) => {
      const { data } = await api.post("/youtube/search", {
        searchTerm,
        type: type || "curricular",
      });
      return data;
    },
  });
}

export function useFetchChannelVideos() {
  return useMutation({
    mutationFn: async ({ channelId, isAdvert }: { channelId: string; isAdvert?: boolean }) => {
      const { data } = await api.post(`/youtube/channel/${channelId}`, { isAdvert });
      return data;
    },
  });
}

// ==================== CURRICULUM ====================

export function useCurriculumTree() {
  return useQuery({
    queryKey: ["curriculumTree"],
    queryFn: async () => {
      const { data } = await api.get("/admin/tree");
      return data;
    },
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, sort_order }: { name: string; sort_order: number }) => {
      const { data } = await api.post("/admin/grades", { name, sort_order });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, sort_order }: { id: string; name?: string; sort_order?: number }) => {
      const { data } = await api.put(`/admin/grades/${id}`, { name, sort_order });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/grades/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ grade_id, name }: { grade_id: string; name: string }) => {
      const { data } = await api.post("/admin/subjects", { grade_id, name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      const { data } = await api.put(`/admin/subjects/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/subjects/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ subject_id, name }: { subject_id: string; name: string }) => {
      const { data } = await api.post("/admin/contents", { subject_id, name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      const { data } = await api.put(`/admin/contents/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/contents/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useCreateSubcontent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content_id, name }: { content_id: string; name: string }) => {
      const { data } = await api.post("/admin/subcontents", { content_id, name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useUpdateSubcontent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      const { data } = await api.put(`/admin/subcontents/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}

export function useDeleteSubcontent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/subcontents/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    },
  });
}
