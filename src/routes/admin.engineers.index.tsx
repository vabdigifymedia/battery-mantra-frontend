import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Building2, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Badge } from "@/components/ui/badge";
import { engineerService } from "@/services/engineer.service";
import { partnerService } from "@/services/partner.service";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/admin/engineers/")({
  component: EngineersPage,
});

function EngineersPage() {
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const queryClient = useQueryClient();

  const { data: engineers = [], isLoading: isLoadingEngineers } = useQuery({
    queryKey: ["admin", "engineers"],
    queryFn: engineerService.getAll,
  });

  const { data: partners = [], isLoading: isLoadingPartners } = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: partnerService.getAll,
  });

  const isLoading = isLoadingEngineers || isLoadingPartners;

  // Filter engineers based on active tab & search
  const tabFilteredEngineers = engineers.filter((e) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "admin") return !e.partnerId;
    return e.partnerId === selectedTab;
  });

  const filteredEngineers = tabFilteredEngineers.filter((e) => {
    const fullName = `${e.firstName || ""} ${e.lastName || ""} ${e.fullName || ""}`.toLowerCase();
    const query = search.toLowerCase();
    return (
      fullName.includes(query) ||
      e.email?.toLowerCase().includes(query) ||
      e.phoneNumber?.includes(query) ||
      (e.city && e.city.toLowerCase().includes(query)) ||
      (e.partnerBusinessName && e.partnerBusinessName.toLowerCase().includes(query))
    );
  });

  const handleDelete = async (id: string) => {
    try {
      await engineerService.delete(id);
      toast.success("Engineer status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "engineers"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update engineer");
    }
  };

  const adminEngineersCount = engineers.filter((e) => !e.partnerId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Engineers</h1>
          <p className="text-muted-foreground">Manage direct company technicians and partner-assigned engineers.</p>
        </div>
        <Button asChild>
          <Link to="/admin/engineers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Engineer
          </Link>
        </Button>
      </div>

      {/* Tabs for Filtering by Partner / Admin */}
      <div className="space-y-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto p-1 bg-muted/60 inline-flex flex-nowrap min-w-full sm:min-w-0">
              <TabsTrigger value="all" className="px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                All Engineers ({engineers.length})
              </TabsTrigger>
              <TabsTrigger value="admin" className="px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap gap-1.5">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                Direct Admin ({adminEngineersCount})
              </TabsTrigger>
              {partners.map((partner) => {
                const partnerEngCount = engineers.filter((e) => e.partnerId === partner.id).length;
                return (
                  <TabsTrigger
                    key={partner.id}
                    value={partner.id}
                    className="px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap gap-1.5"
                  >
                    <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                    {partner.businessName} ({partnerEngCount})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </Tabs>

        {/* Search & Actions Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, phone, city..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            Showing <strong className="text-foreground">{filteredEngineers.length}</strong> engineers
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Assigned Partner</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact Info</th>
                <th className="h-12 px-4 text-left align-middle font-middle font-medium text-muted-foreground">City</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : filteredEngineers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No engineers found in this tab.
                  </td>
                </tr>
              ) : (
                filteredEngineers.map((engineer) => {
                  const displayName =
                    engineer.firstName && engineer.lastName
                      ? `${engineer.firstName} ${engineer.lastName}`
                      : engineer.fullName || "Engineer";

                  return (
                    <tr
                      key={engineer.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <span>{displayName}</span>
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        {engineer.partnerId ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 gap-1">
                            <Building2 className="h-3 w-3" />
                            {engineer.partnerBusinessName || "Partner Engineer"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 gap-1">
                            <Shield className="h-3 w-3" />
                            Direct Admin
                          </Badge>
                        )}
                      </td>

                      <td className="p-4 align-middle">
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-foreground">{engineer.email}</span>
                          <span className="text-muted-foreground">{engineer.phoneNumber}</span>
                        </div>
                      </td>

                      <td className="p-4 align-middle text-muted-foreground text-xs font-medium">
                        {engineer.city || "N/A"}
                      </td>

                      <td className="p-4 align-middle">
                        {engineer.isActive ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-0">
                            Suspended
                          </Badge>
                        )}
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate Engineer?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will suspend <strong>{displayName}</strong> and prevent them from accepting jobs.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(engineer.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

