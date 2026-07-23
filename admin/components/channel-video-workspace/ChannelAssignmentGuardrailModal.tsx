"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChannelVideoWorkspace } from "@/contexts/ChannelVideoWorkspaceContext";
import { useRouter } from "next/navigation";

export function ChannelAssignmentGuardrailModal() {
  const { 
    isAssignmentGuardrailOpen, 
    closeAssignmentGuardrail, 
    channelId, 
    channelName 
  } = useChannelVideoWorkspace();
  const router = useRouter();

  const handleGoToChannels = () => {
    closeAssignmentGuardrail();
    router.push("/dashboard/channel");
  };

  return (
    <Dialog open={isAssignmentGuardrailOpen} onOpenChange={(open) => !open && closeAssignmentGuardrail()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Channel Not Assigned</DialogTitle>
          <DialogDescription>
            The channel <span className="font-medium">{channelName || channelId}</span> has no grade or subject assignments yet.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Before you can fetch and save videos for this channel, it must be assigned to at least one grade 
            (or grade + subject) in the curriculum tree. Videos need to know which curriculum node they belong to.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please go to the Channel Administration page to assign this channel to a curriculum node first.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeAssignmentGuardrail}>
            Dismiss
          </Button>
          <Button onClick={handleGoToChannels}>
            Go to Channel Administration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}