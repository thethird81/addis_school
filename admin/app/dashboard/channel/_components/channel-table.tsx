"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Loader2, Trash2, Pencil, Video } from "lucide-react";
import { getAllChannels, deleteChannel as deleteChannelAction, Channel } from "../_actions/channel-actions";
import { useCurriculumTree } from "@/hooks/use-admin-api";

interface ChannelTableProps {
  selectedChannelIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onViewVideos?: (channel: Channel) => void;
  onEditChannel?: (channel: Channel) => void;
  onChannelsLoaded?: (channels: Channel[]) => void;
}

export function ChannelTable({
  selectedChannelIds,
  onSelectionChange,
  onViewVideos,
  onEditChannel,
  onChannelsLoaded,
}: ChannelTableProps) {
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);

  const queryClient = useQueryClient();
  const { data: tree = [] } = useCurriculumTree();

  const selectedGradeData = tree.find((g: any) => g.id === filterGrade);
  const filteredSubjects = selectedGradeData?.subjects || [];

  const { data: channels = [], isLoading, refetch } = useQuery({
    queryKey: ["channels", search, filterGrade, filterSubject],
    queryFn: async () => {
      const result = await getAllChannels();
      if (!result.success) {
        throw new Error(result.error);
      }

      let list = [...result.channels] as Channel[];

      if (search && search.trim()) {
        list = list.filter((ch: Channel) =>
          ch.name?.toLowerCase().includes(search.toLowerCase()) ||
          ch.id?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (filterGrade || filterSubject) {
        list = list.filter((ch: Channel) => {
          const assignments = ch.channel_assignments ?? [];

          if (!assignments.length) {
            return false;
          }

          const matchesGrade =
            !filterGrade ||
            assignments.some((assignment) => assignment.grade_id === filterGrade);

          if (!matchesGrade) {
            return false;
          }

          if (!filterSubject) {
            return true;
          }

          return assignments.some((assignment) => assignment.subject_id === filterSubject);
        });
      }

      onChannelsLoaded?.(list);
      return list;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteChannelAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      setDeleteTarget(null);
    },
  });

  const toggleChannel = (id: string) => {
    if (selectedChannelIds.includes(id)) {
      onSelectionChange(selectedChannelIds.filter((cid) => cid !== id));
    } else {
      onSelectionChange([...selectedChannelIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedChannelIds.length === channels.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(channels.map((ch: Channel) => ch.id));
    }
  };

  const allSelected = channels.length > 0 && selectedChannelIds.length === channels.length;

  const getThumbnailUrl = (thumbnail_url?: Channel['thumbnail_url']): string => {
    if (!thumbnail_url?.url) return "/placeholder-video.png";
    return thumbnail_url.url;
  };

  const handleViewVideos = (channel: Channel) => {
    if (onViewVideos) {
      onViewVideos(channel);
    }
  };

  const handleEdit = (channel: Channel) => {
    if (onEditChannel) {
      onEditChannel(channel);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels by name or ID..."
              className="pl-8"
            />
          </div>
          {tree.length > 0 && (
            <>
              <select
                value={filterGrade}
                onChange={(e) => {
                  setFilterGrade(e.target.value);
                  setFilterSubject("");
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                <option value="">All Grades</option>
                {tree.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                disabled={!filterGrade}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm disabled:opacity-50"
              >
                <option value="">All Subjects</option>
                {filteredSubjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </>
          )}
          <Button onClick={() => refetch()} variant="secondary" size="sm">
            Filter
          </Button>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedChannelIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">{selectedChannelIds.length} channel(s) selected</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Thumbnail</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading channels...
                  </div>
                </TableCell>
              </TableRow>
            ) : channels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No channels found
                </TableCell>
              </TableRow>
            ) : (
              channels.map((channel: Channel) => (
                <TableRow 
                  key={channel.id} 
                  data-state={selectedChannelIds.includes(channel.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedChannelIds.includes(channel.id)}
                      onCheckedChange={() => toggleChannel(channel.id)}
                      aria-label={`Select ${channel.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative h-16 w-24 overflow-hidden rounded bg-gray-100">
                      <img
                        src={getThumbnailUrl(channel.thumbnail_url)}
                        alt={channel.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-video.png";
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => handleViewVideos(channel)}
                      className="text-left hover:underline text-blue-600 hover:text-blue-800"
                    >
                      {channel.name}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{channel.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {channel.created_at ? new Date(channel.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewVideos(channel)}
                        aria-label={`View videos for ${channel.name}`}
                      >
                        <Video className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(channel)}
                        aria-label={`Edit ${channel.name}`}
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(channel)}
                        aria-label={`Delete ${channel.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{deleteTarget?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget && deleteTarget.id) {
                  deleteMutation.mutate(deleteTarget.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}