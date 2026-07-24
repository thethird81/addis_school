"use client";

import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/shared/VideoCard";
import { UniversalPlayerModal } from "@/components/shared/UniversalPlayerModal";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";
import { Loader2, Trash2, Save, X } from "lucide-react";

export function StagingZone() {
  const {
    stagedVideos,
    stagedLoading,
    stagedError,
    removeFromStaging,
    clearStaging,
    bulkRemoveFromStaging,
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

  // ---------- LOCAL SELECTION STATE ----------
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  // Track video IDs currently fading out before removal
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const allSelected = useMemo(
    () =>
      stagedVideos.length > 0 &&
      selectedVideoIds.length === stagedVideos.length,
    [stagedVideos.length, selectedVideoIds.length]
  );

  // ---------- SELECTION HANDLERS ----------
  const toggleSelection = useCallback((videoId: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedVideoIds([]);
    } else {
      setSelectedVideoIds(stagedVideos.map((v) => v.videoId));
    }
  }, [allSelected, stagedVideos]);

  // ---------- REMOVAL HANDLERS (LOCAL-ONLY, NO API CALLS) ----------
  const handleRemove = useCallback((videoId: string) => {
    // Start fade-out animation
    setRemovingIds((prev) => new Set(prev).add(videoId));

    setTimeout(() => {
      removeFromStaging(videoId);
      setSelectedVideoIds((prev) => prev.filter((id) => id !== videoId));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }, 250);
  }, [removeFromStaging]);

  const handleBulkRemove = useCallback(() => {
    const idsToRemove = [...selectedVideoIds];

    // Start fade-out on selected cards
    setRemovingIds(new Set(selectedVideoIds));

    setTimeout(() => {
      bulkRemoveFromStaging(idsToRemove);
      setSelectedVideoIds([]);
      setRemovingIds(new Set());
    }, 250);
  }, [selectedVideoIds, bulkRemoveFromStaging]);

  const handleBulkRemoveAll = useCallback(() => {
    // Start fade-out on all cards
    setRemovingIds(new Set(stagedVideos.map((v) => v.videoId)));

    setTimeout(() => {
      clearStaging();
      setSelectedVideoIds([]);
      setRemovingIds(new Set());
    }, 250);
  }, [stagedVideos, clearStaging]);

  const handleCommit = async () => {
    await commitStaging();
  };

  // ---------- PLAYBACK ----------
  const displayVideos =
    searchResults.length > 0 ? searchResults : stagedVideos;

  const handlePlayVideo = (
    video: import("@/components/shared/VideoCard").VideoData
  ) => {
    openPlayerModal(video.videoId, displayVideos, true);
  };

  // ---------- RENDER ----------
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

  if (stagedVideos.length === 0 && searchResults.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold">Staging Buffer</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-gray-500">
            No videos staged. Fetch some videos above to start.
          </p>
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
                variant="destructive"
                size="sm"
                onClick={handleBulkRemove}
                disabled={selectedVideoIds.length === 0}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedVideoIds.length})
              </Button>
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
                disabled={selectedVideoIds.length === 0}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedVideoIds.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkRemoveAll}
                disabled={stagedVideos.length === 0}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Bulk Remove All
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
      {stagedError && (
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
            isStaged={true}
            isSelected={selectedVideoIds.includes(video.videoId)}
            showCheckbox={true}
            onSelect={(videoId) => toggleSelection(videoId)}
            onRemove={handleRemove}
            onPlayVideo={handlePlayVideo}
            className={
              removingIds.has(video.videoId)
                ? "opacity-0 scale-95 transition-all duration-300 ease-in-out"
                : "opacity-100 transition-all duration-300 ease-in-out"
            }
          />
        ))}
      </div>

      {/* Universal Player Modal */}
      {isOpenPlayerModal && isPlaybackFromStaged && (
        <UniversalPlayerModal
          isOpen={true}
          onClose={closePlayerModal}
          video={activePlaybackList[activePlaybackIndex] || null}
          playlist={activePlaybackList}
          currentIndex={activePlaybackIndex}
          onPrev={playPreviousVideo}
          onNext={playNextVideo}
          onToggleSelection={togglePlayerSelection}
          isSelected={
            activeVideoId
              ? selectedVideoIds.includes(activeVideoId)
              : false
          }
          isStaged={true}
        />
      )}
    </div>
  );
}