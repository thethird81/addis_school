"use client";

import { useState } from "react";
import { useReportedVideos, useDeleteReportedVideo, useResolveReport } from "@/hooks/use-admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, CheckCircle, Eye } from "lucide-react";

export default function ReportedVideosPage() {
  const { data: reportedVideos = [], isLoading } = useReportedVideos();
  const deleteMutation = useDeleteReportedVideo();
  const resolveMutation = useResolveReport();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleDelete = async (videoId: string) => {
    if (!confirm("Delete this reported video permanently?")) return;
    try {
      await deleteMutation.mutateAsync(videoId);
      toast.success("Video deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete video");
    }
  };

  const handleResolve = async (videoId: string) => {
    try {
      await resolveMutation.mutateAsync(videoId);
      toast.success("Report resolved");
    } catch (error: any) {
      toast.error(error.message || "Failed to resolve report");
    }
  };

  const getThumbnailUrl = (thumbnails: any) => {
    if (!thumbnails) return "https://via.placeholder.com/400x225";
    if (typeof thumbnails === "object") {
      return thumbnails.high || thumbnails.medium || thumbnails.default || thumbnails.url || "https://via.placeholder.com/400x225";
    }
    return thumbnails;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}:${remainMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reported Videos</h1>
        <p className="text-muted-foreground">Review and manage reported video content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reported Videos ({reportedVideos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reported videos...</div>
          ) : reportedVideos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No reported videos</p>
              <p className="text-sm">All clear!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reportedVideos.map((video: any) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={getThumbnailUrl(video.thumbnails)}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                    <p className="text-sm text-muted-foreground mb-1">{video.channel_title || "Unknown Channel"}</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Reported by: {video.reported_by} {video.grade_name && `(${video.grade_name})`}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVideo(video);
                          setShowVideoModal(true);
                        }}
                        className="flex-1"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleResolve(video.id)}
                        disabled={resolveMutation.isPending}
                        className="flex-1"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(video.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{selectedVideo.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <img
                src={getThumbnailUrl(selectedVideo.thumbnails)}
                alt={selectedVideo.title}
                className="w-full h-64 object-cover rounded"
              />
              <div className="space-y-2">
                <p><strong>Channel:</strong> {selectedVideo.channel_title || "Unknown"}</p>
                <p><strong>Duration:</strong> {formatDuration(selectedVideo.duration)}</p>
                <p><strong>Reported By:</strong> {selectedVideo.reported_by} {selectedVideo.grade_name && `(${selectedVideo.grade_name})`}</p>
                <p><strong>Reported At:</strong> {new Date(selectedVideo.reported_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleResolve(selectedVideo.id)}
                  disabled={resolveMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve Report
                </Button>
                <Button
                  onClick={() => handleDelete(selectedVideo.id)}
                  disabled={deleteMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Video
                </Button>
                <Button onClick={() => setShowVideoModal(false)} variant="secondary">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}