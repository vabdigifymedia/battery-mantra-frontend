import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { capacitiesQuery, rootCategoriesQuery } from "@/queries";
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
import type { CapacityResponse, CreateCapacityRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/capacities")({
  component: AdminCapacities,
});

const capacitySchema = z.object({
  categoryId: z.string().uuid("Category is required"),
  capacityName: z.string().trim().min(1, "Name is required"),
});

type CapacityFormValues = z.infer<typeof capacitySchema>;

function AdminCapacities() {
  const queryClient = useQueryClient();
  const { data: capacities, isLoading } = useQuery(capacitiesQuery());
  const { data: rootCategories = [], isLoading: isLoadingCats } = useQuery(rootCategoriesQuery());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<CapacityResponse | null>(null);

  const form = useForm<CapacityFormValues>({
    resolver: zodResolver(capacitySchema),
    defaultValues: {
      categoryId: "",
      capacityName: "",
    },
  });

  const openAddModal = () => {
    setEditingCapacity(null);
    form.reset({
      categoryId: "",
      capacityName: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (capacity: CapacityResponse) => {
    setEditingCapacity(capacity);
    form.reset({
      categoryId: capacity.categoryId,
      capacityName: capacity.capacityName,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCapacity(null);
    form.reset();
  };

  const addMutation = useMutation({
    mutationFn: (data: CreateCapacityRequest) => adminService.createCapacity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capacities"] });
      toast.success("Capacity created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create capacity"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCapacityRequest }) => adminService.updateCapacity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capacities"] });
      toast.success("Capacity updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update capacity"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCapacity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capacities"] });
      toast.success("Capacity deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete capacity"),
  });

  const onSubmit = form.handleSubmit((data) => {
    if (editingCapacity) {
      editMutation.mutate({ id: editingCapacity.capacityId, data });
    } else {
      addMutation.mutate(data);
    }
  });

  const getCategoryName = (id: string) => {
    const cat = rootCategories.find(c => c.categoryId === id);
    if (cat) return cat.categoryName;
    for (const root of rootCategories) {
      const sub = root.subCategories?.find((s: any) => s.categoryId === id);
      if (sub) return `${root.categoryName} > ${sub.categoryName}`;
    }
    return "Unknown Category";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Capacities (Battery RL)</h1>
          <p className="text-muted-foreground">Manage battery capacity levels (e.g. 35Ah, 65Ah, 150Ah).</p>
        </div>
        <Button onClick={openAddModal} variant="brand">
          <Plus className="mr-2 h-4 w-4" /> Add Capacity
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Capacity Name (RL)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isLoadingCats ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading capacities...
                </TableCell>
              </TableRow>
            ) : !capacities?.length ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No capacities found.
                </TableCell>
              </TableRow>
            ) : (
              capacities.map((capacity) => (
                <TableRow key={capacity.capacityId}>
                  <TableCell className="font-medium text-muted-foreground">
                    {getCategoryName(capacity.categoryId)}
                  </TableCell>
                  <TableCell className="font-semibold">{capacity.capacityName}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(capacity)}>
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
                            This will permanently delete the capacity "{capacity.capacityName}".
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(capacity.capacityId)}
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
            <DialogTitle>{editingCapacity ? "Edit Capacity" : "Add Capacity"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            
            <FormField label="Category" htmlFor="categoryId" required error={form.formState.errors.categoryId?.message}>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="categoryId" className={form.formState.errors.categoryId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {rootCategories.map((root) => (
                        <SelectItem key={root.categoryId} value={root.categoryId}>{root.categoryName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Capacity Name (RL)" htmlFor="capacityName" required error={form.formState.errors.capacityName?.message}>
              <Input id="capacityName" {...form.register("capacityName")} placeholder="e.g. 35L CAR" />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addMutation.isPending || editMutation.isPending}>
                {(addMutation.isPending || editMutation.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                {editingCapacity ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
