"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useChannelVideoWorkspace } from "@/contexts/ChannelVideoWorkspaceContext";

interface ChannelWorkspaceToolbarProps {
  channelName: string;
}

export function ChannelWorkspaceToolbar({ channelName }: ChannelWorkspaceToolbarProps) {
  const { openSearchModal } = useChannelVideoWorkspace();

  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-gray-900">
          Channel: {channelName}
        </h1>
      </div>
      <Button
        onClick={openSearchModal}
        className="gap-2"
      >
        <Search className="h-4 w-4" />
        Fetch Videos from YouTube
      </Button>
    </div>
  );
}