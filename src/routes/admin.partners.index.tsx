import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Badge } from "@/components/ui/badge";
import { partnerService } from "@/services/partner.service";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PartnerProfile } from "@/services/partner.service";

export const Route = createFileRoute("/admin/partners/")({
  component: PartnersPage,
});

function PartnersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'inactive'
  const queryClient = useQueryClient();

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: partnerService.getAll,
  });

  const filteredPartners = partners.filter((p) => {
    const matchesSearch = p.businessName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phoneNumber.includes(search);
      
    const matchesStatus = statusFilter === "all" ? true :
      statusFilter === "active" ? p.isActive :
      statusFilter === "inactive" ? !p.isActive : true;
      
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (partner: PartnerProfile) => {
    try {
      await partnerService.update(partner.id, {
        businessName: partner.businessName,
        contactPerson: partner.contactPerson,
        email: partner.email,
        phoneNumber: partner.phoneNumber,
        alternatePhone: partner.alternatePhone || "",
        address: partner.address || "",
        isActive: !partner.isActive,
        operatingCityIds: partner.operatingCities.map(c => c.cityId)
      });
      toast.success(`Partner ${partner.isActive ? 'deactivated' : 'reactivated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update partner status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
          <p className="text-muted-foreground">Manage city partners and their assignments.</p>
        </div>
        <Button asChild>
          <Link to="/admin/partners/new">
            <Plus className="mr-2 h-4 w-4" /> Add Partner
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Partners ({partners.length})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Deactivated</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search partners..."
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
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Business</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cities</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
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
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No partners found.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle font-medium">{partner.businessName}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{partner.contactPerson}</span>
                        <span className="text-muted-foreground">{partner.phoneNumber}</span>
                        <span className="text-muted-foreground">{partner.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {partner.operatingCities.map((city) => (
                          <Badge key={city.cityId} variant="outline">{city.cityName}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {partner.isActive ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/partners/${partner.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            {partner.isActive ? (
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" title="Deactivate">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Deactivate</span>
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600" title="Reactivate">
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Reactivate</span>
                              </Button>
                            )}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{partner.isActive ? "Deactivate Partner?" : "Reactivate Partner?"}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {partner.isActive 
                                  ? "This will deactivate the partner account and prevent them from logging in." 
                                  : "This will reactivate the partner account and allow them to log in and receive orders again."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleToggleStatus(partner)} 
                                className={partner.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-emerald-600 text-white hover:bg-emerald-700"}
                              >
                                {partner.isActive ? "Deactivate" : "Reactivate"}
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
