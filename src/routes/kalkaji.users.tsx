import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminUsersQuery } from "@/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2 } from "lucide-react";
import { AdminEditCustomerModal } from "@/components/admin/AdminEditCustomerModal";
import { AdminDeleteUserModal } from "@/components/admin/AdminDeleteUserModal";
import type { UserResponse } from "@/types/dto";

export const Route = createFileRoute("/kalkaji/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { data: users, isLoading } = useQuery(adminUsersQuery());
  const [activeTab, setActiveTab] = useState("ALL");
  const [editingCustomer, setEditingCustomer] = useState<UserResponse | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<UserResponse | null>(null);
  
  const filteredUsers = users?.filter((user: any) => activeTab === "ALL" || user.role === activeTab) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Users & Customers</h2>
          <p className="text-muted-foreground">Manage your store's users, customer profiles, and roles.</p>
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
              <TableHead>Username / Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading users...
                </TableCell>
              </TableRow>
            ) : !filteredUsers.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No users found for this role.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: any) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-mono text-xs">{user.userId.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{user.username || user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs hover:bg-muted"
                        onClick={() => setEditingCustomer(user)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingCustomer(user)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </TableCell>
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
                <div className="flex items-center gap-1.5">
                  <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1"
                    onClick={() => setEditingCustomer(user)}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    onClick={() => setDeletingCustomer(user)}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <AdminEditCustomerModal
          customer={editingCustomer}
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {/* Permanent Delete User Modal */}
      {deletingCustomer && (
        <AdminDeleteUserModal
          user={deletingCustomer}
          isOpen={!!deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
        />
      )}
    </div>
  );
}
