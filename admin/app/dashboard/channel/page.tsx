"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ChannelTable } from "./_components/channel-table";
import { ChannelDialog } from "./_components/channel-dialog";
import { CurriculumSelect } from "./_components/curriculum-select";
import { Channel } from "./_actions/channel-actions";
import { bulkAssignChannels } from "./_actions/channel-actions";
import { useMutation } from "@tanstack/react-query";

export default function ChannelPage() {
  const router = useRouter();
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [assignmentNode, setAssignmentNode] = useState<{
    gradeId?: string;
    subjectId?: string;
    contentId?: string;
    subcontentId?: string;
  }>({});

  const handleOpenDialog = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
    } else {
      setEditingChannel(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChannel(null);
  };

  const handleViewVideos = (channel: Channel) => {
    router.push(`/dashboard/channel/${channel.id}/video`);
  };

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ channelIds, gradeId, subjectId }: { channelIds: string[]; gradeId: string; subjectId: string }) => {
      const result = await bulkAssignChannels({ channelIds, grade_id: gradeId, subject_id: subjectId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.message || "Channels assigned successfully");
      setSelectedChannelIds([]);
      setAssignmentNode({});
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign channels");
    },
  });

  const handleBulkAssign = async () => {
    if (selectedChannelIds.length === 0) {
      toast.error("Please select at least one channel");
      return;
    }

    if (!assignmentNode.gradeId) {
      toast.error("Please select a grade for assignment");
      return;
    }

    // Subject is required for channel assignment
    if (!assignmentNode.subjectId) {
      toast.error("Please select a subject for assignment");
      return;
    }

    bulkAssignMutation.mutate({
      channelIds: selectedChannelIds,
      gradeId: assignmentNode.gradeId,
      subjectId: assignmentNode.subjectId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channel Administration</h1>
          <p className="text-muted-foreground">
            Manage channels and their video content.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </div>

      <Tabs defaultValue="management" className="w-full">
        <TabsList>
          <TabsTrigger value="management">Channel Management</TabsTrigger>
          <TabsTrigger value="assignments">Bulk Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          <ChannelTable
            selectedChannelIds={selectedChannelIds}
            onSelectionChange={setSelectedChannelIds}
            onViewVideos={handleViewVideos}
            onEditChannel={(channel) => handleOpenDialog(channel)}
          />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="rounded-lg border p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Bulk Assignment</h3>
              <p className="text-sm text-muted-foreground">
                Select channels from the management tab, then choose a curriculum
                node to assign them to.
              </p>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-medium mb-3">
                {selectedChannelIds.length} channel(s) selected for assignment
              </p>
              {selectedChannelIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No channels selected. Go to the Channel Management tab and select
                  channels using the checkboxes.
                </p>
              ) : (
                <div className="space-y-4">
                  <CurriculumSelect
                    onSelectionChange={(selection) => setAssignmentNode({
                      gradeId: selection.gradeId,
                      subjectId: selection.subjectId,
                      contentId: selection.contentId,
                      subcontentId: selection.subcontentId,
                    })}
                  />

                  <Button
                    onClick={handleBulkAssign}
                    disabled={bulkAssignMutation.isPending || !assignmentNode.gradeId || !assignmentNode.subjectId}
                    className="w-full"
                  >
                    {bulkAssignMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground mr-2" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Selected Channels"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ChannelDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        channel={editingChannel}
        onSuccess={handleCloseDialog}
      />
    </div>
  );
}