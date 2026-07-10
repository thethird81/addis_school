"use client";

import { useState } from "react";
import { useUsers, useUpdateUserRole } from "@/hooks/use-admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Users as UsersIcon } from "lucide-react";

export default function UserPage() {
  const { data: users = [], isLoading, refetch } = useUsers();
  const updateRoleMutation = useUpdateUserRole();

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      toast.success(`User role updated to ${newRole}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UsersIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No users found</p>
              <p className="text-sm">Users will appear here when they register</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">User ID</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tier</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Profiles</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm font-mono">{user.id}</td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updateRoleMutation.isPending}
                          className="text-sm border rounded px-2 py-1 bg-background"
                        >
                          <option value="admin">Admin</option>
                          <option value="parent">Parent</option>
                        </select>
                      </td>
                      <td className="p-3 text-sm">{user.tier || "free"}</td>
                      <td className="p-3 text-sm">{user.number_of_profiles || 0}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}