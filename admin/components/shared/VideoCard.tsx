"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Play } from "lucide-react";
import Image from "next/image";

export type VideoContext = "curriculum" | "channel" | "reported";

export interface VideoData {
  videoId: string;
  title: string;
  thumbnails: {
    high?: string;
    medium?: string;
    default?: string;
  };
  channelTitle?: string;
  duration: number;
  viewCount?: string | number;
  publishedAt?: string;
  channelId?: string;
  assignmentId?: string; // For database videos - needed for deletion
}

interface VideoCardProps {
  video: VideoData;
  context?: VideoContext;
  isStaged?: boolean;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onSelect?: (videoId: string, selected: boolean) => void;
  onRemove?: (videoId: string) => void; // For staged videos
  onDelete?: (videoId: string, assignmentId?: string) => void; // For database videos
  onPlayVideo?: (video: VideoData) => void; // Callback to open player modal
  className?: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViewCount(count?: string | number): string {
  if (!count) return "0";
  const numCount = typeof count === 'string' ? parseInt(count, 10) : count;
  if (isNaN(numCount)) return "0";

  if (numCount >= 1000000) {
    return `${(numCount / 1000000).toFixed(1)}M`;
  }
  if (numCount >= 1000) {
    return `${(numCount / 1000).toFixed(1)}K`;
  }
  return numCount.toString();
}

function getThumbnailUrl(thumbnails?: VideoData['thumbnails']): string {
  if (!thumbnails) return "/placeholder-video.png";

  return (
    thumbnails.high ||
    thumbnails.medium ||
    thumbnails.default ||
    "/placeholder-video.png"
  );
}

export function VideoCard({
  video,
  context = "curriculum",
  isStaged = false,
  isSelected = false,
  showCheckbox = true,
  onSelect,
  onRemove,
  onDelete,
  onPlayVideo,
  className = "",
}: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = getThumbnailUrl(video.thumbnails);

  const handleCheckboxChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(video.videoId, checked);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(video.videoId);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(video.videoId, video.assignmentId);
    }
  };

  const handleThumbnailClick = () => {
    if (onPlayVideo) {
      onPlayVideo(video);
    }
  };

  const getActionButton = () => {
    const handleAction = isStaged ? handleRemove : handleDelete;
    const label = isStaged ? "Remove" : "Delete";

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleAction}
        aria-label={label}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${className}`}>
      {/* 1. Thumbnail Container - centered horizontally, flush to the top edge, with overlays */}
      <div className="flex justify-center">
        <div
          className="relative aspect-video w-full max-w-full cursor-pointer overflow-hidden bg-gray-100"
          onClick={handleThumbnailClick}
        >
          {!imageError ? (
            <Image
              src={thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-900">
              <Play className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Overlay: duration bottom-left, view count bottom-right */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-1.5">
            <span className="rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
              {formatDuration(video.duration)}
            </span>
            {video.viewCount && (
              <span className="rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                {formatViewCount(video.viewCount)} views
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Content & Controls Layout */}
      <div className="flex items-start gap-3 p-3">
        {/* Far Left: Checkbox */}
        {showCheckbox && (
          <div className="flex items-center pt-0.5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              aria-label={`Select ${video.title}`}
            />
          </div>
        )}

        {/* Center: Main information section with graceful truncation */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">
            {video.title}
          </h3>
          {video.channelTitle && (
            <p className="truncate text-xs text-gray-600">
              {video.channelTitle}
            </p>
          )}
        </div>

        {/* Far Right: Delete icon button */}
        <div className="flex flex-shrink-0 items-center pt-0.5">
          {getActionButton()}
        </div>
      </div>
    </Card>
  );
}