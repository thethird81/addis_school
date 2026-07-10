"use client";

import { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/shared/VideoCard";
import { UniversalPlayerModal } from "@/components/shared/UniversalPlayerModal";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";
import { Trash2 } from "lucide-react";

export function LiveVideoZone() {
  const {
    liveVideos,
    liveLoading,
    liveError,
    selectedLiveIds,
    selectAllLive,
    clearLiveSelection,
    toggleLiveSelection,
    deleteVideoAssignment,
    bulkDeleteVideoAssignments,
    fetchLiveVideos,
    activeLesson,
    // Playback state
    activeVideoId,
    isOpenPlayerModal,
    activePlaybackList,
    activePlaybackIndex,
    isPlaybackFromStaged,
    // Playback actions
    openPlayerModal,
    closePlayerModal,
    playNextVideo,
    playPreviousVideo,
    togglePlayerSelection,
  } = useVideoWorkspace();

  const allSelected = useMemo(
    () => liveVideos.length > 0 && selectedLiveIds.size === liveVideos.length,
    [liveVideos, selectedLiveIds]
  );

  // Fetch live videos when active lesson changes
  useEffect(() => {
    if (activeLesson?.subcontentId) {
      fetchLiveVideos(activeLesson.subcontentId);
    }
  }, [activeLesson?.subcontentId, fetchLiveVideos]);

  const handleSelectAll = () => {
    if (allSelected) {
      clearLiveSelection();
    } else {
      selectAllLive();
    }
  };

  const handleBulkDelete = async () => {
    const videoIds = liveVideos
      .filter(v => selectedLiveIds.has(v.videoId))
      .map(v => v.videoId);
    
    if (videoIds.length > 0) {
      await bulkDeleteVideoAssignments(videoIds);
    }
  };

  const handlePlayVideo = (video: import("@/components/shared/VideoCard").VideoData) => {
    openPlayerModal(video.videoId, liveVideos, false);
  };

  if (!activeLesson) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No Lesson Selected</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select a subcontent from the curriculum tree to view and manage videos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Live Database Entries</h2>
          <span className="text-sm text-gray-500">
            {liveVideos.length} video{liveVideos.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="gap-1"
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300"
            />
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={selectedLiveIds.size === 0}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Bulk Delete Selected ({selectedLiveIds.size})
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {liveError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {liveError}
        </div>
      )}

      {/* Loading State */}
      {liveLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-sm text-gray-500">Loading videos...</div>
        </div>
      )}

      {/* Empty State */}
      {!liveLoading && liveVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Videos Yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Use the "Fetch New Videos" button to search and add videos to this lesson
          </p>
        </div>
      )}

      {/* Video Grid */}
      {!liveLoading && liveVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveVideos.map((video) => (
            <VideoCard
              key={video.assignmentId || video.videoId}
              video={video}
              isStaged={false}
              isSelected={selectedLiveIds.has(video.videoId)}
              showCheckbox={true}
              onSelect={toggleLiveSelection}
              onDelete={async (videoId, assignmentId) => {
                if (assignmentId) {
                  await deleteVideoAssignment(assignmentId);
                }
              }}
              onPlayVideo={handlePlayVideo}
            />
          ))}
        </div>
      )}

      {/* Universal Player Modal */}
      <UniversalPlayerModal
        isOpen={isOpenPlayerModal && !isPlaybackFromStaged}
        onClose={closePlayerModal}
        video={activePlaybackList[activePlaybackIndex] || null}
        playlist={activePlaybackList}
        currentIndex={activePlaybackIndex}
        onPrev={playPreviousVideo}
        onNext={playNextVideo}
        onToggleSelection={togglePlayerSelection}
        isSelected={activeVideoId ? selectedLiveIds.has(activeVideoId) : false}
        isStaged={false}
      />
    </div>
  );
}