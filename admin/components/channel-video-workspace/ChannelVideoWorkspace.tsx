"use client";

import { ChannelWorkspaceToolbar } from "./ChannelWorkspaceToolbar";
import { ChannelStagingZone } from "./ChannelStagingZone";
import { ChannelLiveVideoZone } from "./ChannelLiveVideoZone";
import { ChannelSearchModal } from "./ChannelSearchModal";
import { ChannelAssignmentGuardrailModal } from "./ChannelAssignmentGuardrailModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useChannelVideoWorkspace } from "@/contexts/ChannelVideoWorkspaceContext";

interface ChannelVideoWorkspaceProps {
  channelId: string;
  channelName: string;
}

export function ChannelVideoWorkspace({ channelId, channelName }: ChannelVideoWorkspaceProps) {
  const { isConfirmDialogOpen, confirmDialogConfig, closeConfirmDialog } = useChannelVideoWorkspace();
  const { stagedVideos, searchResults } = useChannelVideoWorkspace();

  // Determine which zone to show (exclusive visibility)
  const showStagingZone = stagedVideos.length > 0 || searchResults.length > 0;
  const showLiveZone = !showStagingZone;
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <ChannelWorkspaceToolbar channelName={channelName} />
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Zone A: Staging Buffer - Only shown when there are staged or search results */}
        {showStagingZone && <ChannelStagingZone />}
        
        {/* Zone B: Live Database Entries - Only shown when no staged/search results */}
        {showLiveZone && <ChannelLiveVideoZone />}
      </div>

      {/* Modals */}
      <ChannelSearchModal />
      <ChannelAssignmentGuardrailModal />
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
