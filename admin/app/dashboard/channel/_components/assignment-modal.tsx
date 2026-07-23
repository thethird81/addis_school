'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurriculumSelect } from './curriculum-select';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignChannelToPosition, removeChannelAssignment } from '../_actions/channel-actions';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  mode: 'assign' | 'remove';
  assignmentId?: string;
  filterGrade?: string;
  filterSubject?: string;
  onSuccess?: () => void;
}

export function AssignmentModal({
  isOpen,
  onClose,
  channelId,
  channelName,
  mode,
  assignmentId,
  filterGrade,
  filterSubject,
  onSuccess,
}: AssignmentModalProps) {
  const queryClient = useQueryClient();
  const [selectedGrade, setSelectedGrade] = useState(filterGrade || '');
  const [selectedSubject, setSelectedSubject] = useState(filterSubject || '');

  const assignMutation = useMutation({
    mutationFn: async () => {
      const result = await assignChannelToPosition({
        channel_id: channelId,
        grade_id: selectedGrade,
        subject_id: selectedSubject || undefined,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success(`Channel "${channelName}" assigned successfully`);
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign channel');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!assignmentId) throw new Error('Assignment ID is required');
      const result = await removeChannelAssignment(assignmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success(`Assignment removed from "${channelName}"`);
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove assignment');
    },
  });

  const handleAction = () => {
    if (mode === 'assign') {
      assignMutation.mutate();
    } else {
      removeMutation.mutate();
    }
  };

  const isPending = assignMutation.isPending || removeMutation.isPending;
  const canSubmit = mode === 'assign' ? !!selectedGrade : true;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'assign' ? 'Assign Channel' : 'Remove Assignment'}
          </DialogTitle>
          <DialogDescription>
            Channel: <span className="font-medium">{channelName}</span>
            {mode === 'remove' && filterGrade && (
              <span className="block text-sm text-muted-foreground mt-1">
                {filterSubject
                  ? `Removing subject-level assignment`
                  : `Removing grade-level assignment`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {mode === 'assign' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Grade <span className="text-destructive">*</span>
                </label>
                <CurriculumSelect
                  onSelectionChange={(selection: any) => {
                    setSelectedGrade(selection.gradeId || '');
                    setSelectedSubject(selection.subjectId || '');
                  }}
                  value={{ gradeId: selectedGrade, subjectId: selectedSubject }}
                />
              </div>
              {selectedGrade && !selectedSubject && (
                <p className="text-xs text-muted-foreground">
                  No subject selected - this will be a grade-level assignment (advert).
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove this channel assignment?
              {filterSubject
                ? ' The channel will no longer appear for this subject.'
                : ' The channel will no longer appear for this grade.'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={!canSubmit || isPending}
            variant={mode === 'remove' ? 'destructive' : 'default'}
          >
            {isPending
              ? mode === 'assign'
                ? 'Assigning...'
                : 'Removing...'
              : mode === 'assign'
              ? 'Assign'
              : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}