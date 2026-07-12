import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { vehiclesListQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, Car, Upload } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField } from "@/components/forms/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import type { VehicleResponse, CreateVehicleRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/vehicles")({
  component: AdminVehicles,
});

const vehicleSchema = z.object({
  vehicleType: z.enum(["CAR", "BIKE", "COMMERCIAL", "E_RICKSHAW", "INVERTER"]),
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "CNG"]).optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse headers
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  
  const results: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    if (!row.make || !row.model) continue;

    const vehicleType = row.vehicleType?.toUpperCase();
    const fuelType = row.fuelType?.toUpperCase();

    results.push({
      vehicleType: ["CAR", "BIKE", "COMMERCIAL", "E_RICKSHAW", "INVERTER"].includes(vehicleType) ? vehicleType : "CAR",
      make: row.make,
      model: row.model,
      fuelType: ["PETROL", "DIESEL", "ELECTRIC", "CNG"].includes(fuelType) ? fuelType : undefined,
      imageUrl: row.imageUrl || undefined,
    });
  }
  return results;
};

function AdminVehicles() {
  const queryClient = useQueryClient();
  const { data: vehicles, isLoading } = useQuery(vehiclesListQuery());
  
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeMake, setActiveMake] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null);

  // Import states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importing, setImporting] = useState(false);

  const PAGE_SIZE = 15;

  const typeFilteredVehicles = activeTab === "ALL" 
    ? vehicles 
    : vehicles?.filter(v => v.vehicleType === activeTab);

  const availableMakes = Array.from(new Set(typeFilteredVehicles?.map(v => v.make) ?? [])).sort();

  const filteredVehicles = activeMake === "ALL"
    ? typeFilteredVehicles
    : typeFilteredVehicles?.filter(v => v.make === activeMake);

  const totalPages = Math.ceil((filteredVehicles?.length || 0) / PAGE_SIZE);
  const paginatedVehicles = filteredVehicles?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleType: "CAR",
      make: "",
      model: "",
    },
  });

  const openAddModal = () => {
    setEditingVehicle(null);
    form.reset({
      vehicleType: "CAR",
      make: "",
      model: "",
      fuelType: undefined,
      imageUrl: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: VehicleResponse) => {
    setEditingVehicle(vehicle);
    form.reset({
      vehicleType: vehicle.vehicleType || "CAR",
      make: vehicle.make,
      model: vehicle.model,
      fuelType: vehicle.fuelType,
      imageUrl: vehicle.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: CreateVehicleRequest) => adminService.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create vehicle"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateVehicleRequest }) => adminService.updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update vehicle"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete vehicle"),
  });

  const onSubmit = form.handleSubmit((values) => {
    const data: CreateVehicleRequest = {
      vehicleType: values.vehicleType,
      make: values.make,
      model: values.model,
      fuelType: values.fuelType,
      imageUrl: values.imageUrl || undefined,
    };

    if (editingVehicle) {
      editMutation.mutate({ id: editingVehicle.vehicleId, data });
    } else {
      addMutation.mutate(data);
    }
  });

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        
        if (parsed.length === 0) {
          toast.error("No valid vehicle rows found in the CSV. Please check formatting.");
          return;
        }

        setImporting(true);
        setImportProgress({ current: 0, total: parsed.length });

        let successCount = 0;
        
        for (let i = 0; i < parsed.length; i++) {
          const vehicle = parsed[i];
          try {
            await adminService.createVehicle(vehicle);
            successCount++;
          } catch (err) {
            console.error(`Failed to import vehicle at row ${i + 1}:`, err);
          }
          setImportProgress({ current: i + 1, total: parsed.length });
        }

        queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        toast.success(`Successfully imported ${successCount} out of ${parsed.length} vehicles!`);
        setIsImportOpen(false);
      } catch (err) {
        toast.error("An error occurred while reading the CSV file.");
      } finally {
        setImporting(false);
        setImportProgress(null);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage compatible vehicles for batteries.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setActiveMake("ALL"); setCurrentPage(1); }} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="ALL" className="rounded-md">All Vehicles</TabsTrigger>
          <TabsTrigger value="CAR" className="rounded-md">Cars</TabsTrigger>
          <TabsTrigger value="BIKE" className="rounded-md">Bikes</TabsTrigger>
          <TabsTrigger value="COMMERCIAL" className="rounded-md">Commercial</TabsTrigger>
          <TabsTrigger value="E_RICKSHAW" className="rounded-md">E-Rickshaws</TabsTrigger>
          <TabsTrigger value="INVERTER" className="rounded-md">Inverters</TabsTrigger>
        </TabsList>
        
        {activeTab !== "ALL" && availableMakes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              variant={activeMake === "ALL" ? "default" : "outline"} 
              size="sm" 
              onClick={() => { setActiveMake("ALL"); setCurrentPage(1); }}
              className="h-7 text-xs rounded-full px-4"
            >
              All Brands
            </Button>
            {availableMakes.map(make => (
              <Button 
                key={make}
                variant={activeMake === make ? "default" : "outline"} 
                size="sm" 
                onClick={() => { setActiveMake(make); setCurrentPage(1); }}
                className="h-7 text-xs rounded-full px-4"
              >
                {make}
              </Button>
            ))}
          </div>
        )}

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Spinner size="sm" className="inline-block mr-2" /> Loading vehicles...
                  </TableCell>
                </TableRow>
              ) : !filteredVehicles?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No vehicles found in this category.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVehicles?.map((vehicle) => (
                  <TableRow key={vehicle.vehicleId}>
                    <TableCell>
                      {vehicle.imageUrl ? (
                        <div className="h-10 w-10 rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center">
                          <img src={vehicle.imageUrl} alt={vehicle.make} className="w-full h-full object-contain p-1" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md border bg-muted/30 flex items-center justify-center text-muted-foreground">
                          <Car className="h-5 w-5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-muted-foreground/20">
                        {vehicle.vehicleType}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{vehicle.make}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.fuelType || "Any"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(vehicle)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the vehicle "{vehicle.make} {vehicle.model}".
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(vehicle.vehicleId)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filteredVehicles?.length || 0)}</span> of{" "}
              <span className="font-medium">{filteredVehicles?.length}</span> results
            </p>
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
                <PaginationItem className="hidden sm:inline-flex px-4 text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Tabs>

      {/* SINGLE ADD / EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <FormField label="Vehicle Type" htmlFor="vehicleType" required error={form.formState.errors.vehicleType?.message}>
              <select
                id="vehicleType"
                {...form.register("vehicleType")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="CAR">Car</option>
                <option value="BIKE">Bike</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="E_RICKSHAW">E-Rickshaw</option>
                <option value="INVERTER">Inverter</option>
              </select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Make" htmlFor="make" required error={form.formState.errors.make?.message}>
                <Input id="make" {...form.register("make")} placeholder="e.g. Maruti Suzuki" />
              </FormField>

              <FormField label="Model" htmlFor="model" required error={form.formState.errors.model?.message}>
                <Input id="model" {...form.register("model")} placeholder="e.g. Swift" />
              </FormField>
            </div>

            <FormField label="Fuel Type" htmlFor="fuelType" error={form.formState.errors.fuelType?.message}>
              <select
                id="fuelType"
                {...form.register("fuelType")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Any</option>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </FormField>

            <FormField label="Image URL" htmlFor="imageUrl" error={form.formState.errors.imageUrl?.message}>
              <Input id="imageUrl" type="url" {...form.register("imageUrl")} placeholder="https://example.com/car.png" />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addMutation.isPending || editMutation.isPending}>
                {(addMutation.isPending || editMutation.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                {editingVehicle ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV IMPORT DIALOG */}
      <Dialog open={isImportOpen} onOpenChange={(open) => !open && !importing && setIsImportOpen(false)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Import Vehicles from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
              <p className="font-semibold text-foreground">CSV Format Guidelines:</p>
              <p className="text-muted-foreground leading-relaxed">
                The CSV file must contain a header row with the following column names (exact case):
                <code className="block mt-1 bg-background p-1.5 rounded border border-border font-mono text-[11px] text-foreground">
                  vehicleType,make,model,fuelType,imageUrl
                </code>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">vehicleType:</strong> CAR, BIKE, COMMERCIAL, E_RICKSHAW, INVERTER</li>
                <li><strong className="text-foreground">fuelType:</strong> PETROL, DIESEL, ELECTRIC, CNG (or leave blank)</li>
                <li><strong className="text-foreground">imageUrl:</strong> Valid image URL (or leave blank)</li>
              </ul>
            </div>

            {importing ? (
              <div className="space-y-3 py-4 text-center">
                <Spinner className="mx-auto" />
                <p className="text-sm font-semibold text-foreground animate-pulse">
                  Importing vehicles...
                </p>
                {importProgress && (
                  <p className="text-xs text-muted-foreground">
                    Progress: {importProgress.current} / {importProgress.total} vehicles (
                    {Math.round((importProgress.current / importProgress.total) * 100)}%)
                  </p>
                )}
                {importProgress && (
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-200" 
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 hover:bg-muted/30 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center space-y-2 text-center pointer-events-none">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium text-foreground">Select CSV File</div>
                    <div className="text-xs text-muted-foreground">Click to browse your files</div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button variant="ghost" onClick={() => setIsImportOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
