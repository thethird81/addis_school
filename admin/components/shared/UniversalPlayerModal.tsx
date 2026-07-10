"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { VideoData } from "@/components/shared/VideoCard";
import { X, Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface UniversalPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoData | null;
  playlist: VideoData[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onToggleSelection: (videoId: string) => void;
  isSelected: boolean;
  isStaged: boolean;
}

export function UniversalPlayerModal({
  isOpen,
  onClose,
  video,
  playlist,
  currentIndex,
  onPrev,
  onNext,
  onToggleSelection,
  isSelected,
  isStaged,
}: UniversalPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [playerId, setPlayerId] = useState<string>('');

  // Update player ID and force remount when video changes
  useEffect(() => {
    if (video) {
      setPlayerId('yt-player-' + video.videoId);
      setPlayerKey(prev => prev + 1);
    }
  }, [video]);

  // Handle video navigation (next/prev) by loading new video
  useEffect(() => {
    if (video && playerRef.current && typeof playerRef.current.loadVideoById === 'function' && !isInitializingRef.current) {
      try {
        playerRef.current.loadVideoById(video.videoId);
        setIsPlaying(true);
        return;
      } catch (e) {
        // Fall through to reinitialization
      }
    }
  }, [video, playerKey]);

  // Track initialization to prevent double initialization
  const isInitializingRef = useRef(false);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!isOpen || !video || !playerId) return;

    isInitializingRef.current = false;

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        if (!isInitializingRef.current) {
          isInitializingRef.current = true;
          initializePlayer();
        }
      };
    } else {
      // Wait for DOM element to be ready, then initialize
      const timer = setTimeout(() => {
        if (!isInitializingRef.current) {
          isInitializingRef.current = true;
          initializePlayer();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Player might already be destroyed
        }
        playerRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, [isOpen, video, playerId]);

  const initializePlayer = () => {
    if (!video || !window.YT || !playerId) return;

    try {
      // Find the element - it should have the playerId as its ID
      const element = document.getElementById(playerId);
      if (!element) {
        console.error('Player element not found:', playerId);
        return;
      }

      playerRef.current = new window.YT.Player(playerId, {
        videoId: video.videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration());
            event.target.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
    }
  };

  // Update time slider periodically
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlayPause = () => {
    if (!playerRef.current || !playerRef.current.playVideo) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!playerRef.current) return;
    const newTime = value[0];
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.stopVideo === 'function') {
          playerRef.current.stopVideo();
        }
        if (typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch (e) {
        // Player might already be destroyed or not fully initialized
      }
      playerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    onClose();
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-semibold line-clamp-2">{video.title}</h2>
              {video.channelTitle && (
                <p className="text-sm text-gray-600">{video.channelTitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(video.videoId)}
                  aria-label="Select video"
                />
                <span className="text-sm text-gray-600">
                  {isSelected ? "Selected" : "Not Selected"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Video Container */}
        <div className="relative w-full bg-black aspect-video mx-6 rounded-lg overflow-hidden" key={playerKey}>
          <div 
            id={playerId}
            ref={iframeRef} 
            className="absolute inset-0 w-full h-full" 
          />
        </div>

        {/* Control Dashboard */}
        <div className="px-6 py-4 space-y-4 bg-gray-50">
          {/* Timeline / Seek Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek([parseFloat(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {currentIndex + 1} / {playlist.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                disabled={playlist.length <= 1}
                className="gap-1"
              >
                <SkipBack className="h-4 w-4" />
                Previous
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={togglePlayPause}
                className="gap-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Play
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={playlist.length <= 1}
                className="gap-1"
              >
                Next
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {isStaged ? "Staged" : "Live"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}