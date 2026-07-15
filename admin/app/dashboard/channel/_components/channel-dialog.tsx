"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createChannel, updateChannel } from "../_actions/channel-actions";
import type { Channel } from "../_actions/channel-actions";

interface ChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  channel?: Channel | null;
}

export function ChannelDialog({ open, onOpenChange, onSuccess, channel }: ChannelDialogProps) {
  const [channelId, setChannelId] = useState(channel?.id || "");
  const [channelName, setChannelName] = useState(channel?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setChannelId("");
    setChannelName("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!channelName.trim()) {
      toast.error("Channel name is required");
      return;
    }

    if (!channel && !channelId.trim()) {
      toast.error("Channel ID is required for new channels");
      return;
    }

    setIsSubmitting(true);
    try {
      if (channel) {
        await updateChannel({ id: channelId, name: channelName });
        toast.success("Channel updated successfully");
      } else {
        await createChannel({ id: channelId.trim(), name: channelName.trim() });
        toast.success("Channel created successfully");
      }
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save channel");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{channel ? "Edit Channel" : "Add Channel"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Channel ID</label>
            <Input
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="YouTube Channel ID"
              disabled={!!channel}
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
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : channel ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}