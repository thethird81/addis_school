"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { VideoData } from '@/components/shared/VideoCard';
import { useAuth } from '@/contexts/AuthContext';

interface ChannelVideoWorkspaceState {
  // Active channel
  channelId: string | null;
  channelName: string | null;
  
  // Staged videos (pending save)
  stagedVideos: VideoData[];
  stagedLoading: boolean;
  stagedError: string | null;
  
  // Live database videos
  liveVideos: VideoData[];
  liveLoading: boolean;
  liveError: string | null;
  
  // Selection state
  selectedStagedIds: Set<string>;
  selectedLiveIds: Set<string>;
  
  // Playback state
  activeVideoId: string | null;
  isOpenPlayerModal: boolean;
  activePlaybackList: VideoData[];
  activePlaybackIndex: number;
  
  // UI state
  isSearchModalOpen: boolean;
  isConfirmDialogOpen: boolean;
  confirmDialogConfig: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
  } | null;
  
  // Success notification
  successMessage: string | null;
  
  // Search results
  searchResults: VideoData[];
  searchLoading: boolean;
}

interface ChannelVideoWorkspaceActions {
  // Channel actions
  setChannel: (channelId: string, channelName: string) => void;
  clearChannel: () => void;
  
  // Staged videos actions
  addToStaging: (videos: VideoData[]) => void;
  removeFromStaging: (videoId: string) => void;
  clearStaging: () => void;
  commitStaging: () => Promise<void>;
  
  // Live videos actions
  fetchLiveVideos: (channelId: string) => Promise<void>;
  deleteVideoAssignment: (assignmentId: string) => Promise<void>;
  bulkDeleteVideoAssignments: (videoIds: string[]) => Promise<void>;
  
  // Selection actions
  toggleStagedSelection: (videoId: string) => void;
  toggleLiveSelection: (videoId: string) => void;
  selectAllStaged: () => void;
  selectAllLive: () => void;
  clearStagedSelection: () => void;
  clearLiveSelection: () => void;
  
  // Success notification actions
  clearSuccessMessage: () => void;
  
  // Search actions
  saveSearchResults: () => Promise<void>;
  updateSearchResults: (results: VideoData[]) => void;
  
  // Playback actions
  openPlayerModal: (videoId: string, playlist: VideoData[], isStaged: boolean) => void;
  closePlayerModal: () => void;
  playNextVideo: () => void;
  playPreviousVideo: () => void;
  togglePlayerSelection: () => void;
  
  // Modal actions
  openSearchModal: () => void;
  closeSearchModal: () => void;
  openConfirmDialog: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
  }) => void;
  closeConfirmDialog: () => void;
}

type ChannelVideoWorkspaceContextType = ChannelVideoWorkspaceState & ChannelVideoWorkspaceActions;

const ChannelVideoWorkspaceContext = createContext<ChannelVideoWorkspaceContextType | undefined>(undefined);

