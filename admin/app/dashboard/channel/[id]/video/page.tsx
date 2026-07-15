"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ChannelVideoWorkspaceProvider } from "@/contexts/ChannelVideoWorkspaceContext";
import { ChannelVideoWorkspace } from "@/components/channel-video-workspace/ChannelVideoWorkspace";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export default function ChannelVideoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, loading: authLoading, getToken } = useAuth();

  // Fetch channel details to get the name
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE}/admin/channels`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch channels");
      return response.json();
    },
    enabled: currentUser?.role === "admin",
  });

  const channel = channels.find((ch: any) => ch.id === id);

  // Auth guard
  if (!authLoading && currentUser?.role !== "admin") {
    router.replace("/dashboard");
    return null;
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-lg text-muted-foreground">Channel not found</p>
        <Button onClick={() => router.push("/dashboard/channel")}>
          Back to Channels
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 border-b px-6 py-3 bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/channel")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Channels
        </Button>
        <div className="h-4 w-px bg-gray-200" />
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {channel.name}
        </h1>
        <span className="text-xs text-muted-foreground font-mono">ID: {channel.id}</span>
      </div>

      {/* Video Workspace */}
      <div className="flex-1 overflow-hidden">
        <ChannelVideoWorkspaceProvider
          channelId={channel.id}
          channelName={channel.name}
        >
          <ChannelVideoWorkspace
            channelId={channel.id}
            channelName={channel.name}
          />
        </ChannelVideoWorkspaceProvider>
      </div>
    </div>
  );
}