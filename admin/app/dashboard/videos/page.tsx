"use client";

import { VideoWorkspaceProvider } from "@/contexts/VideoWorkspaceContext";
import { CurriculumDropdowns } from "@/components/video-workspace/CurriculumDropdowns";
import { WorkspaceToolbar } from "@/components/video-workspace/WorkspaceToolbar";
import { StagingZone } from "@/components/video-workspace/StagingZone";
import { LiveVideoZone } from "@/components/video-workspace/LiveVideoZone";
import { SearchModal } from "@/components/video-workspace/SearchModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";

function VideoWorkspaceContent() {
  const { isConfirmDialogOpen, confirmDialogConfig, closeConfirmDialog } = useVideoWorkspace();

  return (
    <div className="flex min-h-screen w-full">
      {/* Main Workspace Area - Full Width */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header with Dropdowns and Toolbar */}
          <div className="flex items-center justify-between border-b pb-4">
            <CurriculumDropdowns />
            <WorkspaceToolbar />
          </div>
          
          <div className="mt-6 space-y-6">
            {/* Zone A: Staging Buffer */}
            <StagingZone />
            
            {/* Zone B: Live Database Entries */}
            <LiveVideoZone />
          </div>
        </div>
      </main>

      {/* Modals */}
      <SearchModal />
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={closeConfirmDialog}
        onConfirm={() => {
          if (confirmDialogConfig?.onConfirm) {
            confirmDialogConfig.onConfirm();
          }
        }}
        title={confirmDialogConfig?.title || ""}
        message={confirmDialogConfig?.message || ""}
        confirmText={confirmDialogConfig?.confirmText}
        variant={confirmDialogConfig?.variant}
      />
    </div>
  );
}

export default function VideosPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // Authorization check: Only admins can access video workspace
  if (!loading && currentUser?.role !== "admin") {
    // Redirect non-admin users
    router.replace("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <VideoWorkspaceProvider>
        <VideoWorkspaceContent />
        <Toaster />
      </VideoWorkspaceProvider>
    </TooltipProvider>
  );
}
