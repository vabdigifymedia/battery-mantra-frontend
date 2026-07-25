import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
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
import { rootCategoriesQuery, capacitiesQuery, manufacturersListQuery, fuelsQuery } from "@/queries";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  fuelId: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  capacity: z.string().optional(),
  categoryId: z.string().optional(),
  manufacturerId: z.string().optional(),
  description: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const parseCSV = (text: string, dbFuels: any[] = [], manufacturers: any[] = [], rootCategories: any[] = []) => {
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

    const make = row.manufacturer || row.Manufacturer || row.make || row.Make;
    const model = row.model || row.Model;
    if (!make || !model) continue;

    const rawType = (row.vehicle_type || row.vehicleType || "CAR").toUpperCase();
    const vehicleType = ["CAR", "BIKE", "COMMERCIAL", "E_RICKSHAW", "INVERTER"].includes(rawType) ? rawType : "CAR";

    const fuelTypeName = (row.fuel || row.fuel_type || row.fuelType || "").toUpperCase();
    let fuelId = row.fuelId || row.fuel_id;
    if (!fuelId && fuelTypeName) {
      const matchedFuel = dbFuels.find((f: any) => f.fuelName.toUpperCase() === fuelTypeName);
      if (matchedFuel) fuelId = matchedFuel.fuelId;
    }

    let manufacturerId = row.manufacturerId || row.manufacturer_id;
    if (!manufacturerId && make) {
      const matchedMfr = manufacturers.find((m: any) => m.name.toLowerCase() === make.toLowerCase());
      if (matchedMfr) manufacturerId = matchedMfr.id;
    }

    let categoryId = row.categoryId || row.category_id;
    const categoryName = row.category || row.Category;
    if (!categoryId && categoryName) {
      const matchedCat = rootCategories.find((c: any) => c.categoryName.toLowerCase() === categoryName.toLowerCase());
      if (matchedCat) categoryId = matchedCat.categoryId;
    }
    if (!categoryId && vehicleType) {
      const targetNames = vehicleType === "BIKE" ? ["bike", "two wheeler"] : ["car"];
      const matchedCat = rootCategories.find((c: any) => 
        targetNames.some(name => c.categoryName.toLowerCase().includes(name))
      );
      if (matchedCat) categoryId = matchedCat.categoryId;
    }

    results.push({
      vehicleType,
      make,
      model,
      fuelId: fuelId || undefined,
      imageUrl: row.image_url || row.imageUrl || undefined,
      capacity: row.capacity || undefined,
      description: row.description || undefined,
      manufacturerId: manufacturerId || undefined,
      categoryId: categoryId || undefined,
    });
  }
  return results;
};

