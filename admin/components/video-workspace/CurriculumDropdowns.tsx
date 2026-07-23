"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Loader2 } from "lucide-react";

interface DropdownItem {
  id: string;
  name: string;
}

export function CurriculumDropdowns() {
  const { activeLesson, setActiveLesson, fetchLiveVideos, liveLoading } = useVideoWorkspace();
  const { getToken } = useAuth();
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

  // State for dropdown options
  const [grades, setGrades] = useState<DropdownItem[]>([]);
  const [subjects, setSubjects] = useState<DropdownItem[]>([]);
  const [contents, setContents] = useState<DropdownItem[]>([]);
  const [subcontents, setSubcontents] = useState<DropdownItem[]>([]);

  // Loading states for each dropdown
  const [gradesLoading, setGradesLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [subcontentsLoading, setSubcontentsLoading] = useState(false);

  // Selected values
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [selectedSubcontentId, setSelectedSubcontentId] = useState<string>("");

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers = new Headers(options.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  }, [getToken]);

  // Fetch grades on mount
  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setGradesLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/admin/grades`);
      if (!response.ok) throw new Error("Failed to fetch grades");
      const data = await response.json();
      setGrades(data);
    } catch (err) {
      console.error("Error fetching grades:", err);
    } finally {
      setGradesLoading(false);
    }
  };

  const fetchSubjectsByGrade = async (gradeId: string) => {
    setSubjectsLoading(true);
    setSubjects([]);
    setSelectedSubjectId("");
    setContents([]);
    setSelectedContentId("");
    setSubcontents([]);
    setSelectedSubcontentId("");
    try {
      const response = await fetchWithAuth(`${API_BASE}/admin/subjects/${gradeId}`);
      if (!response.ok) throw new Error("Failed to fetch subjects");
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchContentsBySubject = async (subjectId: string) => {
    setContentsLoading(true);
    setContents([]);
    setSelectedContentId("");
    setSubcontents([]);
    setSelectedSubcontentId("");
    try {
      const response = await fetchWithAuth(`${API_BASE}/admin/contents/${subjectId}`);
      if (!response.ok) throw new Error("Failed to fetch contents");
      const data = await response.json();
      setContents(data);
    } catch (err) {
      console.error("Error fetching contents:", err);
    } finally {
      setContentsLoading(false);
    }
  };

  const fetchSubcontentsByContent = async (contentId: string) => {
    setSubcontentsLoading(true);
    setSubcontents([]);
    setSelectedSubcontentId("");
    try {
      const response = await fetchWithAuth(`${API_BASE}/admin/subcontents/${contentId}`);
      if (!response.ok) throw new Error("Failed to fetch subcontents");
      const data = await response.json();
      setSubcontents(data);
    } catch (err) {
      console.error("Error fetching subcontents:", err);
    } finally {
      setSubcontentsLoading(false);
    }
  };

  // Handlers
  const handleGradeChange = (value: string) => {
    setSelectedGradeId(value);
    fetchSubjectsByGrade(value);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value);
    fetchContentsBySubject(value);
  };

  const handleContentChange = (value: string) => {
    setSelectedContentId(value);
    fetchSubcontentsByContent(value);
  };

  const handleSubcontentChange = (value: string) => {
    setSelectedSubcontentId(value);
    const subcontent = subcontents.find((s) => s.id === value);
    if (subcontent && selectedContentId && selectedSubjectId && selectedGradeId) {
      const grade = grades.find((g) => g.id === selectedGradeId);
      const subject = subjects.find((s) => s.id === selectedSubjectId);
      const content = contents.find((c) => c.id === selectedContentId);
      setActiveLesson({
        gradeId: selectedGradeId,
        gradeName: grade?.name || "",
        subjectId: selectedSubjectId,
        subjectName: subject?.name || "",
        contentId: selectedContentId,
        contentName: content?.name || "",
        subcontentId: value,
        subcontentName: subcontent.name,
      });
    }
  };

  const handleFetchDb = () => {
    if (selectedSubcontentId) {
      fetchLiveVideos(selectedSubcontentId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Grade Dropdown */}
      <Select value={selectedGradeId} onValueChange={handleGradeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Grade..." />
        </SelectTrigger>
        <SelectContent>
          {gradesLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            grades.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Subject Dropdown */}
      <Select value={selectedSubjectId} onValueChange={handleSubjectChange} disabled={!selectedGradeId}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Subject..." />
        </SelectTrigger>
        <SelectContent>
          {subjectsLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Content Dropdown */}
      <Select value={selectedContentId} onValueChange={handleContentChange} disabled={!selectedSubjectId}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Content..." />
        </SelectTrigger>
        <SelectContent>
          {contentsLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            contents.map((content) => (
              <SelectItem key={content.id} value={content.id}>
                {content.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Subcontent Dropdown */}
      <Select value={selectedSubcontentId} onValueChange={handleSubcontentChange} disabled={!selectedContentId}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Subcontent..." />
        </SelectTrigger>
        <SelectContent>
          {subcontentsLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            subcontents.map((subcontent) => (
              <SelectItem key={subcontent.id} value={subcontent.id}>
                {subcontent.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Fetch DB Button */}
      <Button
        onClick={handleFetchDb}
        disabled={!selectedSubcontentId || liveLoading}
        className="gap-2"
        size="sm"
      >
        {liveLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        {liveLoading ? "Fetching..." : "Fetch DB"}
      </Button>
    </div>
  );
}