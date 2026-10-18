import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { reelsService } from "@/services/reels.service";
import { reelsKeys } from "@/queries/reels";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, Instagram } from "lucide-react";
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
import type { ReelResponse, CreateReelRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/reels")({
  component: AdminReels,
});

const reelSchema = z.object({
  url: z.string().url("Must be a valid URL").min(1, "URL is required"),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().default(0),
});

type ReelFormValues = z.infer<typeof reelSchema>;

function AdminReels() {
  const queryClient = useQueryClient();
  const { data: reels, isLoading } = useQuery({
    queryKey: reelsKeys.admin(),
    queryFn: () => reelsService.getAll(),
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelResponse | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<ReelFormValues>({
    resolver: zodResolver(reelSchema) as any,
    defaultValues: {
      url: "",
      isActive: true,
      displayOrder: 0,
    },
  });

  const getNextDisplayOrder = () => {
    if (!reels || reels.length === 0) return 1;
    return Math.max(...reels.map((r) => r.displayOrder ?? 0)) + 1;
  };

  const openAddModal = () => {
    setEditingReel(null);
    setShowAdvanced(false);
    form.reset({
      url: "",
      isActive: true,
      displayOrder: getNextDisplayOrder(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (reel: ReelResponse) => {
    setEditingReel(reel);
    setShowAdvanced(false);
    form.reset({
      url: reel.url,
      isActive: reel.isActive ?? true,
      displayOrder: reel.displayOrder ?? 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReel(null);
    setShowAdvanced(false);
    form.reset();
  };

  const invalidateReels = () => {
    queryClient.invalidateQueries({ queryKey: reelsKeys.admin() });
    queryClient.invalidateQueries({ queryKey: reelsKeys.active() });
  };

  const addMutation = useMutation({
    mutationFn: (data: CreateReelRequest) => reelsService.create(data),
    onSuccess: () => {
      invalidateReels();
      toast.success("Reel created successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create reel"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateReelRequest }) => reelsService.update(id, data),
    onSuccess: () => {
      invalidateReels();
      toast.success("Reel updated successfully");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update reel"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reelsService.delete(id),
    onSuccess: () => {
      invalidateReels();
      toast.success("Reel deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete reel"),
  });

  const onSubmit = form.handleSubmit((values) => {
    const payload: CreateReelRequest = {
      url: values.url,
      isActive: values.isActive,
      displayOrder: values.displayOrder,
    };

    if (editingReel) {
      editMutation.mutate({ id: editingReel.reelId, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  });

  const sortedReels = [...(reels || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Instagram Reels</h2>
          <p className="text-muted-foreground">Manage Instagram Reels displayed on the homepage.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Reel
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Platform</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading reels...
                </TableCell>
              </TableRow>
            ) : !sortedReels?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No reels found.
                </TableCell>
              </TableRow>
            ) : (
              sortedReels.map((reel) => (
                <TableRow key={reel.reelId}>
                  <TableCell>
                    <div className="h-10 w-10 flex items-center justify-center rounded-md bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                      <Instagram className="h-5 w-5" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <a href={reel.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {reel.url}
                    </a>
                  </TableCell>
                  <TableCell>{reel.displayOrder}</TableCell>
                  <TableCell>
                    {reel.isActive ? (
                      <span className="rounded bg-success/20 px-2 py-1 text-xs font-medium text-success">Active</span>
                    ) : (
                      <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(reel)}>
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
                            This will permanently delete the reel.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(reel.reelId)}
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
            <DialogTitle>{editingReel ? "Edit Reel" : "Add Reel"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            
            <FormField label="Instagram Reel URL" htmlFor="url" required hint="e.g. https://www.instagram.com/reel/C-aBcdEfgH1/" error={form.formState.errors.url?.message}>
              <Input id="url" {...form.register("url")} placeholder="https://www.instagram.com/reel/..." />
            </FormField>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" {...form.register("isActive")} />
              <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active (Visible on Homepage)</label>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none cursor-pointer"
            >
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </button>

            {showAdvanced && (
              <div className="space-y-4 border-t border-border pt-4 animate-in fade-in duration-200">
                <FormField label="Display Order" htmlFor="displayOrder" required hint="Lower numbers show first (auto-incremented)" error={form.formState.errors.displayOrder?.message}>
                  <Input id="displayOrder" type="number" {...form.register("displayOrder")} />
                </FormField>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addMutation.isPending || editMutation.isPending}>
                {(addMutation.isPending || editMutation.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                {editingReel ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