function AdminVehicles() {
  const queryClient = useQueryClient();
  const { data: vehicles, isLoading } = useQuery(vehiclesListQuery());
  const { data: rootCategories = [] } = useQuery(rootCategoriesQuery());
  const { data: dbCapacities = [] } = useQuery(capacitiesQuery());
  const { data: manufacturers = [] } = useQuery(manufacturersListQuery());
  const { data: dbFuels = [] } = useQuery(fuelsQuery());
  
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeMake, setActiveMake] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

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
      fuelId: "",
      imageUrl: "",
      capacity: "",
      categoryId: "",
      manufacturerId: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    const matchedMfr = manufacturers.find(m => m.id === vehicle.manufacturerId || m.name.toLowerCase() === vehicle.make?.toLowerCase());
    form.reset({
      vehicleType: vehicle.vehicleType || "CAR",
      make: vehicle.make || matchedMfr?.name || "",
      model: vehicle.model,
      fuelId: vehicle.fuelId || "",
      imageUrl: vehicle.imageUrl || "",
      capacity: vehicle.capacity || "",
      categoryId: vehicle.categoryId || "",
      manufacturerId: vehicle.manufacturerId || matchedMfr?.id || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => adminService.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create vehicle"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateVehicle(id, data),
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
    const data: any = {
      vehicleType: values.vehicleType,
      make: values.make,
      model: values.model,
      fuelId: values.fuelId || undefined,
      imageUrl: values.imageUrl || undefined,
      capacity: values.capacity || undefined,
      categoryId: values.categoryId || undefined,
      manufacturerId: values.manufacturerId || undefined,
      description: values.description || undefined,
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
        const parsed = parseCSV(text, dbFuels, manufacturers, rootCategories);
        
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

        {/* Desktop Table */}
        <div className="hidden md:block rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Spinner size="sm" className="inline-block mr-2" /> Loading vehicles...
                  </TableCell>
                </TableRow>
              ) : !filteredVehicles?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                    <TableCell>{vehicle.fuelName || "N/A"}</TableCell>
                    <TableCell>{vehicle.capacity || "-"}</TableCell>
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

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="sm" className="mr-2" /> Loading...
            </div>
          ) : !filteredVehicles?.length ? (
            <div className="text-center py-12 text-muted-foreground">No vehicles found.</div>
          ) : (
            paginatedVehicles?.map((vehicle) => (
              <div key={vehicle.vehicleId} className="rounded-xl border bg-card p-4 shadow-sm flex gap-3">
                <div className="shrink-0">
                  {vehicle.imageUrl ? (
                    <div className="h-16 w-16 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center">
                      <img src={vehicle.imageUrl} alt={vehicle.make} className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground">
                      <Car className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{vehicle.make} {vehicle.model}</h3>
                      <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ring-muted-foreground/20">
                        {vehicle.vehicleType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {vehicle.fuelName && (
                        <span className="text-xs text-muted-foreground">{vehicle.fuelName}</span>
                      )}
                      {vehicle.fuelName && vehicle.capacity && <span className="text-muted-foreground text-xs">•</span>}
                      {vehicle.capacity && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {vehicle.capacity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => openEditModal(vehicle)}>
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{vehicle.make} {vehicle.model}".
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
                  </div>
                </div>
              </div>
            ))
          )}
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category" htmlFor="categoryId" required error={form.formState.errors.categoryId?.message}>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue("manufacturerId", "");
                        form.setValue("make", "");
                      }}
                      value={field.value}
                    >
                      <SelectTrigger id="categoryId" className={form.formState.errors.categoryId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {rootCategories.map((c) => (
                          <SelectItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField label="Manufacturer" htmlFor="manufacturerId" required error={form.formState.errors.manufacturerId?.message || form.formState.errors.make?.message}>
                <Controller
                  control={form.control}
                  name="manufacturerId"
                  render={({ field }) => {
                    const selectedCatId = form.watch("categoryId");
                    const categoryMfrs = selectedCatId
                      ? manufacturers.filter((m) => m.categories?.some((c) => c.categoryId === selectedCatId))
                      : manufacturers;
                    const availableMfrs = categoryMfrs.length > 0 ? categoryMfrs : manufacturers;

                    return (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          const matched = manufacturers.find((m) => m.id === val);
                          if (matched) {
                            form.setValue("make", matched.name);
                          }
                        }}
                      >
                        <SelectTrigger id="manufacturerId" className={form.formState.errors.manufacturerId ? "border-red-500" : ""}>
                          <SelectValue placeholder={selectedCatId ? "Select manufacturer for category" : "Select a manufacturer"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMfrs.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              </FormField>
            </div>

            <FormField label="Model (Name)" htmlFor="model" required error={form.formState.errors.model?.message}>
              <Input id="model" {...form.register("model")} placeholder="e.g. Swift Dzire LDI, 150Ah Tubular" />
            </FormField>

            <FormField label="Vehicle Type" htmlFor="vehicleType" required error={form.formState.errors.vehicleType?.message}>
              <select
                id="vehicleType"
                {...form.register("vehicleType")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="CAR">Car (Four Wheeler)</option>
                <option value="BIKE">Bike (Two Wheeler)</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="E_RICKSHAW">E-Rickshaw</option>
                <option value="INVERTER">Inverter</option>
              </select>
            </FormField>

            <FormField label="Fuel Type" htmlFor="fuelId" error={form.formState.errors.fuelId?.message}>
              <Controller
                control={form.control}
                name="fuelId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="fuelId" className={form.formState.errors.fuelId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Fuel Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {dbFuels.map((fuel) => (
                        <SelectItem key={fuel.fuelId} value={fuel.fuelId}>{fuel.fuelName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <div className="space-y-2">
              <Label>Description</Label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Detailed description..." />
                )}
              />
            </div>

            {(() => {
              const selectedCategoryId = form.watch("categoryId");
              let options = dbCapacities;
              
              if (selectedCategoryId) {
                options = dbCapacities.filter(c => c.categoryId === selectedCategoryId);
              }

              if (options.length === 0) return null;

              return (
                <FormField label="Capacity (RL)" htmlFor="capacity" error={form.formState.errors.capacity?.message}>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 min-h-[28px] p-2 border rounded-md bg-muted/20">
                      {(() => {
                        const rawCap = form.watch("capacity");
                        const currentCapacities = typeof rawCap === "string" && rawCap ? rawCap.split(",").map((c: string) => c.trim()).filter(Boolean) : [];
                        return (
                          <>
                            {currentCapacities.map((cap: string) => (
                              <Badge key={cap} variant="secondary" className="px-2 py-1 flex items-center gap-1 font-normal bg-background border shadow-sm">
                                {cap}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newCaps = currentCapacities.filter((c: string) => c !== cap);
                                    form.setValue("capacity", newCaps.join(","), { shouldDirty: true });
                                  }} 
                                />
                              </Badge>
                            ))}
                            {currentCapacities.length === 0 && (
                              <span className="text-xs text-muted-foreground my-auto ml-1">No capacities added</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    <Select 
                      key={(() => {
                        const rawCap = form.watch("capacity");
                        const currentCapacities = typeof rawCap === "string" && rawCap ? rawCap.split(",").map((c: string) => c.trim()).filter(Boolean) : [];
                        return currentCapacities.length;
                      })()}
                      onValueChange={(val) => {
                        if (!val) return;
                        const rawCap = form.watch("capacity");
                        const currentCapacities = typeof rawCap === "string" && rawCap ? rawCap.split(",").map((c: string) => c.trim()).filter(Boolean) : [];
                        if (!currentCapacities.includes(val)) {
                          form.setValue("capacity", [...currentCapacities, val].join(","), { shouldDirty: true });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Add a capacity..." />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((cap) => (
                          <SelectItem key={cap.capacityId} value={cap.capacityName}>{cap.capacityName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">Add one or more capacity codes for this vehicle to automatically match compatible batteries.</p>
                </FormField>
              );
            })()}

            <Controller
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <CloudinaryUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  folder="battery-mantra/vehicles"
                  label="Vehicle Image URL (Optional)"
                  error={form.formState.errors.imageUrl?.message}
                />
              )}
            />

            <div className="flex justify-end gap-3 pt-6 border-t">
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
                  vehicleType,manufacturer,model,fuel,capacity,imageUrl,category
                </code>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">vehicleType:</strong> CAR, BIKE, COMMERCIAL, E_RICKSHAW, INVERTER</li>
                <li><strong className="text-foreground">fuel:</strong> PETROL, DIESEL, ELECTRIC, CNG (or leave blank)</li>
                <li><strong className="text-foreground">capacity/imageUrl/category:</strong> Optional (or leave blank)</li>
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