export function ChannelVideoWorkspaceProvider({ 
  children, 
  channelId: initialChannelId,
  channelName: initialChannelName
}: { 
  children: ReactNode;
  channelId?: string;
  channelName?: string;
}) {
  const { currentUser, getToken } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
  
  // Active channel
  const [channelId, setChannelId] = useState<string | null>(initialChannelId || null);
  const [channelName, setChannelName] = useState<string | null>(initialChannelName || null);

  // Staged videos
  const [stagedVideos, setStagedVideos] = useState<VideoData[]>([]);
  const [stagedLoading, setStagedLoading] = useState(false);
  const [stagedError, setStagedError] = useState<string | null>(null);
  
  // Live videos
  const [liveVideos, setLiveVideos] = useState<VideoData[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  
  // Selection state
  const [selectedStagedIds, setSelectedStagedIds] = useState<Set<string>>(new Set());
  const [selectedLiveIds, setSelectedLiveIds] = useState<Set<string>>(new Set());
  
  // Playback state
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isOpenPlayerModal, setIsOpenPlayerModal] = useState(false);
  const [activePlaybackList, setActivePlaybackList] = useState<VideoData[]>([]);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState(0);
  
  // Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
  } | null>(null);
  
  // Success notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Search results state
  const [searchResults, setSearchResults] = useState<VideoData[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Function to update search results (called by SearchModal)
  const updateSearchResults = useCallback((results: VideoData[]) => {
    setSearchResults(results);
  }, []);
  
  // Modal actions (defined first since other functions depend on them)
  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);
  
  const closeSearchModal = useCallback(() => {
    setIsSearchModalOpen(false);
  }, []);
  
  const openConfirmDialog = useCallback((config: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
  }) => {
    setConfirmDialogConfig(config);
    setIsConfirmDialogOpen(true);
  }, []);
  
  const closeConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(false);
    setConfirmDialogConfig(null);
  }, []);
  
  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);
  
  // Channel actions
  const setChannel = useCallback((newChannelId: string, newChannelName: string) => {
    setChannelId(newChannelId);
    setChannelName(newChannelName);
    // Clear selections and videos when channel changes
    setSelectedStagedIds(new Set());
    setSelectedLiveIds(new Set());
    setStagedVideos([]);
    setSearchResults([]);
  }, []);
  
  const clearChannel = useCallback(() => {
    setChannelId(null);
    setChannelName(null);
    setLiveVideos([]);
    setStagedVideos([]);
    setSearchResults([]);
  }, []);
  
  // Staged videos actions
  const addToStaging = useCallback((videos: VideoData[]) => {
    setStagedVideos(prev => {
      const existingIds = new Set(prev.map(v => v.videoId));
      const newVideos = videos.filter(v => !existingIds.has(v.videoId));
      return [...prev, ...newVideos];
    });
    setStagedError(null);
  }, []);
  
  const removeFromStaging = useCallback((videoId: string) => {
    setStagedVideos(prev => prev.filter(v => v.videoId !== videoId));
    setSelectedStagedIds(prev => {
      const next = new Set(prev);
      next.delete(videoId);
      return next;
    });
  }, []);
  
  const clearStaging = useCallback(() => {
    setStagedVideos([]);
    setSelectedStagedIds(new Set());
  }, []);
  
  const commitStaging = useCallback(async () => {
    // Authorization check
    if (currentUser?.role !== 'admin') {
      setStagedError('Unauthorized - Admin access required');
      return;
    }
    
    if (stagedVideos.length === 0) return;
    
    setStagedLoading(true);
    setStagedError(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/admin/videos/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videos: stagedVideos.map(v => ({
            id: v.videoId,
            title: v.title,
            channel_title: v.channelTitle,
            thumbnails: v.thumbnails,
            published_at: v.publishedAt,
            channel_id: v.channelId,
            duration: v.duration,
            view_count: v.viewCount,
          })),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save videos');
      
      setStagedVideos([]);
      setSelectedStagedIds(new Set());
    } catch (err) {
      setStagedError(err instanceof Error ? err.message : 'Failed to save videos');
    } finally {
      setStagedLoading(false);
    }
  }, [currentUser?.role, getToken, stagedVideos]);
  
  // Live videos actions
  const fetchLiveVideos = useCallback(async (chId: string) => {
    // Authorization check
    if (currentUser?.role !== 'admin') {
      setLiveError('Unauthorized - Admin access required');
      return;
    }
    
    setLiveLoading(true);
    setLiveError(null);
    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE}/admin/channels/${chId}/videos`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch videos');
      
      // Map backend format to VideoData and deduplicate by videoId
      const data = await response.json();
      const seenIds = new Set<string>();
      const mappedVideos: VideoData[] = [];
      for (const v of data) {
        if (!seenIds.has(v.id)) {
          seenIds.add(v.id);
          mappedVideos.push({
            videoId: v.id,
            title: v.title,
            thumbnails: v.thumbnails,
            channelTitle: v.channel_title,
            channelId: v.channel_id,
            duration: v.duration || 0,
            viewCount: v.viewCount || 0,
            publishedAt: v.published_at,
          });
        }
      }
      
      setLiveVideos(mappedVideos);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLiveLoading(false);
    }
  }, [currentUser?.role, getToken]);
  
  const deleteVideoAssignment = useCallback(async (assignmentId: string) => {
    // Authorization check
    if (currentUser?.role !== 'admin') {
      setLiveError('Unauthorized - Admin access required');
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve) => {
      openConfirmDialog({
        title: "Delete Video Assignment",
        message: "Are you sure you want to delete this video assignment?",
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            // Find the video by assignmentId to get the videoId
            const video = liveVideos.find(v => v.videoId === assignmentId);
            if (!video) {
              throw new Error('Video not found');
            }
            
            const token = getToken();
            const response = await fetch(`${API_BASE}/admin/videos/bulk-ids`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ videoIds: [video.videoId] }),
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete video assignment');
            }
            
            // Remove from list and close modal on success
            setLiveVideos(prev => prev.filter(v => v.videoId !== assignmentId));
            closeConfirmDialog();
            resolve();
          } catch (err) {
            // Show error in the modal
            setLiveError(err instanceof Error ? err.message : 'Failed to delete video');
            // Keep modal open to show the error
            resolve();
          }
        },
      });
    });
  }, [currentUser?.role, getToken, openConfirmDialog, closeConfirmDialog, liveVideos]);
  
  const bulkDeleteVideoAssignments = useCallback(async (videoIds: string[]) => {
    // Authorization check
    if (currentUser?.role !== 'admin') {
      setLiveError('Unauthorized - Admin access required');
      return Promise.resolve();
    }
    
    if (videoIds.length === 0) return;
    
    return new Promise<void>((resolve) => {
      openConfirmDialog({
        title: "Bulk Delete Videos",
        message: `Are you sure you want to permanently delete ${videoIds.length} video(s) from the production database?`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/admin/videos/bulk-ids`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ videoIds }),
            });
            
            if (!response.ok) throw new Error('Failed to delete videos');
            
            // Remove deleted videos from the list
            setLiveVideos(prev => prev.filter(v => !videoIds.includes(v.videoId)));
            setSelectedLiveIds(new Set());
            
            // Close the modal and show success message
            closeConfirmDialog();
            setSuccessMessage(`Successfully deleted ${videoIds.length} video(s)`);
            resolve();
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete videos';
            setLiveError(errorMessage);
            setSuccessMessage(`Error: ${errorMessage}`);
            resolve();
          }
        },
      });
    });
  }, [currentUser?.role, openConfirmDialog, closeConfirmDialog]);
  
  const saveSearchResults = useCallback(async () => {
    // Authorization check
    if (currentUser?.role !== 'admin') {
      setStagedError('Unauthorized - Admin access required');
      return;
    }
    
    if (searchResults.length === 0 || !channelId) return;
    
    // Fetch channel assignments to get grade_id and subject_id
    try {
      const token = getToken();
      const assignmentResponse = await fetch(`${API_BASE}/admin/channels/${channelId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!assignmentResponse.ok) {
        throw new Error('Failed to fetch channel assignments');
      }
      
      const assignments = await assignmentResponse.json();
      
      // Use the first assignment's grade and subject
      const gradeId = assignments[0]?.grades?.id || assignments[0]?.grade_id;
      const subjectId = assignments[0]?.subjects?.id || assignments[0]?.subject_id;
      
      if (!gradeId) {
        throw new Error('No grade assignment found for this channel');
      }
      
      // Save videos using the grade and subject from the channel assignment
      const saveResponse = await fetch(`${API_BASE}/admin/youtube/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videos: searchResults,
          grade_id: gradeId,
          subject_id: subjectId || null,
          content_id: null,
          subcontent_id: null,
        }),
      });
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save videos');
      }
      
      const result = await saveResponse.json();
      
      // Clear search results and staging
      setSearchResults([]);
      setStagedVideos([]);
      setSelectedStagedIds(new Set());
      
      // Show success message
      setSuccessMessage(result.message || `Successfully saved ${searchResults.length} video(s)`);
      
      // Refresh live videos to show the newly added videos
      await fetchLiveVideos(channelId!);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save videos';
      setStagedError(errorMessage);
      setSuccessMessage(`Error: ${errorMessage}`);
    }
  }, [currentUser?.role, channelId, searchResults, getToken, fetchLiveVideos]);
  
  // Selection actions
  const toggleStagedSelection = useCallback((videoId: string) => {
    setSelectedStagedIds(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);
  
  const toggleLiveSelection = useCallback((videoId: string) => {
    setSelectedLiveIds(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);
  
  const selectAllStaged = useCallback(() => {
    setSelectedStagedIds(new Set(stagedVideos.map(v => v.videoId)));
  }, [stagedVideos]);
  
  const selectAllLive = useCallback(() => {
    setSelectedLiveIds(new Set(liveVideos.map(v => v.videoId)));
  }, [liveVideos]);
  
  const clearStagedSelection = useCallback(() => {
    setSelectedStagedIds(new Set());
  }, []);
  
  const clearLiveSelection = useCallback(() => {
    setSelectedLiveIds(new Set());
  }, []);
  
  // Playback actions
  const openPlayerModal = useCallback((videoId: string, playlist: VideoData[], isStaged: boolean) => {
    setActiveVideoId(videoId);
    setActivePlaybackList(playlist);
    const index = playlist.findIndex(v => v.videoId === videoId);
    setActivePlaybackIndex(index >= 0 ? index : 0);
    setIsOpenPlayerModal(true);
  }, []);
  
  const closePlayerModal = useCallback(() => {
    setIsOpenPlayerModal(false);
    setActiveVideoId(null);
    setActivePlaybackList([]);
    setActivePlaybackIndex(0);
  }, []);
  
  const playNextVideo = useCallback(() => {
    setActivePlaybackIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % activePlaybackList.length;
      const nextVideo = activePlaybackList[nextIndex];
      if (nextVideo) {
        setActiveVideoId(nextVideo.videoId);
      }
      return nextIndex;
    });
  }, [activePlaybackList]);
  
  const playPreviousVideo = useCallback(() => {
    setActivePlaybackIndex(prevIndex => {
      const nextIndex = (prevIndex - 1 + activePlaybackList.length) % activePlaybackList.length;
      const nextVideo = activePlaybackList[nextIndex];
      if (nextVideo) {
        setActiveVideoId(nextVideo.videoId);
      }
      return nextIndex;
    });
  }, [activePlaybackList]);
  
  const togglePlayerSelection = useCallback(() => {
    if (!activeVideoId) return;
    
    // For channel workspace, only live videos are used in playback
    toggleLiveSelection(activeVideoId);
  }, [activeVideoId, toggleLiveSelection]);
  
  const value: ChannelVideoWorkspaceContextType = {
    // State
    channelId,
    channelName,
    stagedVideos,
    stagedLoading,
    stagedError,
    liveVideos,
    liveLoading,
    liveError,
    selectedStagedIds,
    selectedLiveIds,
    activeVideoId,
    isOpenPlayerModal,
    activePlaybackList,
    activePlaybackIndex,
    isSearchModalOpen,
    isConfirmDialogOpen,
    confirmDialogConfig,
    successMessage,
    searchResults,
    searchLoading,
    
    // Actions
    setChannel,
    clearChannel,
    addToStaging,
    removeFromStaging,
    clearStaging,
    commitStaging,
    fetchLiveVideos,
    deleteVideoAssignment,
    bulkDeleteVideoAssignments,
    toggleStagedSelection,
    toggleLiveSelection,
    selectAllStaged,
    selectAllLive,
    clearStagedSelection,
    clearLiveSelection,
    openPlayerModal,
    closePlayerModal,
    playNextVideo,
    playPreviousVideo,
    togglePlayerSelection,
    openSearchModal,
    closeSearchModal,
    openConfirmDialog,
    closeConfirmDialog,
    clearSuccessMessage: () => setSuccessMessage(null),
    saveSearchResults,
    updateSearchResults,
  };
  
  return (
    <ChannelVideoWorkspaceContext.Provider value={value}>
      {children}
    </ChannelVideoWorkspaceContext.Provider>
  );
}

export function useChannelVideoWorkspace() {
  const context = useContext(ChannelVideoWorkspaceContext);
  if (context === undefined) {
    throw new Error('useChannelVideoWorkspace must be used within a ChannelVideoWorkspaceProvider');
  }
  return context;
}