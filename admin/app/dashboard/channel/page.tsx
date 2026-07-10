"use client";

import { useState, useEffect } from "react";
import { useChannels, useCreateChannel, useUpdateChannel, useDeleteChannel } from "@/hooks/use-admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ChannelPage() {
  const { data: channels = [], isLoading, refetch } = useChannels();
  const createMutation = useCreateChannel();
  const updateMutation = useUpdateChannel();
  const deleteMutation = useDeleteChannel();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [channelName, setChannelName] = useState("");
  const [channelId, setChannelId] = useState("");

  const handleOpenDialog = (channel?: any) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelName(channel.name);
      setChannelId(channel.id);
    } else {
      setEditingChannel(null);
      setChannelName("");
      setChannelId("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingChannel(null);
    setChannelName("");
    setChannelId("");
  };

  const handleSave = async () => {
    if (!channelName.trim()) {
      toast.error("Channel name is required");
      return;
    }

    try {
      if (editingChannel) {
        await updateMutation.mutateAsync({ id: channelId, name: channelName });
        toast.success("Channel updated successfully");
      } else {
        if (!channelId.trim()) {
          toast.error("Channel ID is required for new channels");
          return;
        }
        await createMutation.mutateAsync({ id: channelId, name: channelName });
        toast.success("Channel created successfully");
      }
      handleCloseDialog();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save channel");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this channel?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Channel deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete channel");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Channel</h1>
        <p className="text-muted-foreground">Manage channels and their content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Management</CardTitle>
          <div className="mt-4">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading channels...</div>
          ) : channels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No channels found</p>
              <p className="text-sm">Create a channel to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel: any) => (
                <Card key={channel.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{channel.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">ID: {channel.id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(channel)}
                        className="flex-1"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(channel.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChannel ? "Edit Channel" : "Add Channel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel ID</label>
              <Input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="YouTube Channel ID"
                disabled={!!editingChannel}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel Name</label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Enter channel name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDialog} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingChannel ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}