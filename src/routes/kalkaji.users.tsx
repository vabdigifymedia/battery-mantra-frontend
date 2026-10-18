import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminUsersQuery } from "@/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/Spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { data: users, isLoading } = useQuery(adminUsersQuery());
  const [activeTab, setActiveTab] = useState("ALL");
  
  const filteredUsers = users?.filter((user: any) => activeTab === "ALL" || user.role === activeTab) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage your store's users and roles.</p>
        </div>
        
        <Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="flex overflow-x-auto w-full sm:w-auto no-scrollbar">
            <TabsTrigger value="ALL" className="flex-1 sm:flex-none">All</TabsTrigger>
            <TabsTrigger value="ADMIN" className="flex-1 sm:flex-none">Admin</TabsTrigger>
            <TabsTrigger value="PARTNER" className="flex-1 sm:flex-none">Partner</TabsTrigger>
            <TabsTrigger value="ENGINEER" className="flex-1 sm:flex-none">Engineer</TabsTrigger>
            <TabsTrigger value="USER" className="flex-1 sm:flex-none">Customer</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading users...
                </TableCell>
              </TableRow>
            ) : !filteredUsers.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found for this role.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: any) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-mono text-xs">{user.userId.slice(0, 8)}</TableCell>
                  <TableCell>{user.username || user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="sm" className="mr-2" /> Loading...
          </div>
        ) : !filteredUsers.length ? (
          <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card border-dashed">
            No users found for this role.
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <div key={user.userId} className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{user.username || user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-3 border-t">
                <span className="font-mono">ID: {user.userId.slice(0, 8)}</span>
                <span>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
