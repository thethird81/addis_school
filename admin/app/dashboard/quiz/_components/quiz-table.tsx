"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAllQuizzes, getFilteredQuizzes, removeQuizAssignment, API_BASE, getAuthHeaders } from "../_actions/quiz-actions";
import { CurriculumSelect } from "./curriculum-select";
import { Search, Loader2, Trash2, Pencil } from "lucide-react";

interface QuizTableProps {
  selectedQuizIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onQuizzesLoaded?: (quizzes: any[]) => void;
}

interface Quiz {
  id: string;
  title: string;
  questionCount?: number;
  created_at: string;
}

export function QuizTable({
  selectedQuizIds,
  onSelectionChange,
  onQuizzesLoaded,
}: QuizTableProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    gradeId?: string;
    subjectId?: string;
    contentId?: string;
    subcontentId?: string;
  }>({});
  const [removeTarget, setRemoveTarget] = useState<Quiz | null>(null);
  const [editTarget, setEditTarget] = useState<Quiz | null>(null);

  const queryClient = useQueryClient();

  const hasActiveFilters = Boolean(filters.gradeId || filters.subjectId || filters.contentId || filters.subcontentId);

  const { data: allQuizzesData, isLoading: isLoadingAll } = useQuery({
    queryKey: ["quizzes-all"],
    queryFn: async () => {
      const result = await getAllQuizzes();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.quizzes as Quiz[];
    },
    enabled: !hasActiveFilters,
  });

  const { data: filteredData, isLoading: isLoadingFiltered, refetch } = useQuery({
    queryKey: ["quizzes-filtered", search, filters],
    queryFn: async () => {
      const result = await getFilteredQuizzes({
        search,
        ...filters,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.quizzes;
    },
    enabled: hasActiveFilters,
  });

  const isLoading = hasActiveFilters ? isLoadingFiltered : isLoadingAll;
  const quizzes = (hasActiveFilters ? filteredData : allQuizzesData) || [];

  const removeMutation = useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }) => {
      const result = await removeQuizAssignment(assignmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { assignmentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes-filtered"] });
      setRemoveTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const response = await fetch(`${API_BASE}/admin/quizzes/${quizId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete quiz");
      }
      return { quizId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes-all"] });
      queryClient.invalidateQueries({ queryKey: ["quizzes-filtered"] });
      setRemoveTarget(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ quizId, title }: { quizId: string; title: string }) => {
      const response = await fetch(`${API_BASE}/admin/quizzes/${quizId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update quiz");
      }
      return { quizId, title };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes-all"] });
      queryClient.invalidateQueries({ queryKey: ["quizzes-filtered"] });
      setEditTarget(null);
    },
  });

  const toggleQuiz = (id: string) => {
    if (selectedQuizIds.includes(id)) {
      onSelectionChange(selectedQuizIds.filter((qid) => qid !== id));
    } else {
      onSelectionChange([...selectedQuizIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedQuizIds.length === quizzes.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(quizzes.map((q: any) => q.id));
    }
  };

  const allSelected = quizzes.length > 0 && selectedQuizIds.length === quizzes.length;

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes by title..."
              className="pl-8"
            />
          </div>
          {hasActiveFilters && (
            <Button onClick={() => refetch()} variant="secondary" size="sm">
              Filter
            </Button>
          )}
        </div>

        <CurriculumSelect
          onSelectionChange={(selection) => {
            setFilters({
              gradeId: selection.gradeId,
              subjectId: selection.subjectId,
              contentId: selection.contentId,
              subcontentId: selection.subcontentId,
            });
          }}
        />
      </div>

      {/* Selection Summary */}
      {selectedQuizIds.length > 0 && !hasActiveFilters && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">{selectedQuizIds.length} quiz(es) selected</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {!hasActiveFilters && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead>Title</TableHead>
              <TableHead>Questions</TableHead>
              {hasActiveFilters && <TableHead>Assignment</TableHead>}
              <TableHead>Created</TableHead>
              {hasActiveFilters && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={hasActiveFilters ? 6 : 5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading quizzes...
                  </div>
                </TableCell>
              </TableRow>
            ) : quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasActiveFilters ? 6 : 5} className="text-center py-8 text-muted-foreground">
                  No quizzes found
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz: any) => {
                const isQuizObject = quiz.title && typeof quiz.title === "string";
                const title = isQuizObject ? quiz.title : quiz.quizzes?.title;
                const questionCount = isQuizObject
                  ? quiz._count?.questions
                  : quiz.quizzes?._count?.questions;
                const displayId = quiz.id;

                return (
                  <TableRow key={quiz.id} data-state={selectedQuizIds.includes(displayId) ? "selected" : undefined}>
                    {!hasActiveFilters && (
                      <TableCell>
                        <Checkbox
                          checked={selectedQuizIds.includes(displayId)}
                          onCheckedChange={() => toggleQuiz(displayId)}
                          aria-label={`Select ${title}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{title}</TableCell>
                    <TableCell>{questionCount || 0}</TableCell>
                    {hasActiveFilters && (
                      <TableCell>
                        {quiz.grades?.name}
                        {quiz.subjects?.name && ` / ${quiz.subjects.name}`}
                        {quiz.contents?.name && ` / ${quiz.contents.name}`}
                        {quiz.subcontents?.name && ` / ${quiz.subcontents.name}`}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </TableCell>
                    {hasActiveFilters ? (
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRemoveTarget({ ...quiz, title: title || "" } as Quiz)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    ) : (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditTarget({ ...quiz, title: title || "" } as Quiz)}
                            aria-label={`Edit ${title}`}
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRemoveTarget({ ...quiz, title: title || "" } as Quiz)}
                            aria-label={`Delete ${title}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Remove Confirmation Modal */}
      <Dialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasActiveFilters ? "Remove Quiz Assignment" : "Delete Quiz"}
            </DialogTitle>
            <DialogDescription>
              {hasActiveFilters ? (
                <>
                  Are you sure you want to remove the assignment for "{removeTarget?.title}"?
                  This will unlink this quiz from the selected curriculum position.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete "{removeTarget?.title}"?
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setRemoveTarget(null)}
              disabled={removeMutation.isPending || deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget && removeTarget.id) {
                  if (hasActiveFilters) {
                    removeMutation.mutate({ assignmentId: removeTarget.id });
                  } else {
                    deleteMutation.mutate(removeTarget.id);
                  }
                }
              }}
              disabled={removeMutation.isPending || deleteMutation.isPending}
            >
              {(removeMutation.isPending || deleteMutation.isPending) ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quiz Modal */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>
              Update the quiz title below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-quiz-title" className="text-sm font-medium">
                Quiz Title
              </label>
              <Input
                id="edit-quiz-title"
                defaultValue={editTarget?.title}
                placeholder="Enter quiz title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditTarget(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const input = document.getElementById("edit-quiz-title") as HTMLInputElement;
                if (editTarget && input.value.trim()) {
                  updateMutation.mutate({
                    quizId: editTarget.id,
                    title: input.value.trim(),
                  });
                }
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
