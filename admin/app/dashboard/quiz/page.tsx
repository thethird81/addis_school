"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Button } from "@/components/ui/button";
import { QuizTable } from "./_components/quiz-table";
import { QuizDialog } from "./_components/quiz-dialog";
import { CurriculumSelect } from "./_components/curriculum-select";
import { bulkAssignQuizzes } from "./_actions/quiz-actions";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export default function DashboardQuizPage() {
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentNode, setAssignmentNode] = useState<{
    gradeId?: string;
    subjectId?: string;
    contentId?: string;
    subcontentId?: string;
  }>({});
  const [isAssigning, setIsAssigning] = useState(false);

  const handleBulkAssign = async () => {
    if (selectedQuizIds.length === 0) {
      toast.error("Please select at least one quiz");
      return;
    }

    if (!assignmentNode.gradeId) {
      toast.error("Please select a grade for assignment");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await bulkAssignQuizzes({
        quizIds: selectedQuizIds,
        node: {
          grade_id: assignmentNode.gradeId!,
          subject_id: assignmentNode.subjectId || null,
          content_id: assignmentNode.contentId || null,
          subcontent_id: assignmentNode.subcontentId || null,
        },
      });

      if (!result.success) {
        toast.error(result.error || "Failed to assign quizzes");
        return;
      }

      toast.success(result.message);
      setSelectedQuizIds([]);
      setAssignmentNode({});
    } catch (error: any) {
      toast.error(error.message || "Failed to assign quizzes");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Administration</h1>
          <p className="text-muted-foreground">
            Manage quizzes and assign them to curriculum nodes.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      <Tabs defaultValue="management" className="w-full">
        <TabsList>
          <TabsTrigger value="management">Quiz Management</TabsTrigger>
          <TabsTrigger value="assignments">Bulk Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          <QuizTable
            selectedQuizIds={selectedQuizIds}
            onSelectionChange={setSelectedQuizIds}
          />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="rounded-lg border p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Bulk Assignment</h3>
              <p className="text-sm text-muted-foreground">
                Select quizzes from the management tab, then choose a curriculum
                node to assign them to.
              </p>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-medium mb-3">
                {selectedQuizIds.length} quiz(es) selected for assignment
              </p>
              {selectedQuizIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No quizzes selected. Go to the Quiz Management tab and select
                  quizzes using the checkboxes.
                </p>
              ) : (
                <div className="space-y-4">
                  <CurriculumSelect
                    onSelectionChange={(selection) => setAssignmentNode(selection)}
                  />

                  <Button
                    onClick={handleBulkAssign}
                    disabled={isAssigning || !assignmentNode.gradeId}
                    className="w-full"
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Selected Quizzes"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <QuizDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}