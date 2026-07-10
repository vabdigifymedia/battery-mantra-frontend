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
import { Trash2, Plus, Edit, Car } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { VehicleResponse, CreateVehicleRequest, FuelType } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/vehicles")({
  component: AdminVehicles,
});

const vehicleSchema = z.object({
  vehicleType: z.enum(["CAR", "BIKE", "COMMERCIAL", "E_RICKSHAW", "INVERTER"]),
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  yearFrom: z.coerce.number().min(1900).optional().or(z.literal(0)),
  yearTo: z.coerce.number().min(1900).optional().or(z.literal(0)),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "CNG"]).optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

function AdminVehicles() {
  const queryClient = useQueryClient();
  const { data: vehicles, isLoading } = useQuery(vehiclesListQuery());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null);

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
      yearFrom: undefined,
      yearTo: undefined,
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
      yearFrom: vehicle.yearFrom,
      yearTo: vehicle.yearTo,
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
    // Clean up empty years
    const data: CreateVehicleRequest = {
      vehicleType: values.vehicleType,
      make: values.make,
      model: values.model,
      yearFrom: values.yearFrom ? values.yearFrom : undefined,
      yearTo: values.yearTo ? values.yearTo : undefined,
      fuelType: values.fuelType,
      imageUrl: values.imageUrl || undefined,
    };

    if (editingVehicle) {
      editMutation.mutate({ id: editingVehicle.vehicleId, data });
    } else {
      addMutation.mutate(data);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage compatible vehicles for batteries.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Make</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Years</TableHead>
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
            ) : !vehicles?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No vehicles found.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
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
                  <TableCell>
                    {vehicle.yearFrom || vehicle.yearTo
                      ? `${vehicle.yearFrom || "..."} - ${vehicle.yearTo || "..."}`
                      : "All Years"}
                  </TableCell>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Year From" htmlFor="yearFrom" error={form.formState.errors.yearFrom?.message}>
                <Input id="yearFrom" type="number" {...form.register("yearFrom")} placeholder="e.g. 2015" />
              </FormField>

              <FormField label="Year To" htmlFor="yearTo" error={form.formState.errors.yearTo?.message}>
                <Input id="yearTo" type="number" {...form.register("yearTo")} placeholder="e.g. 2023" />
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
    </div>
  );
}
