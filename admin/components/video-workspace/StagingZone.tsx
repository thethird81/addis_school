"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/shared/VideoCard";
import { UniversalPlayerModal } from "@/components/shared/UniversalPlayerModal";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";
import { Loader2, Trash2, Save } from "lucide-react";

export function StagingZone() {
  const {
    stagedVideos,
    stagedLoading,
    stagedError,
    selectedStagedIds,
    selectAllStaged,
    clearStagedSelection,
    toggleStagedSelection,
    removeFromStaging,
    commitStaging,
    // Search state
    searchResults,
    searchLoading,
    saveSearchResults,
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
    () => stagedVideos.length > 0 && selectedStagedIds.size === stagedVideos.length,
    [stagedVideos, selectedStagedIds]
  );

  const handleSelectAll = () => {
    if (allSelected) {
      clearStagedSelection();
    } else {
      selectAllStaged();
    }
  };

  const handleBulkRemove = () => {
    selectedStagedIds.forEach((videoId) => removeFromStaging(videoId));
    clearStagedSelection();
  };

  const handleCommit = async () => {
    await commitStaging();
  };

  // Determine which videos to show (search results take precedence)
  const displayVideos = searchResults.length > 0 ? searchResults : stagedVideos;
  const selectedIds = searchResults.length > 0 ? new Set() : selectedStagedIds;

  const handlePlayVideo = (video: import("@/components/shared/VideoCard").VideoData) => {
    openPlayerModal(video.videoId, displayVideos, true);
  };

  // Show staging zone if there are staged videos or search results or loading
  const hasContentToShow = stagedVideos.length > 0 || searchResults.length > 0 || searchLoading;
  if (!hasContentToShow) {
    return null;
  }

  // Show searching indicator
  if (searchLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Searching... Please wait</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {searchResults.length > 0 ? "Search Results" : "Staging Buffer"}
          </h2>
          <span className="text-sm text-gray-500">
            {displayVideos.length} video{displayVideos.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {searchResults.length > 0 ? (
            <>
              <Button
                size="sm"
                onClick={saveSearchResults}
                disabled={searchLoading}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                {searchLoading ? "Saving..." : "Save to Database"}
              </Button>
            </>
          ) : (
            <>
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
                onClick={handleBulkRemove}
                disabled={selectedStagedIds.size === 0}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Remove Selected ({selectedStagedIds.size})
              </Button>
              <Button
                size="sm"
                onClick={handleCommit}
                disabled={stagedLoading || stagedVideos.length === 0}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                {stagedLoading ? "Committing..." : "Commit to Database"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {(stagedError || stagedError) && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {stagedError}
        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayVideos.map((video) => (
          <VideoCard
            key={video.videoId}
            video={video}
            isStaged={searchResults.length > 0}
            isSelected={selectedIds.has(video.videoId)}
            showCheckbox={searchResults.length === 0}
            onSelect={searchResults.length > 0 ? () => {} : toggleStagedSelection}
            onRemove={searchResults.length > 0 ? () => {} : removeFromStaging}
            onPlayVideo={handlePlayVideo}
          />
        ))}
      </div>

      {/* Universal Player Modal */}
      <UniversalPlayerModal
        isOpen={isOpenPlayerModal && isPlaybackFromStaged}
        onClose={closePlayerModal}
        video={activePlaybackList[activePlaybackIndex] || null}
        playlist={activePlaybackList}
        currentIndex={activePlaybackIndex}
        onPrev={playPreviousVideo}
        onNext={playNextVideo}
        onToggleSelection={togglePlayerSelection}
        isSelected={activeVideoId ? selectedStagedIds.has(activeVideoId) : false}
        isStaged={true}
      />
    </div>
  );
}
