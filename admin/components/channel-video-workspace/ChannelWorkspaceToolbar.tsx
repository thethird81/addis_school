"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useChannelVideoWorkspace } from "@/contexts/ChannelVideoWorkspaceContext";

interface ChannelWorkspaceToolbarProps {
  channelName: string;
}

export function ChannelWorkspaceToolbar({ channelName }: ChannelWorkspaceToolbarProps) {
  const { checkAndOpenSearchModal, assignmentCheckLoading } = useChannelVideoWorkspace();

  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-gray-900">
          Channel: {channelName}
        </h1>
      </div>
      <Button
        onClick={checkAndOpenSearchModal}
        disabled={assignmentCheckLoading}
        className="gap-2"
      >
        {assignmentCheckLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            Checking...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Fetch Videos from YouTube
          </>
        )}
      </Button>
    </div>
  );
}