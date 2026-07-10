"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";

export function WorkspaceToolbar() {
  const { activeLesson, openSearchModal } = useVideoWorkspace();

  const getBreadcrumbText = () => {
    if (!activeLesson) {
      return "Select a lesson to manage videos";
    }

    const parts = [activeLesson.gradeName];
    if (activeLesson.subjectName) parts.push(activeLesson.subjectName);
    if (activeLesson.contentName) parts.push(activeLesson.contentName);
    parts.push(activeLesson.subcontentName);

    return parts.join(" > ");
  };

  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-gray-900">
          {getBreadcrumbText()}
        </h1>
      </div>
      <Button 
        onClick={openSearchModal}
        className="gap-2"
      >
        <Search className="h-4 w-4" />
        Fetch New Videos from Source
      </Button>
    </div>
  );
}