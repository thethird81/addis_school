"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { VideoData } from "@/components/shared/VideoCard";
import { useChannelVideoWorkspace } from "@/contexts/ChannelVideoWorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";

export function ChannelSearchModal() {
  const { 
    isSearchModalOpen, 
    closeSearchModal, 
    channelId,
    updateSearchResults 
  } = useChannelVideoWorkspace();
  const { currentUser, getToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [videoType, setVideoType] = useState<"" | "advert" | "curricular">("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    // Authorization check: Only admins can search videos
    if (currentUser?.role !== "admin") {
      alert("Unauthorized - Admin access required");
      return;
    }

    if (!channelId || !videoType) return;

    setIsSearching(true);
    try {
      const token = getToken();

      const body: Record<string, any> = {
        type: videoType,
        isAdvert: videoType === "advert"
      };
      // Query is optional — only include if provided
      if (searchQuery.trim()) {
        body.query = searchQuery;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"}/admin/youtube/channel/${channelId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Search error:', response.status, errorMessage);
        throw new Error(`Failed to search videos: ${errorMessage}`);
      }

      const data = await response.json();

      // Transform YouTube results to VideoData format
      const transformedResults: VideoData[] = data.map((item: any) => ({
        videoId: item.videoId,
        title: item.title,
        thumbnails: item.thumbnails,
        channelTitle: item.channelTitle,
        channelId: item.channelId,
        duration: item.duration || 0,
        viewCount: item.viewCount || 0,
        publishedAt: item.publishedAt,
      }));

      // Update search results in context
      updateSearchResults(transformedResults);

      // Close modal immediately on success
      closeSearchModal();
    } catch (err) {
      console.error("Search error:", err);
      alert(err instanceof Error ? err.message : "Failed to search videos. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setVideoType("");
    closeSearchModal();
  };

  const canSearch = videoType !== "";

  return (
    <Dialog open={isSearchModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fetch Videos from YouTube</DialogTitle>
          <DialogDescription>
            Search for videos in this channel to add to the database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Video Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Video Type <span className="text-destructive">*</span>
            </label>
            <select
              value={videoType}
              onChange={(e) => setVideoType(e.target.value as "" | "advert" | "curricular")}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select video type...</option>
              <option value="advert">Advert (short videos)</option>
              <option value="curricular">Curricular (medium/long videos)</option>
            </select>
          </div>

          {/* Search Input — optional */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Search Query <span className="text-muted-foreground">(optional)</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Leave empty to fetch all recent videos..."
                onKeyDown={(e) => e.key === "Enter" && canSearch && handleSearch()}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !canSearch || currentUser?.role !== "admin"}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isSearching ? "Searching..." : "Run Search"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}