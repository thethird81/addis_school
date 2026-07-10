"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { VideoData } from '@/components/shared/VideoCard';
import { useAuth } from '@/contexts/AuthContext';

export interface CurriculumItem {
  id: string;
  name: string;
  subjects?: CurriculumItem[];
  contents?: CurriculumItem[];
  subcontents?: CurriculumItem[];
}

export interface ActiveLesson {
  gradeId: string;
  gradeName: string;
  subjectId?: string;
  subjectName?: string;
  contentId?: string;
  contentName?: string;
  subcontentId: string;
  subcontentName: string;
}

interface VideoWorkspaceState {
  // Curriculum tree
  curriculumTree: CurriculumItem[];
  treeLoading: boolean;
  treeError: string | null;
  
  // Active lesson
  activeLesson: ActiveLesson | null;
  
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
  isPlaybackFromStaged: boolean;
  
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

interface VideoWorkspaceActions {
  // Tree actions
  fetchCurriculumTree: () => Promise<void>;
  setActiveLesson: (lesson: ActiveLesson) => void;
  
  // Staged videos actions
  addToStaging: (videos: VideoData[]) => void;
  removeFromStaging: (videoId: string) => void;
  clearStaging: () => void;
  commitStaging: () => Promise<void>;
  
  // Live videos actions
  fetchLiveVideos: (subcontentId: string) => Promise<void>;
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

type VideoWorkspaceContextType = VideoWorkspaceState & VideoWorkspaceActions;

const VideoWorkspaceContext = createContext<VideoWorkspaceContextType | undefined>(undefined);

export function VideoWorkspaceProvider({ children }: { children: ReactNode }) {
  const { currentUser, getToken } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

  // Authorization: Only admins can access video workspace
  if (currentUser?.role !== 'admin') {
    // This provider should only be rendered for admin users
    // The parent component (VideosPage) should handle the redirect
    console.warn('VideoWorkspaceProvider accessed by non-admin user');
  }

  // Tree state
  const [curriculumTree, setCurriculumTree] = useState<CurriculumItem[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  
  // Active lesson
  const [activeLesson, setActiveLessonState] = useState<ActiveLesson | null>(null);
  
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
  const [isPlaybackFromStaged, setIsPlaybackFromStaged] = useState(false);
  
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
  React.useEffect(() => {
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

  // Tree actions
  const fetchCurriculumTree = useCallback(async () => {
    // Authorization check
    if (currentUser?.role !== 'admin') {
      setTreeError('Unauthorized - Admin access required');
      return;
    }

    setTreeLoading(true);
    setTreeError(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/videos/curriculum/tree`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch curriculum tree');
      const data = await response.json();
      setCurriculumTree(data);
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Failed to fetch curriculum tree');
    } finally {
      setTreeLoading(false);
    }
  }, [currentUser?.role, getToken]);

  const setActiveLesson = useCallback((lesson: ActiveLesson) => {
    setActiveLessonState(lesson);
    // Clear selections when changing active lesson
    setSelectedStagedIds(new Set());
    setSelectedLiveIds(new Set());
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

    if (!activeLesson || stagedVideos.length === 0) return;

    setStagedLoading(true);
    setStagedError(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/videos/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subcontentId: activeLesson.subcontentId,
          contentId: activeLesson.contentId,
          subjectId: activeLesson.subjectId,
          gradeId: activeLesson.gradeId,
          videos: stagedVideos,
        }),
      });

      if (!response.ok) throw new Error('Failed to save videos');

      // Clear staging after successful commit
      setStagedVideos([]);
      setSelectedStagedIds(new Set());
    } catch (err) {
      setStagedError(err instanceof Error ? err.message : 'Failed to save videos');
    } finally {
      setStagedLoading(false);
    }
  }, [currentUser?.role, activeLesson, stagedVideos]);

  // Live videos actions
  const fetchLiveVideos = useCallback(async (subcontentId: string) => {
    // Authorization check
    if (currentUser?.role !== 'admin') {
      setLiveError('Unauthorized - Admin access required');
      return;
    }

    setLiveLoading(true);
    setLiveError(null);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (activeLesson?.gradeId) params.append('gradeId', activeLesson.gradeId);
      if (activeLesson?.subjectId) params.append('subjectId', activeLesson.subjectId);
      if (activeLesson?.contentId) params.append('contentId', activeLesson.contentId);

      const response = await fetch(
        `${API_BASE}/videos/subcontents/${subcontentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();
      setLiveVideos(data);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLiveLoading(false);
    }
  }, [currentUser?.role, getToken, activeLesson]);

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
            const video = liveVideos.find(v => v.assignmentId === assignmentId);
            if (!video) {
              throw new Error('Video not found');
            }

            const token = getToken();
            const response = await fetch(`${API_BASE}/videos/${video.videoId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete video assignment');
            }
            
            // Remove from list and close modal on success
            setLiveVideos(prev => prev.filter(v => v.assignmentId !== assignmentId));
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
            const response = await fetch(`${API_BASE}/videos/bulk`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ videoIds }),
            });

            if (!response.ok) throw new Error('Failed to delete videos');

            // Get the result from the response
            const result = await response.json();
            
            // Remove deleted videos from the list
            setLiveVideos(prev => prev.filter(v => !videoIds.includes(v.videoId)));
            setSelectedLiveIds(new Set());
            
            // Close the modal and show success message
            closeConfirmDialog();
            setSuccessMessage(result.message || `Successfully deleted ${videoIds.length} video(s)`);
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

    if (searchResults.length === 0 || !activeLesson) return;

    setSearchLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/admin/youtube/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videos: searchResults,
          grade_id: activeLesson.gradeId,
          subject_id: activeLesson.subjectId,
          content_id: activeLesson.contentId,
          subcontent_id: activeLesson.subcontentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save videos');

      const result = await response.json();
      
      // Clear search results and staging
      setSearchResults([]);
      setStagedVideos([]);
      setSelectedStagedIds(new Set());
      
      // Show success message
      setSuccessMessage(result.message || `Successfully saved ${searchResults.length} video(s)`);
      
      // Refresh live videos to show the newly added videos
      if (activeLesson.subcontentId) {
        await fetchLiveVideos(activeLesson.subcontentId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save videos';
      setStagedError(errorMessage);
      setSuccessMessage(`Error: ${errorMessage}`);
    } finally {
      setSearchLoading(false);
    }
  }, [currentUser?.role, searchResults, activeLesson, fetchLiveVideos]);

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
    setIsPlaybackFromStaged(isStaged);
    const index = playlist.findIndex(v => v.videoId === videoId);
    setActivePlaybackIndex(index >= 0 ? index : 0);
    setIsOpenPlayerModal(true);
  }, []);

  const closePlayerModal = useCallback(() => {
    setIsOpenPlayerModal(false);
    setActiveVideoId(null);
    setActivePlaybackList([]);
    setActivePlaybackIndex(0);
    setIsPlaybackFromStaged(false);
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
    
    const toggleFn = isPlaybackFromStaged ? toggleStagedSelection : toggleLiveSelection;
    toggleFn(activeVideoId);
  }, [activeVideoId, isPlaybackFromStaged, toggleStagedSelection, toggleLiveSelection]);

  const value: VideoWorkspaceContextType = {
    // State
    curriculumTree,
    treeLoading,
    treeError,
    activeLesson,
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
    isPlaybackFromStaged,
    isSearchModalOpen,
    isConfirmDialogOpen,
    confirmDialogConfig,
    successMessage,
    searchResults,
    searchLoading,
    
    // Actions
    fetchCurriculumTree,
    setActiveLesson,
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
    <VideoWorkspaceContext.Provider value={value}>
      {children}
    </VideoWorkspaceContext.Provider>
  );
}

export function useVideoWorkspace() {
  const context = useContext(VideoWorkspaceContext);
  if (context === undefined) {
    throw new Error('useVideoWorkspace must be used within a VideoWorkspaceProvider');
  }
  return context;
}