export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export interface Channel {
  id: string;
  name: string;
  thumbnail_url?: {
    url?: string;
    width?: number;
    height?: number;
  } | null;
  created_at?: string;
  channel_assignments?: Array<{
    id?: string;
    grade_id?: string;
    subject_id?: string | null;
  }>;
}

export const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ==================== CHANNELS ====================

export async function getAllChannels() {
  try {
    const response = await fetch(`${API_BASE}/admin/channels`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch channels" };
    }

    return { success: true, channels: data || [] };
  } catch (error: any) {
    console.error("Error fetching channels:", error);
    return { success: false, error: error.message || "Failed to fetch channels" };
  }
}

export async function createChannel({ id, name }: { id: string; name: string }) {
  try {
    if (!id || !name) {
      return { success: false, error: "Channel ID and name are required" };
    }

    const response = await fetch(`${API_BASE}/admin/channels`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create channel" };
    }

    return { success: true, channel: data };
  } catch (error: any) {
    console.error("Error creating channel:", error);
    return { success: false, error: error.message || "Failed to create channel" };
  }
}

export async function updateChannel({ id, name }: { id: string; name: string }) {
  try {
    if (!name) {
      return { success: false, error: "Channel name is required" };
    }

    const response = await fetch(`${API_BASE}/admin/channels/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to update channel" };
    }

    return { success: true, channel: data };
  } catch (error: any) {
    console.error("Error updating channel:", error);
    return { success: false, error: error.message || "Failed to update channel" };
  }
}

export async function deleteChannel(id: string) {
  try {
    const response = await fetch(`${API_BASE}/admin/channels/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to delete channel" };
    }

    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Error deleting channel:", error);
    return { success: false, error: error.message || "Failed to delete channel" };
  }
}

// ==================== CHANNEL ASSIGNMENTS ====================

interface BulkAssignChannelsParams {
  channelIds: string[];
  grade_id: string;
  subject_id: string;
}

export async function bulkAssignChannels({ channelIds, grade_id, subject_id }: BulkAssignChannelsParams) {
  try {
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return { success: false, error: "No channels selected" };
    }

    if (!grade_id) {
      return { success: false, error: "grade_id is required" };
    }

    if (!subject_id) {
      return { success: false, error: "subject_id is required for channel assignment" };
    }

    const response = await fetch(`${API_BASE}/admin/channel-assignments/bulk`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        channelIds,
        grade_id,
        subject_id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to assign channels" };
    }

    return {
      success: true,
      inserted: data.inserted,
      skipped: data.skipped,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Error bulk assigning channels:", error);
    return { success: false, error: error.message || "Failed to assign channels" };
  }
};

// ==================== SINGLE CHANNEL ASSIGNMENT ====================

interface AssignChannelToPositionParams {
  channel_id: string;
  grade_id: string;
  subject_id?: string;
}

export async function assignChannelToPosition({ channel_id, grade_id, subject_id }: AssignChannelToPositionParams) {
  try {
    if (!channel_id || !grade_id) {
      return { success: false, error: "channel_id and grade_id are required" };
    }

    const response = await fetch(`${API_BASE}/admin/assign/channel-to-position`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        channel_id,
        grade_id,
        subject_id: subject_id || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to assign channel" };
    }

    return { success: true, assignment: data };
  } catch (error: any) {
    console.error("Error assigning channel to position:", error);
    return { success: false, error: error.message || "Failed to assign channel" };
  }
}

export async function removeChannelAssignment(assignmentId: string) {
  try {
    if (!assignmentId) {
      return { success: false, error: "Assignment ID is required" };
    }

    const response = await fetch(`${API_BASE}/admin/channel-assignments/${assignmentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to remove assignment" };
    }

    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Error removing channel assignment:", error);
    return { success: false, error: error.message || "Failed to remove assignment" };
  }
}

// ==================== CHANNEL ASSIGNMENTS (GET) ====================

export async function getChannelAssignments(channelId: string) {
  try {
    const response = await fetch(`${API_BASE}/admin/channels/${channelId}/assignments`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch channel assignments" };
    }

    return { success: true, assignments: data || [] };
  } catch (error: any) {
    console.error("Error fetching channel assignments:", error);
    return { success: false, error: error.message || "Failed to fetch channel assignments" };
  }
}

// ==================== CHANNEL VIDEOS ====================

export async function getChannelVideos(channelId: string) {
  try {
    const response = await fetch(`${API_BASE}/admin/channels/${channelId}/videos`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch channel videos" };
    }

    return { success: true, videos: data || [] };
  } catch (error: any) {
    console.error("Error fetching channel videos:", error);
    return { success: false, error: error.message || "Failed to fetch channel videos" };
  }
}

// ==================== FETCH VIDEOS FROM YOUTUBE ====================

export async function fetchChannelVideosFromYouTube({
  channelId,
  isAdvert,
  query,
}: {
  channelId: string;
  isAdvert?: boolean;
  query?: string;
}) {
  try {
    if (!channelId) {
      return { success: false, error: "Channel ID is required" };
    }

    const response = await fetch(`${API_BASE}/admin/youtube/channel/${channelId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isAdvert, query }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch channel videos" };
    }

    return { success: true, videos: data || [] };
  } catch (error: any) {
    console.error("Error fetching videos from YouTube:", error);
    return { success: false, error: error.message || "Failed to fetch videos" };
  }
};