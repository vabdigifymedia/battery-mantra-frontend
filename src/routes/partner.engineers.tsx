import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import type { EngineerProfile, CreateEngineerRequest } from "@/services/engineer.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Search, Phone, Mail, MapPin, Edit, Trash2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/partner/engineers")({
  component: PartnerEngineersPage,
});

function PartnerEngineersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<EngineerProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateEngineerRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    alternatePhone: "",
    address: "",
    city: "",
    password: "",
  });

  const { data: engineers = [], isLoading } = useQuery({
    queryKey: ["partner", "engineers"],
    queryFn: ({ signal }) => partnerDashboardService.listEngineers(signal),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEngineerRequest) => partnerDashboardService.createEngineer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "engineers"] });
      toast.success("Engineer added successfully");
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to add engineer"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateEngineerRequest }) =>
      partnerDashboardService.updateEngineer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "engineers"] });
      toast.success("Engineer updated successfully");
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update engineer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => partnerDashboardService.deleteEngineer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "engineers"] });
      toast.success("Engineer deleted successfully");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete engineer"),
  });

  const openCreateDialog = () => {
    setEditingEngineer(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      alternatePhone: "",
      address: "",
      city: "",
      password: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (eng: EngineerProfile) => {
    setEditingEngineer(eng);
    setFormData({
      firstName: eng.firstName || eng.fullName?.split(" ")[0] || "",
      lastName: eng.lastName || eng.fullName?.split(" ").slice(1).join(" ") || "",
      email: eng.email,
      phoneNumber: eng.phoneNumber,
      alternatePhone: eng.alternatePhone || "",
      address: eng.address || "",
      city: eng.city || "",
      password: "", // Optional during update
      isActive: eng.isActive,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEngineer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (editingEngineer) {
      updateMutation.mutate({ id: editingEngineer.id, data: formData });
    } else {
      if (!formData.password) {
        toast.error("Password is required when creating a new engineer.");
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const filteredEngineers = engineers.filter((e) => {
    const fullName = `${e.firstName || ""} ${e.lastName || ""} ${e.fullName || ""}`.toLowerCase();
    const query = search.toLowerCase();
    return (
      fullName.includes(query) ||
      e.email?.toLowerCase().includes(query) ||
      e.phoneNumber?.toLowerCase().includes(query) ||
      (e.city && e.city.toLowerCase().includes(query))
    );
  });

  const totalCount = engineers.length;
  const activeCount = engineers.filter((e) => e.isActive).length;
  const inactiveCount = totalCount - activeCount;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Engineers & Technicians</h1>
          <p className="text-muted-foreground">Manage field installation staff assigned to your partner branch.</p>
        </div>
        <Button onClick={openCreateDialog} variant="brand" className="gap-2">
          <UserPlus className="h-4 w-4" /> Add New Engineer
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Team</p>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Branch installation staff</p>
            </div>
            <div className="rounded-full bg-blue-500/10 p-3 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Staff</p>
              <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Available for assignments</p>
            </div>
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inactive / On Leave</p>
              <p className="text-2xl font-bold text-amber-600">{inactiveCount}</p>
              <p className="text-xs text-muted-foreground">Currently unavailable</p>
            </div>
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-600">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engineer Table Container */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Name, Email, Phone, City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total Staff: <span className="font-semibold text-foreground">{filteredEngineers.length}</span>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Engineer Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Base City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEngineers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p>No engineers found for your branch.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEngineers.map((eng) => {
                const displayName = eng.firstName && eng.lastName ? `${eng.firstName} ${eng.lastName}` : (eng.fullName || "Engineer");
                return (
                  <TableRow key={eng.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{displayName}</div>
                          {eng.address && (
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">{eng.address}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {eng.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {eng.phoneNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{eng.city || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${eng.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {eng.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {eng.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {eng.createdAt ? new Date(eng.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(eng)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${displayName}?`)) {
                              deleteMutation.mutate(eng.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {editingEngineer ? "Edit Engineer Profile" : "Add New Branch Engineer"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name" htmlFor="firstName" required>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Rahul"
                  required
                />
              </FormField>
              <FormField label="Last Name" htmlFor="lastName" required>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Sharma"
                  required
                />
              </FormField>
            </div>

            <FormField label="Email Address" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul@example.com"
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Phone Number" htmlFor="phoneNumber" required>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="9876543210"
                  required
                />
              </FormField>              <FormField label="Alternate Phone" htmlFor="alternatePhone">
                <Input
                  id="alternatePhone"
                  value={formData.alternatePhone || ""}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  placeholder="Optional"
                />
              </FormField>
            </div>

            <FormField label="Base City" htmlFor="city">
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Delhi"
              />
            </FormField>

            <FormField label="Address / Operating Area" htmlFor="address">
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Local store branch address"
              />
            </FormField>

            <FormField
              label={editingEngineer ? "New Password (Leave blank to keep current)" : "Password"}
              htmlFor="password"
              required={!editingEngineer}
            >
              <Input
                id="password"
                type="password"
                value={formData.password || ""}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingEngineer ? "••••••••" : "Set login password"}
                required={!editingEngineer}
              />
            </FormField>

            {editingEngineer && (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-xs text-muted-foreground">
                    Active staff can receive work assignments.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${formData.isActive ? "text-emerald-600" : "text-red-500"}`}>
                    {formData.isActive ? "Active" : "Suspended"}
                  </span>
                  <Switch
                    checked={!!formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Spinner size="sm" />
                ) : editingEngineer ? (
                  "Save Changes"
                ) : (
                  "Create Engineer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
