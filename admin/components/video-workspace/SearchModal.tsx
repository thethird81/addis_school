"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Info } from "lucide-react";
import { VideoData } from "@/components/shared/VideoCard";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";

export function SearchModal() {
  const { isSearchModalOpen, closeSearchModal, activeLesson, updateSearchResults } = useVideoWorkspace();
  const { currentUser, getToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDurations, setSelectedDurations] = useState<string[]>(['medium', 'long']);
  const [maxResults, setMaxResults] = useState(25);
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
          body: JSON.stringify({ 
            searchTerm: searchQuery,
            durations: selectedDurations 
          }),
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
    setSelectedDurations(['medium', 'long']);
    setMaxResults(25);
    closeSearchModal();
  };

  const canSearch = searchQuery.trim() && currentUser?.role === "admin";

  return (
    <Dialog open={isSearchModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fetch Videos from Source</DialogTitle>
          <DialogDescription>
            Search YouTube for videos to curate for this lesson
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Search Query <span className="text-destructive">*</span>
            </label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query..."
              onKeyDown={(e) => e.key === "Enter" && canSearch && handleSearch()}
              className="flex-1"
            />
          </div>

          {/* Target Durations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Target Durations <span className="text-muted-foreground">(optional)</span>
              </label>
            </div>
            
            {/* Info Tooltip */}
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs">
                Selecting no checkboxes or all checkboxes runs a single efficient search. 
                Selecting 1 or 2 specific boxes triggers parallel searches targeting those exact lengths.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="duration-short"
                  checked={selectedDurations.includes('short')}
                  onCheckedChange={(checked) => {
                    setSelectedDurations(prev => 
                      checked 
                        ? [...prev, 'short']
                        : prev.filter(d => d !== 'short')
                    );
                  }}
                />
                <label
                  htmlFor="duration-short"
                  className="text-sm font-medium leading-none"
                >
                  Short (&lt; 4 mins)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="duration-medium"
                  checked={selectedDurations.includes('medium')}
                  onCheckedChange={(checked) => {
                    setSelectedDurations(prev => 
                      checked 
                        ? [...prev, 'medium']
                        : prev.filter(d => d !== 'medium')
                    );
                  }}
                />
                <label
                  htmlFor="duration-medium"
                  className="text-sm font-medium leading-none"
                >
                  Medium (4-20 mins)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="duration-long"
                  checked={selectedDurations.includes('long')}
                  onCheckedChange={(checked) => {
                    setSelectedDurations(prev => 
                      checked 
                        ? [...prev, 'long']
                        : prev.filter(d => d !== 'long')
                    );
                  }}
                />
                <label
                  htmlFor="duration-long"
                  className="text-sm font-medium leading-none"
                >
                  Long (&gt; 20 mins)
                </label>
              </div>
            </div>
          </div>

          {/* Max Results */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Max Results
            </label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="10">10 videos</option>
              <option value="25">25 videos</option>
              <option value="50">50 videos</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !canSearch}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Search
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
