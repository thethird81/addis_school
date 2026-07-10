"use client";

import { useState, useEffect } from "react";
import { useCurriculumTree } from "@/hooks/use-admin-api";
import { Input } from "@/components/ui/input";

interface CurriculumSelectProps {
  onSelectionChange?: (selection: {
    gradeId?: string;
    subjectId?: string;
    contentId?: string;
    subcontentId?: string;
  }) => void;
  value?: {
    gradeId?: string;
    subjectId?: string;
    contentId?: string;
    subcontentId?: string;
  };
}

export function CurriculumSelect({ onSelectionChange, value }: CurriculumSelectProps) {
  const { data: tree = [], isLoading } = useCurriculumTree();

  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [selectedSubcontent, setSelectedSubcontent] = useState<string>("");

  useEffect(() => {
    if (value) {
      setSelectedGrade(value.gradeId || "");
      setSelectedSubject(value.subjectId || "");
      setSelectedContent(value.contentId || "");
      setSelectedSubcontent(value.subcontentId || "");
    }
  }, [value]);

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradeId = e.target.value;
    setSelectedGrade(gradeId);
    setSelectedSubject("");
    setSelectedContent("");
    setSelectedSubcontent("");
    onSelectionChange?.({ gradeId });
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setSelectedContent("");
    setSelectedSubcontent("");
    onSelectionChange?.({ gradeId: selectedGrade, subjectId });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contentId = e.target.value;
    setSelectedContent(contentId);
    setSelectedSubcontent("");
    onSelectionChange?.({ gradeId: selectedGrade, subjectId: selectedSubject, contentId });
  };

  const handleSubcontentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subcontentId = e.target.value;
    setSelectedSubcontent(subcontentId);
    onSelectionChange?.({
      gradeId: selectedGrade,
      subjectId: selectedSubject,
      contentId: selectedContent,
      subcontentId,
    });
  };

  const selectedGradeData = tree.find((g: any) => g.id === selectedGrade);
  const selectedSubjectData = selectedGradeData?.subjects?.find(
    (s: any) => s.id === selectedSubject
  );
  const selectedContentData = selectedSubjectData?.contents?.find(
    (c: any) => c.id === selectedContent
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        Loading curriculum...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Grade</label>
        <select
          value={selectedGrade}
          onChange={handleGradeChange}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select grade</option>
          {tree.map((grade: any) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Subject</label>
        <select
          value={selectedSubject}
          onChange={handleSubjectChange}
          disabled={!selectedGrade}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">Select subject</option>
          {selectedGradeData?.subjects?.map((subject: any) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Content</label>
        <select
          value={selectedContent}
          onChange={handleContentChange}
          disabled={!selectedSubject}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">Select content</option>
          {selectedSubjectData?.contents?.map((content: any) => (
            <option key={content.id} value={content.id}>
              {content.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Subcontent</label>
        <select
          value={selectedSubcontent}
          onChange={handleSubcontentChange}
          disabled={!selectedContent}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">Select subcontent</option>
          {selectedContentData?.subcontents?.map((subcontent: any) => (
            <option key={subcontent.id} value={subcontent.id}>
              {subcontent.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}