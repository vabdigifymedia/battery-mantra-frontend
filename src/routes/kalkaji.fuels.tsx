import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fuelsQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit } from "lucide-react";
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
import type { FuelResponse, CreateFuelRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/fuels")({
  component: AdminFuels,
});

const fuelSchema = z.object({
  fuelName: z.string().trim().min(1, "Name is required"),
});

type FuelFormValues = z.infer<typeof fuelSchema>;

function AdminFuels() {
  const queryClient = useQueryClient();
  const { data: fuels, isLoading } = useQuery(fuelsQuery());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuel, setEditingFuel] = useState<FuelResponse | null>(null);

  const form = useForm<FuelFormValues>({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      fuelName: "",
    },
  });

  const openAddModal = () => {
    setEditingFuel(null);
    form.reset({
      fuelName: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (fuel: FuelResponse) => {
    setEditingFuel(fuel);
    form.reset({
      fuelName: fuel.fuelName,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFuel(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: CreateFuelRequest) => adminService.createFuel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "fuels"] });
      toast.success("Fuel created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create fuel"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFuelRequest }) => adminService.updateFuel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "fuels"] });
      toast.success("Fuel updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update fuel"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteFuel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "fuels"] });
      toast.success("Fuel deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete fuel"),
  });

  const onSubmit = form.handleSubmit((data) => {
    if (editingFuel) {
      editMutation.mutate({ id: editingFuel.fuelId, data });
    } else {
      addMutation.mutate(data);
    }
  });



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuels</h1>
          <p className="text-muted-foreground">Manage vehicle fuel types (e.g. Petrol, Diesel, CNG).</p>
        </div>
        <Button onClick={openAddModal} variant="brand">
          <Plus className="mr-2 h-4 w-4" /> Add Fuel
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fuel Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading fuels...
                </TableCell>
              </TableRow>
            ) : !fuels?.length ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                  No fuels found.
                </TableCell>
              </TableRow>
            ) : (
              fuels.map((fuel) => (
                <TableRow key={fuel.fuelId}>
                  <TableCell className="font-semibold">{fuel.fuelName}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(fuel)}>
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
                            This will permanently delete the fuel "{fuel.fuelName}".
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(fuel.fuelId)}
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
            <DialogTitle>{editingFuel ? "Edit Fuel" : "Add Fuel"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            


            <FormField label="Fuel Name" htmlFor="fuelName" required error={form.formState.errors.fuelName?.message}>
              <Input id="fuelName" {...form.register("fuelName")} placeholder="e.g. Petrol" />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addMutation.isPending || editMutation.isPending}>
                {(addMutation.isPending || editMutation.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                {editingFuel ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
