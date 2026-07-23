"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { VideoData } from "@/components/shared/VideoCard";
import { useChannelVideoWorkspace } from "@/contexts/ChannelVideoWorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";

export function ChannelSearchModal() {
  const { 
    isSearchModalOpen, 
    closeSearchModal, 
    channelId,
    channelName,
    updateSearchResults 
  } = useChannelVideoWorkspace();
  const { currentUser, getToken } = useAuth();
  
  const [fetchMethod, setFetchMethod] = useState<"latest" | "popular" | "keyword">("latest");
  const [query, setQuery] = useState("");
  const [duration, setDuration] = useState<string | null>(null);
  const [maxResults, setMaxResults] = useState(50);
  const [isFetching, setIsFetching] = useState(false);

  const handleFetch = async () => {
    // Authorization check: Only admins can search videos
    if (currentUser?.role !== "admin") {
      alert("Unauthorized - Admin access required");
      return;
    }

    if (!channelId) return;

    setIsFetching(true);
    try {
      const token = getToken();
      
      // Prepare request body
      const requestBody: any = {
        type: fetchMethod,
        duration,
        maxResults
      };

      // Only include query for keyword search
      if (fetchMethod === "keyword") {
        requestBody.query = query.trim();
      } else {
        requestBody.query = "";
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"}/admin/youtube/channel/${channelId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody),
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
        throw new Error(`Failed to fetch videos: ${errorMessage}`);
      }

      const data = await response.json();

      // Transform to VideoData format
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
      console.error("Fetch error:", err);
      alert(err instanceof Error ? err.message : "Failed to fetch videos. Please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleClose = () => {
    setFetchMethod("latest");
    setQuery("");
    setDuration(null);
    setMaxResults(50);
    closeSearchModal();
  };

  const isKeywordSearch = fetchMethod === "keyword";

  return (
    <Dialog open={isSearchModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fetch Videos from YouTube</DialogTitle>
          <DialogDescription>
            {channelName && (
              <span className="font-medium text-foreground">
                Channel: {channelName}
              </span>
            )}
            {channelId && (
              <span className="text-xs text-muted-foreground ml-2">
                (ID: {channelId})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto">
          {/* Fetch Method Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Fetch Method
            </label>
            <Select value={fetchMethod} onValueChange={setFetchMethod as any}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select fetch method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest Uploads</SelectItem>
                <SelectItem value="popular">Popular Videos (by view count)</SelectItem>
                <SelectItem value="keyword">Keyword Search</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Query - only shown for Keyword Search */}
          {isKeywordSearch && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Search Query <span className="text-muted-foreground">(required)</span>
              </label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter search query..."
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                className="flex-1"
                required
              />
            </div>
          )}

          {/* Target Duration Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Target Duration <span className="text-muted-foreground">(optional)</span>
            </label>
            <Select value={duration ?? "all"} onValueChange={(value) => setDuration(value === "all" ? null : value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                <SelectItem value="short">Short (&lt; 4 mins)</SelectItem>
                <SelectItem value="medium">Medium (4-20 mins)</SelectItem>
                <SelectItem value="long">Long (&gt; 20 mins)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Results */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Max Results
            </label>
            <Select value={maxResults.toString()} onValueChange={(value) => setMaxResults(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select max results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 videos</SelectItem>
                <SelectItem value="25">25 videos</SelectItem>
                <SelectItem value="50">50 videos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button 
            onClick={handleFetch} 
            disabled={isFetching || (isKeywordSearch && !query.trim()) || currentUser?.role !== "admin"}
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Fetch Videos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
