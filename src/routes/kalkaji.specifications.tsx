import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { rootCategoriesQuery } from "@/queries";
import { specService } from "@/services/spec.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, ChevronRight, Layers, ClipboardList, Tag, Edit } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
  SpecCategoryResponse,
  SpecAttributeResponse,
  SpecUnitResponse,
} from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/specifications")({
  component: AdminSpecifications,
});

// ---------- Schemas ----------
const specCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const specAttributeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const specUnitSchema = z.object({
  value: z.string().trim().min(1, "Value is required"),
});

// ---------- Drill-down levels ----------
type DrillLevel = "categories" | "attributes" | "units";

function AdminSpecifications() {
  const queryClient = useQueryClient();
  const { data: rootCategories = [], isLoading: isLoadingCats } = useQuery(rootCategoriesQuery());

  // State: product category selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");

  // State: drill-down navigation
  const [drillLevel, setDrillLevel] = useState<DrillLevel>("categories");
  const [selectedSpecCategory, setSelectedSpecCategory] = useState<SpecCategoryResponse | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<SpecAttributeResponse | null>(null);

  // State: modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editItemId, setEditItemId] = useState<string | null>(null);

  // ---------- Queries ----------
  const specCategoriesQuery = useQuery({
    queryKey: ["specs", "categories", selectedCategoryId],
    queryFn: () => specService.getSpecCategories(selectedCategoryId),
    enabled: !!selectedCategoryId,
  });

  const specAttributesQuery = useQuery({
    queryKey: ["specs", "attributes", selectedSpecCategory?.id],
    queryFn: () => specService.getSpecAttributes(selectedSpecCategory!.id),
    enabled: !!selectedSpecCategory?.id,
  });

  const specUnitsQuery = useQuery({
    queryKey: ["specs", "units", selectedAttribute?.id],
    queryFn: () => specService.getSpecUnits(selectedAttribute!.id),
    enabled: !!selectedAttribute?.id,
  });

  // ---------- Forms ----------
  const categoryForm = useForm<z.infer<typeof specCategorySchema>>({
    resolver: zodResolver(specCategorySchema),
    defaultValues: { name: "" },
  });

  const attributeForm = useForm<z.infer<typeof specAttributeSchema>>({
    resolver: zodResolver(specAttributeSchema),
    defaultValues: { name: "" },
  });

  const unitForm = useForm<z.infer<typeof specUnitSchema>>({
    resolver: zodResolver(specUnitSchema),
    defaultValues: { value: "" },
  });

  // ---------- Mutations ----------
  const createSpecCategoryMutation = useMutation({
    mutationFn: specService.createSpecCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "categories", selectedCategoryId] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Spec Category created");
      setIsModalOpen(false);
      categoryForm.reset();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create"),
  });

  const deleteSpecCategoryMutation = useMutation({
    mutationFn: specService.deleteSpecCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "categories", selectedCategoryId] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Spec Category deleted");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete"),
  });

  const createSpecAttributeMutation = useMutation({
    mutationFn: specService.createSpecAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "attributes", selectedSpecCategory?.id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Attribute created");
      setIsModalOpen(false);
      attributeForm.reset();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create"),
  });

  const deleteSpecAttributeMutation = useMutation({
    mutationFn: specService.deleteSpecAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "attributes", selectedSpecCategory?.id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Attribute deleted");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete"),
  });

  const createSpecUnitMutation = useMutation({
    mutationFn: specService.createSpecUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "units", selectedAttribute?.id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Unit value created");
      setIsModalOpen(false);
      unitForm.reset();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create"),
  });

  const deleteSpecUnitMutation = useMutation({
    mutationFn: specService.deleteSpecUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "units", selectedAttribute?.id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Unit value deleted");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete"),
  });

  const updateSpecCategoryMutation = useMutation({
    mutationFn: (data: { id: string; body: any }) => specService.updateSpecCategory(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "categories", selectedCategoryId] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Spec Category updated");
      setIsModalOpen(false);
      categoryForm.reset();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"),
  });

  const updateSpecAttributeMutation = useMutation({
    mutationFn: (data: { id: string; body: any }) => specService.updateSpecAttribute(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "attributes", selectedSpecCategory?.id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Attribute updated");
      setIsModalOpen(false);
      attributeForm.reset();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"),
  });

  const updateSpecUnitMutation = useMutation({
    mutationFn: (data: { id: string; body: any }) => specService.updateSpecUnit(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", "units", selectedAttribute?.id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Unit value updated");
      setIsModalOpen(false);
      unitForm.reset();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"),
  });

  // ---------- Handlers ----------
  const handleCategorySelect = (catId: string) => {
    const cat = rootCategories.find((c) => c.categoryId === catId);
    setSelectedCategoryId(catId);
    setSelectedCategoryName(cat?.categoryName || "");
    setDrillLevel("categories");
    setSelectedSpecCategory(null);
    setSelectedAttribute(null);
  };

  const handleSpecCategoryClick = (sc: SpecCategoryResponse) => {
    setSelectedSpecCategory(sc);
    setSelectedAttribute(null);
    setDrillLevel("attributes");
  };

  const handleAttributeClick = (attr: SpecAttributeResponse) => {
    setSelectedAttribute(attr);
    setDrillLevel("units");
  };

  const navigateTo = (level: DrillLevel) => {
    setDrillLevel(level);
    if (level === "categories") {
      setSelectedSpecCategory(null);
      setSelectedAttribute(null);
    } else if (level === "attributes") {
      setSelectedAttribute(null);
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditItemId(null);
    if (drillLevel === "categories") categoryForm.reset({ name: "" });
    else if (drillLevel === "attributes") attributeForm.reset({ name: "" });
    else unitForm.reset({ value: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode("edit");
    setEditItemId(item.id);
    if (drillLevel === "categories") categoryForm.reset({ name: item.name });
    else if (drillLevel === "attributes") attributeForm.reset({ name: item.name });
    else unitForm.reset({ value: item.value });
    setIsModalOpen(true);
  };

  const handleAddSubmit = () => {
    if (drillLevel === "categories") {
      categoryForm.handleSubmit((data) => {
        if (modalMode === "edit" && editItemId) {
          updateSpecCategoryMutation.mutate({ id: editItemId, body: { name: data.name, categoryId: selectedCategoryId } });
        } else {
          createSpecCategoryMutation.mutate({ name: data.name, categoryId: selectedCategoryId });
        }
      })();
    } else if (drillLevel === "attributes") {
      attributeForm.handleSubmit((data) => {
        if (modalMode === "edit" && editItemId) {
          updateSpecAttributeMutation.mutate({
            id: editItemId,
            body: { name: data.name, specCategoryId: selectedSpecCategory!.id, categoryId: selectedCategoryId },
          });
        } else {
          createSpecAttributeMutation.mutate({
            name: data.name,
            specCategoryId: selectedSpecCategory!.id,
            categoryId: selectedCategoryId,
          });
        }
      })();
    } else {
      unitForm.handleSubmit((data) => {
        if (modalMode === "edit" && editItemId) {
          updateSpecUnitMutation.mutate({
            id: editItemId,
            body: { value: data.value, specAttributeId: selectedAttribute!.id, specCategoryId: selectedSpecCategory!.id, categoryId: selectedCategoryId },
          });
        } else {
          createSpecUnitMutation.mutate({
            value: data.value,
            specAttributeId: selectedAttribute!.id,
            specCategoryId: selectedSpecCategory!.id,
            categoryId: selectedCategoryId,
          });
        }
      })();
    }
  };

  const isAddPending = 
    createSpecCategoryMutation.isPending || 
    createSpecAttributeMutation.isPending || 
    createSpecUnitMutation.isPending ||
    updateSpecCategoryMutation.isPending ||
    updateSpecAttributeMutation.isPending ||
    updateSpecUnitMutation.isPending;

  // ---------- Computed ----------
  const currentData =
    drillLevel === "categories"
      ? specCategoriesQuery.data
      : drillLevel === "attributes"
        ? specAttributesQuery.data
        : specUnitsQuery.data;

  const isLoadingData =
    drillLevel === "categories"
      ? specCategoriesQuery.isLoading
      : drillLevel === "attributes"
        ? specAttributesQuery.isLoading
        : specUnitsQuery.isLoading;

  const levelLabels: Record<DrillLevel, { singular: string; plural: string; icon: React.ReactNode }> = {
    categories: { singular: "Spec Category", plural: "Spec Categories", icon: <Layers className="h-4 w-4" /> },
    attributes: { singular: "Attribute", plural: "Attributes", icon: <ClipboardList className="h-4 w-4" /> },
    units: { singular: "Unit / Option", plural: "Units / Options", icon: <Tag className="h-4 w-4" /> },
  };

  const currentLevel = levelLabels[drillLevel];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Specifications</h1>
          <p className="text-muted-foreground">Manage structured product specifications — categories, attributes, and unit values.</p>
        </div>
      </div>

      {/* Category Selector */}
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground shrink-0">Product Category:</label>
            <Select value={selectedCategoryId} onValueChange={handleCategorySelect}>
              <SelectTrigger className="sm:max-w-xs">
                <SelectValue placeholder="Select a product category..." />
              </SelectTrigger>
              <SelectContent>
                {rootCategories.map((root) => (
                  <SelectItem key={root.categoryId} value={root.categoryId}>{root.categoryName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategoryName && (
              <Badge variant="secondary" className="text-xs shrink-0">{selectedCategoryName}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedCategoryId ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Select a product category above to manage its specifications.
        </div>
      ) : (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm flex-wrap">
            <button
              onClick={() => navigateTo("categories")}
              className={`font-medium transition-colors ${drillLevel === "categories" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {selectedCategoryName}
            </button>
            {selectedSpecCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <button
                  onClick={() => navigateTo("attributes")}
                  className={`font-medium transition-colors ${drillLevel === "attributes" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {selectedSpecCategory.name}
                </button>
              </>
            )}
            {selectedAttribute && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium text-primary">{selectedAttribute.name}</span>
              </>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {currentLevel.icon}
              {currentLevel.plural}
              {currentData && (
                <Badge variant="outline" className="ml-1 text-xs">{(currentData as any[]).length}</Badge>
              )}
            </h2>
            <Button onClick={openAddModal} variant="brand" size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add {currentLevel.singular}
            </Button>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{drillLevel === "units" ? "Value" : "Name"}</TableHead>
                  {drillLevel === "categories" && <TableHead className="hidden sm:table-cell">Category</TableHead>}
                  {drillLevel === "attributes" && <TableHead className="hidden sm:table-cell">Spec Category</TableHead>}
                  {drillLevel === "units" && <TableHead className="hidden sm:table-cell">Attribute</TableHead>}
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData || isLoadingCats ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <Spinner size="sm" className="inline-block mr-2" /> Loading...
                    </TableCell>
                  </TableRow>
                ) : !currentData || (currentData as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No {currentLevel.plural.toLowerCase()} found. Click "Add {currentLevel.singular}" to create one.
                    </TableCell>
                  </TableRow>
                ) : drillLevel === "categories" ? (
                  (currentData as SpecCategoryResponse[]).map((sc) => (
                    <TableRow
                      key={sc.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSpecCategoryClick(sc)}
                    >
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                          {sc.name}
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{sc.categoryName}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditModal(sc); }} className="text-muted-foreground hover:text-foreground hover:bg-muted/80">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            itemName={sc.name}
                            onDelete={() => deleteSpecCategoryMutation.mutate(sc.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : drillLevel === "attributes" ? (
                  (currentData as SpecAttributeResponse[]).map((attr) => (
                    <TableRow
                      key={attr.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleAttributeClick(attr)}
                    >
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                          {attr.name}
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{attr.specCategoryName}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditModal(attr); }} className="text-muted-foreground hover:text-foreground hover:bg-muted/80">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            itemName={attr.name}
                            onDelete={() => deleteSpecAttributeMutation.mutate(attr.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  (currentData as SpecUnitResponse[]).map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                          {unit.value}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{unit.specAttributeName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditModal(unit); }} className="text-muted-foreground hover:text-foreground hover:bg-muted/80">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            itemName={unit.value}
                            onDelete={() => deleteSpecUnitMutation.mutate(unit.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === "add" ? "Add" : "Edit"} {currentLevel.singular}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddSubmit();
            }}
            className="space-y-4 pt-4"
          >
            {drillLevel === "categories" && (
              <FormField label="Spec Category Name" htmlFor="specCatName" required error={categoryForm.formState.errors.name?.message}>
                <Input
                  id="specCatName"
                  placeholder="e.g. Technical Details, Warranty Terms, Dimensions"
                  {...categoryForm.register("name")}
                />
              </FormField>
            )}
            {drillLevel === "attributes" && (
              <>
                <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
                  Adding attribute under: <strong>{selectedSpecCategory?.name}</strong>
                </div>
                <FormField label="Attribute Name" htmlFor="attrName" required error={attributeForm.formState.errors.name?.message}>
                  <Input
                    id="attrName"
                    placeholder="e.g. Capacity, Height, Free Replacement Period"
                    {...attributeForm.register("name")}
                  />
                </FormField>
              </>
            )}
            {drillLevel === "units" && (
              <>
                <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg space-y-0.5">
                  <div>Spec Category: <strong>{selectedSpecCategory?.name}</strong></div>
                  <div>Attribute: <strong>{selectedAttribute?.name}</strong></div>
                </div>
                <FormField label="Unit / Option Value" htmlFor="unitVal" required error={unitForm.formState.errors.value?.message}>
                  <Input
                    id="unitVal"
                    placeholder="e.g. 150Ah, 12V, 36 Months, Left Layout"
                    {...unitForm.register("value")}
                  />
                </FormField>
              </>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={isAddPending}>
                {isAddPending ? <Spinner size="sm" className="mr-2" /> : null}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Delete Confirmation Button ----------
function DeleteButton({ itemName, onDelete }: { itemName: string; onDelete: () => void }) {
  return (
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
            This will permanently delete "{itemName}" and all its child data.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
