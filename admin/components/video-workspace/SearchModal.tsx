"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { VideoData } from "@/components/shared/VideoCard";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";

export function SearchModal() {
  const { isSearchModalOpen, closeSearchModal, activeLesson, updateSearchResults } = useVideoWorkspace();
  const { currentUser, getToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isSearchModalOpen && activeLesson) {
      const defaultQuery = `${activeLesson.gradeName} ${activeLesson.subcontentName}`;
      setSearchQuery(defaultQuery);
    }
  }, [isSearchModalOpen, activeLesson]);

  const handleSearch = async () => {
    // Authorization check: Only admins can search videos
    if (currentUser?.role !== "admin") {
      alert("Unauthorized - Admin access required");
      return;
    }

    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const token = getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/youtube/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ searchTerm: searchQuery }),
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Response is not JSON, use status text
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
      
      // Update search results in context - StagingZone will automatically display them
      updateSearchResults(transformedResults);
      
      // Close modal immediately on success
      closeSearchModal();
    } catch (err) {
      console.error("Search error:", err);
      // Show error to user
      alert(err instanceof Error ? err.message : "Failed to search videos. Please try again.");
      // Don't close modal on error so user can retry
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    closeSearchModal();
  };

  return (
    <Dialog open={isSearchModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fetch Videos from Source</DialogTitle>
          <DialogDescription>
            Search YouTube for videos to curate for this lesson
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim() || currentUser?.role !== "admin"}
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
