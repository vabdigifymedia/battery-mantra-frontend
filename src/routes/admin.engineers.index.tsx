import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Badge } from "@/components/ui/badge";
import { engineerService } from "@/services/engineer.service";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/engineers/")({
  component: EngineersPage,
});

function EngineersPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: engineers = [], isLoading } = useQuery({
    queryKey: ["admin", "engineers"],
    queryFn: engineerService.getAll,
  });

  const filteredEngineers = engineers.filter((e) => {
    const fullName = `${e.firstName || ""} ${e.lastName || ""} ${e.fullName || ""}`.toLowerCase();
    const query = search.toLowerCase();
    return (
      fullName.includes(query) ||
      e.email.toLowerCase().includes(query) ||
      e.phoneNumber.includes(query)
    );
  });

  const handleDelete = async (id: string) => {
    try {
      await engineerService.delete(id);
      toast.success("Engineer deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "engineers"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to delete engineer");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engineers</h1>
          <p className="text-muted-foreground">Manage delivery engineers and their access.</p>
        </div>
        <Button asChild>
          <Link to="/admin/engineers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Engineer
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search engineers..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : filteredEngineers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No engineers found.
                  </td>
                </tr>
              ) : (
                filteredEngineers.map((engineer) => (
                  <tr
                    key={engineer.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle font-medium">
                      {engineer.firstName && engineer.lastName 
                        ? `${engineer.firstName} ${engineer.lastName}`
                        : engineer.fullName || "Engineer"}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{engineer.email}</span>
                        <span className="text-muted-foreground">{engineer.phoneNumber}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {engineer.isActive ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {new Date(engineer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/engineers/${engineer.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will deactivate the engineer account and prevent them from logging in.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(engineer.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
