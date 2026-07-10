"use client";

import { useState } from "react";
import { useCurriculumTree, useCreateGrade, useUpdateGrade, useDeleteGrade, useCreateSubject, useUpdateSubject, useDeleteSubject, useCreateContent, useUpdateContent, useDeleteContent, useCreateSubcontent, useUpdateSubcontent, useDeleteSubcontent } from "@/hooks/use-admin-api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronRight, Check, X } from "lucide-react";

interface Grade {
  id: string;
  name: string;
  sort_order: number;
  subjects: Subject[];
}

interface Subject {
  id: string;
  name: string;
  contents: Content[];
}

interface Content {
  id: string;
  name: string;
  subcontents: Subcontent[];
}

interface Subcontent {
  id: string;
  name: string;
}

type EntityType = "grade" | "subject" | "content" | "subcontent";

export default function CurriculumPage() {
  const { data: tree = [], isLoading, error, refetch } = useCurriculumTree();
  
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();
  const createSubcontent = useCreateSubcontent();
  const updateSubcontent = useUpdateSubcontent();
  const deleteSubcontent = useDeleteSubcontent();

  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  // Inline editing states - track which row is being edited
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingSubcontentId, setEditingSubcontentId] = useState<string | null>(null);

  const [editGradeName, setEditGradeName] = useState("");
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editContentName, setEditContentName] = useState("");
  const [editSubcontentName, setEditSubcontentName] = useState("");

  // Get selected entities
  const selectedGrade = tree.find((g: Grade) => g.id === selectedGradeId) || null;
  const selectedSubject = selectedGrade?.subjects.find((s: Subject) => s.id === selectedSubjectId) || null;
  const selectedContent = selectedSubject?.contents.find((c: Content) => c.id === selectedContentId) || null;

  const queryClient = useQueryClient();

  // Helper to revert state on error
  const revertOnError = (error: any, operation: string) => {
    toast.error(error.message || `Failed to ${operation}`);
    queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
  };

  // Grade handlers
  const handleAddGrade = async () => {
    const name = prompt("Enter grade name:");
    if (!name?.trim()) return;

    const sort_order = tree.length + 1;
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newGrade = {
      id: tempId,
      name: name.trim(),
      sort_order,
      subjects: []
    };

    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => [...old, newGrade]);

    try {
      await createGrade.mutateAsync({ name: name.trim(), sort_order });
      toast.success("Grade created");
      queryClient.invalidateQueries({ queryKey: ["curriculumTree"] });
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => old.filter(item => item.id !== tempId));
      revertOnError(error, "create grade");
    }
  };

  const handleEditGrade = (grade: Grade) => {
    setEditingGradeId(grade.id);
    setEditGradeName(grade.name);
  };

  const handleSaveGradeEdit = async (grade: Grade) => {
    if (!editGradeName.trim()) {
      toast.error("Grade name is required");
      return;
    }

    const oldName = grade.name;
    // Optimistic update
    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
      old.map(g => g.id === grade.id ? { ...g, name: editGradeName.trim() } : g)
    );
    setEditingGradeId(null);

    try {
      await updateGrade.mutateAsync({ id: grade.id, name: editGradeName.trim() });
      toast.success("Grade updated");
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
        old.map(g => g.id === grade.id ? { ...g, name: oldName } : g)
      );
      revertOnError(error, "update grade");
    }
  };

  const handleDeleteGrade = async (grade: Grade) => {
    if (!confirm(`Delete grade "${grade.name}" and all its subjects?`)) return;

    // Optimistic update
    const deletedGrade = grade;
    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => old.filter(g => g.id !== grade.id));
    if (selectedGradeId === grade.id) {
      setSelectedGradeId(null);
      setSelectedSubjectId(null);
      setSelectedContentId(null);
    }

    try {
      await deleteGrade.mutateAsync(grade.id);
      toast.success("Grade deleted");
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => [...old, deletedGrade]);
      revertOnError(error, "delete grade");
    }
  };

  // Subject handlers
  const handleAddSubject = async () => {
    if (!selectedGradeId) return;
    const name = prompt("Enter subject name:");
    if (!name?.trim()) return;

    try {
      await createSubject.mutateAsync({ grade_id: selectedGradeId, name: name.trim() });
      toast.success("Subject created");
      refetch();
    } catch (error: any) {
      revertOnError(error, "create subject");
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditSubjectName(subject.name);
  };

  const handleSaveSubjectEdit = async (subject: Subject) => {
    if (!editSubjectName.trim()) {
      toast.error("Subject name is required");
      return;
    }

    const oldName = subject.name;
    // Optimistic update
    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
      old.map(g => ({
        ...g,
        subjects: g.subjects.map(s => s.id === subject.id ? { ...s, name: editSubjectName.trim() } : s)
      }))
    );
    setEditingSubjectId(null);

    try {
      await updateSubject.mutateAsync({ id: subject.id, name: editSubjectName.trim() });
      toast.success("Subject updated");
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
        old.map(g => ({
          ...g,
          subjects: g.subjects.map(s => s.id === subject.id ? { ...s, name: oldName } : s)
        }))
      );
      revertOnError(error, "update subject");
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!confirm(`Delete subject "${subject.name}" and all its contents?`)) return;

    const deletedSubject = subject;
    
    // Optimistic update
    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
      old.map(g => ({
        ...g,
        subjects: g.subjects.filter(s => s.id !== subject.id)
      }))
    );
    
    if (selectedSubjectId === subject.id) {
      setSelectedSubjectId(null);
      setSelectedContentId(null);
    }

    try {
      await deleteSubject.mutateAsync(subject.id);
      toast.success("Subject deleted");
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
        old.map(g => ({
          ...g,
          subjects: [...g.subjects, deletedSubject].sort((a, b) => a.name.localeCompare(b.name))
        }))
      );
      revertOnError(error, "delete subject");
    }
  };

  // Content handlers
  const handleAddContent = async () => {
    if (!selectedSubjectId) return;
    const name = prompt("Enter content/chapter name:");
    if (!name?.trim()) return;

    try {
      await createContent.mutateAsync({ subject_id: selectedSubjectId, name: name.trim() });
      toast.success("Content created");
      refetch();
    } catch (error: any) {
      revertOnError(error, "create content");
    }
  };

  const handleEditContent = (content: Content) => {
    setEditingContentId(content.id);
    setEditContentName(content.name);
  };

  const handleSaveContentEdit = async (content: Content) => {
    if (!editContentName.trim()) {
      toast.error("Content name is required");
      return;
    }

    const oldName = content.name;
    // Optimistic update
    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
      old.map(g => ({
        ...g,
        subjects: g.subjects.map(s => ({
          ...s,
          contents: s.contents.map(c => c.id === content.id ? { ...c, name: editContentName.trim() } : c)
        }))
      }))
    );
    setEditingContentId(null);

    try {
      await updateContent.mutateAsync({ id: content.id, name: editContentName.trim() });
      toast.success("Content updated");
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
        old.map(g => ({
          ...g,
          subjects: g.subjects.map(s => ({
            ...s,
            contents: s.contents.map(c => c.id === content.id ? { ...c, name: oldName } : c)
          }))
        }))
      );
      revertOnError(error, "update content");
    }
  };

  const handleDeleteContent = async (content: Content) => {
    if (!confirm(`Delete content "${content.name}" and all its subcontents?`)) return;

    const deletedContent = content;
    
    // Optimistic update
    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
      old.map(g => ({
        ...g,
        subjects: g.subjects.map(s => ({
          ...s,
          contents: s.contents.filter(c => c.id !== content.id)
        }))
      }))
    );
    
    if (selectedContentId === content.id) {
      setSelectedContentId(null);
    }

    try {
      await deleteContent.mutateAsync(content.id);
      toast.success("Content deleted");
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
        old.map(g => ({
          ...g,
          subjects: g.subjects.map(s => ({
            ...s,
            contents: [...s.contents, deletedContent].sort((a, b) => a.name.localeCompare(b.name))
          }))
        }))
      );
      revertOnError(error, "delete content");
    }
  };

  // Subcontent handlers
  const handleAddSubcontent = async () => {
    if (!selectedContentId) return;
    const name = prompt("Enter lesson/subcontent name:");
    if (!name?.trim()) return;

    try {
      await createSubcontent.mutateAsync({ content_id: selectedContentId, name: name.trim() });
      toast.success("Lesson created");
      refetch();
    } catch (error: any) {
      revertOnError(error, "create lesson");
    }
  };

  const handleEditSubcontent = (subcontent: Subcontent) => {
    setEditingSubcontentId(subcontent.id);
    setEditSubcontentName(subcontent.name);
  };

  const handleSaveSubcontentEdit = async (subcontent: Subcontent) => {
    if (!editSubcontentName.trim()) {
      toast.error("Lesson name is required");
      return;
    }

    const oldName = subcontent.name;
    // Optimistic update
    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
      old.map(g => ({
        ...g,
        subjects: g.subjects.map(s => ({
          ...s,
          contents: s.contents.map(c => ({
            ...c,
            subcontents: c.subcontents.map(sc => sc.id === subcontent.id ? { ...sc, name: editSubcontentName.trim() } : sc)
          }))
        }))
      }))
    );
    setEditingSubcontentId(null);

    try {
      await updateSubcontent.mutateAsync({ id: subcontent.id, name: editSubcontentName.trim() });
      toast.success("Lesson updated");
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
        old.map(g => ({
          ...g,
          subjects: g.subjects.map(s => ({
            ...s,
            contents: s.contents.map(c => ({
              ...c,
              subcontents: c.subcontents.map(sc => sc.id === subcontent.id ? { ...sc, name: oldName } : sc)
            }))
          }))
        }))
      );
      revertOnError(error, "update lesson");
    }
  };

  const handleDeleteSubcontent = async (subcontent: Subcontent) => {
    if (!confirm(`Delete lesson "${subcontent.name}"?`)) return;

    const deletedSubcontent = subcontent;
    
    // Optimistic update
    queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
      old.map(g => ({
        ...g,
        subjects: g.subjects.map(s => ({
          ...s,
          contents: s.contents.map(c => ({
            ...c,
            subcontents: c.subcontents.filter(sc => sc.id !== subcontent.id)
          }))
        }))
      }))
    );

    try {
      await deleteSubcontent.mutateAsync(subcontent.id);
      toast.success("Lesson deleted");
    } catch (error) {
      queryClient.setQueryData<Grade[]>(["curriculumTree"], (old = []) => 
        old.map(g => ({
          ...g,
          subjects: g.subjects.map(s => ({
            ...s,
            contents: s.contents.map(c => ({
              ...c,
              subcontents: [...c.subcontents, deletedSubcontent].sort((a, b) => a.name.localeCompare(b.name))
            }))
          }))
        }))
      );
      revertOnError(error, "delete lesson");
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading curriculum</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading curriculum...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Curriculum Management</h1>
        <p className="text-muted-foreground">Manage grades, subjects, contents and lessons</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Grades */}
        <Card className={selectedGradeId ? "ring-2 ring-primary" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Grades</CardTitle>
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={handleAddGrade}>
              <Plus className="mr-2 h-4 w-4" />
              Add Grade
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {tree.map((grade: Grade) => (
              <GradeRow
                key={grade.id}
                grade={grade}
                isSelected={selectedGradeId === grade.id}
                isEditing={editingGradeId === grade.id}
                editName={editGradeName}
                onSelect={() => {
                  setSelectedGradeId(grade.id);
                  setSelectedSubjectId(null);
                  setSelectedContentId(null);
                }}
                onEdit={() => handleEditGrade(grade)}
                onSave={() => handleSaveGradeEdit(grade)}
                onDelete={() => handleDeleteGrade(grade)}
                onEditNameChange={setEditGradeName}
                onCancelEdit={() => setEditingGradeId(null)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Column 2: Subjects */}
        <Card className={selectedSubjectId ? "ring-2 ring-primary" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={handleAddSubject}
              disabled={!selectedGradeId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {!selectedGradeId ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Select a grade to view subjects
              </div>
            ) : selectedGrade && selectedGrade.subjects.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No subjects yet
              </div>
            ) : (
              selectedGrade?.subjects.map((subject: Subject) => (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                  isSelected={selectedSubjectId === subject.id}
                  isEditing={editingSubjectId === subject.id}
                  editName={editSubjectName}
                  onSelect={() => {
                    setSelectedSubjectId(subject.id);
                    setSelectedContentId(null);
                  }}
                  onEdit={() => handleEditSubject(subject)}
                  onSave={() => handleSaveSubjectEdit(subject)}
                  onDelete={() => handleDeleteSubject(subject)}
                  onEditNameChange={setEditSubjectName}
                  onCancelEdit={() => setEditingSubjectId(null)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 3: Contents/Chapters */}
        <Card className={selectedContentId ? "ring-2 ring-primary" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Contents / Chapters</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={handleAddContent}
              disabled={!selectedSubjectId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {!selectedSubjectId ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Select a subject to view contents
              </div>
            ) : selectedSubject && selectedSubject.contents.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No contents yet
              </div>
            ) : (
              selectedSubject?.contents.map((content: Content) => (
                <ContentRow
                  key={content.id}
                  content={content}
                  isSelected={selectedContentId === content.id}
                  isEditing={editingContentId === content.id}
                  editName={editContentName}
                  onSelect={() => setSelectedContentId(content.id)}
                  onEdit={() => handleEditContent(content)}
                  onSave={() => handleSaveContentEdit(content)}
                  onDelete={() => handleDeleteContent(content)}
                  onEditNameChange={setEditContentName}
                  onCancelEdit={() => setEditingContentId(null)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 4: Subcontents/Lessons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Subcontents / Lessons</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={handleAddSubcontent}
              disabled={!selectedContentId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {!selectedContentId ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Select a content to view lessons
              </div>
            ) : selectedContent && selectedContent.subcontents.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No lessons yet
              </div>
            ) : (
              selectedContent?.subcontents.map((subcontent: Subcontent) => (
                <SubcontentRow
                  key={subcontent.id}
                  subcontent={subcontent}
                  isEditing={editingSubcontentId === subcontent.id}
                  editName={editSubcontentName}
                  onEdit={() => handleEditSubcontent(subcontent)}
                  onSave={() => handleSaveSubcontentEdit(subcontent)}
                  onDelete={() => handleDeleteSubcontent(subcontent)}
                  onEditNameChange={setEditSubcontentName}
                  onCancelEdit={() => setEditingSubcontentId(null)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Row Components with hover effects and inline editing

interface GradeRowProps {
  grade: Grade;
  isSelected: boolean;
  isEditing: boolean;
  editName: string;
  onSelect: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditNameChange: (name: string) => void;
  onCancelEdit: () => void;
}

function GradeRow({ grade, isSelected, isEditing, editName, onSelect, onEdit, onSave, onDelete, onEditNameChange, onCancelEdit }: GradeRowProps) {
  return (
    <div
      className={`group relative flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
        isSelected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      }`}
      onClick={isEditing ? undefined : onSelect}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            className="h-8 text-sm"
          />
          <Button size="sm" variant="ghost" onClick={onSave} className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">{grade.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface SubjectRowProps {
  subject: Subject;
  isSelected: boolean;
  isEditing: boolean;
  editName: string;
  onSelect: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditNameChange: (name: string) => void;
  onCancelEdit: () => void;
}

function SubjectRow({ subject, isSelected, isEditing, editName, onSelect, onEdit, onSave, onDelete, onEditNameChange, onCancelEdit }: SubjectRowProps) {
  return (
    <div
      className={`group relative flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
        isSelected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      }`}
      onClick={isEditing ? undefined : onSelect}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            className="h-8 text-sm"
          />
          <Button size="sm" variant="ghost" onClick={onSave} className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">{subject.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface ContentRowProps {
  content: Content;
  isSelected: boolean;
  isEditing: boolean;
  editName: string;
  onSelect: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditNameChange: (name: string) => void;
  onCancelEdit: () => void;
}

function ContentRow({ content, isSelected, isEditing, editName, onSelect, onSave, onDelete, onEdit, onEditNameChange, onCancelEdit }: ContentRowProps) {
  return (
    <div
      className={`group relative flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
        isSelected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      }`}
      onClick={isEditing ? undefined : onSelect}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            className="h-8 text-sm"
          />
          <Button size="sm" variant="ghost" onClick={onSave} className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">{content.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface SubcontentRowProps {
  subcontent: Subcontent;
  isEditing: boolean;
  editName: string;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditNameChange: (name: string) => void;
  onCancelEdit: () => void;
}

function SubcontentRow({ subcontent, isEditing, editName, onEdit, onSave, onDelete, onEditNameChange, onCancelEdit }: SubcontentRowProps) {
  return (
    <div
      className="group relative flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
    >
      {isEditing ? (
        <div className="flex items-center gap-1 flex-1">
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            className="h-8 text-sm"
          />
          <Button size="sm" variant="ghost" onClick={onSave} className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate text-sm">{subcontent.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}