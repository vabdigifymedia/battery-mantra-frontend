import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { locationService } from "@/services/location.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, MapPin, MapPinned, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { CityDto, CreateCityRequest } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/locations")({
  component: AdminLocations,
});

const citySchema = z.object({
  cityName: z.string().min(1, "City Name is required"),
  stateName: z.string().min(1, "State Name is required"),
  cityImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isPopular: z.boolean().default(false),
  isCodAvailable: z.boolean().default(false),
  isExchangeAvailable: z.boolean().default(false),
});

type CityFormValues = z.infer<typeof citySchema>;

function AdminLocations() {
  const queryClient = useQueryClient();
  const { data: cities, isLoading } = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: () => locationService.getAllCities(),
  });
  
  // City Modal State
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityDto | null>(null);

  // Pincode Modal State
  const [selectedCityForPincodes, setSelectedCityForPincodes] = useState<CityDto | null>(null);
  const [pincodeInput, setPincodeInput] = useState("");

  const form = useForm<CityFormValues>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      cityName: "",
      stateName: "",
      cityImage: "",
      isPopular: false,
      isCodAvailable: false,
      isExchangeAvailable: false,
    },
  });

  const openAddCityModal = () => {
    setEditingCity(null);
    form.reset({
      cityName: "",
      stateName: "",
      cityImage: "",
      isPopular: false,
      isCodAvailable: false,
      isExchangeAvailable: false,
    });
    setIsCityModalOpen(true);
  };

  const openEditCityModal = (city: CityDto) => {
    setEditingCity(city);
    form.reset({
      cityName: city.cityName,
      stateName: city.stateName,
      cityImage: city.cityImage ?? "",
      isPopular: city.isPopular,
      isCodAvailable: city.isCodAvailable,
      isExchangeAvailable: city.isExchangeAvailable,
    });
    setIsCityModalOpen(true);
  };

  const closeCityModal = () => {
    setIsCityModalOpen(false);
    setEditingCity(null);
    form.reset();
  };

  const invalidateCities = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "cities"] });
  };

  const addCityMutation = useMutation({
    mutationFn: (data: CreateCityRequest) => locationService.createCity(data),
    onSuccess: () => {
      invalidateCities();
      toast.success("City added successfully");
      closeCityModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to add city"),
  });

  const editCityMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCityRequest }) => locationService.updateCity(id, data),
    onSuccess: () => {
      invalidateCities();
      toast.success("City updated successfully");
      closeCityModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update city"),
  });

  const deleteCityMutation = useMutation({
    mutationFn: (id: string) => locationService.deleteCity(id),
    onSuccess: () => {
      invalidateCities();
      toast.success("City deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete city"),
  });

  const onSubmitCity = form.handleSubmit((values) => {
    const payload: CreateCityRequest = {
      ...values,
      cityImage: values.cityImage || undefined,
    };

    if (editingCity) {
      editCityMutation.mutate({ id: editingCity.cityId, data: payload });
    } else {
      addCityMutation.mutate(payload);
    }
  });

  // --- Pincode Management ---
  const { data: pincodes, isLoading: isLoadingPincodes } = useQuery({
    queryKey: ["admin", "cities", selectedCityForPincodes?.cityId, "pincodes"],
    queryFn: () => locationService.getPincodesForCity(selectedCityForPincodes!.cityId),
    enabled: !!selectedCityForPincodes,
  });

  const addPincodeMutation = useMutation({
    mutationFn: (codes: string[]) => locationService.addPincodesToCity(selectedCityForPincodes!.cityId, { codes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", selectedCityForPincodes?.cityId, "pincodes"] });
      invalidateCities(); // To update the pincodeCount in the main table
      toast.success("Pincodes added successfully");
      setPincodeInput("");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to add pincodes"),
  });

  const deletePincodeMutation = useMutation({
    mutationFn: (id: string) => locationService.deletePincode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", selectedCityForPincodes?.cityId, "pincodes"] });
      invalidateCities();
      toast.success("Pincode deleted successfully");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete pincode"),
  });

  const handleAddPincodes = () => {
    if (!pincodeInput.trim()) return;
    const codes = pincodeInput.split(",").map(c => c.trim()).filter(Boolean);
    if (codes.length > 0) {
      addPincodeMutation.mutate(codes);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground mt-2">Manage serviceable cities and pincodes.</p>
        </div>
        <Button onClick={openAddCityModal} className="gap-2">
          <Plus className="h-4 w-4" /> Add City
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Service Status</TableHead>
              <TableHead>Pincodes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No cities found. Add your first city to get started.
                </TableCell>
              </TableRow>
            ) : (
              cities?.map((city) => (
                <TableRow key={city.cityId}>
                  <TableCell>
                    {city.cityImage ? (
                      <div className="w-16 h-12 rounded-md overflow-hidden border">
                        <img src={city.cityImage} alt={city.cityName} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-md overflow-hidden border bg-gradient-to-br from-brand/10 to-brand/30 flex items-center justify-center text-brand font-bold text-xl">
                        {city.cityName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{city.cityName}</TableCell>
                  <TableCell>{city.stateName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {city.isPopular && <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Popular</Badge>}
                      {city.isCodAvailable ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">COD Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">COD No</Badge>
                      )}
                      {city.isExchangeAvailable ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Exchange Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Exchange No</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setSelectedCityForPincodes(city)}
                      className="gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      {city.pincodeCount} Pincodes
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditCityModal(city)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {city.cityName}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the city and all its associated pincodes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteCityMutation.mutate(city.cityId)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* City Create/Edit Modal */}
      <Dialog open={isCityModalOpen} onOpenChange={setIsCityModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCity ? "Edit City" : "Add New City"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitCity} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="City Name"
                error={form.formState.errors.cityName?.message}
                required
              >
                <Input {...form.register("cityName")} placeholder="e.g. Gurgaon" />
              </FormField>
              <FormField
                label="State Name"
                error={form.formState.errors.stateName?.message}
                required
              >
                <Input {...form.register("stateName")} placeholder="e.g. Haryana" />
              </FormField>
            </div>

            <FormField
              label="City Image URL (Optional)"
              error={form.formState.errors.cityImage?.message}
            >
              <Input {...form.register("cityImage")} placeholder="https://..." />
            </FormField>

            <div className="space-y-4 pt-4 pb-2">
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Popular City</label>
                  <p className="text-xs text-muted-foreground">Highlight this city on the homepage.</p>
                </div>
                <Switch
                  checked={form.watch("isPopular")}
                  onCheckedChange={(val) => form.setValue("isPopular", val, { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">COD Available</label>
                  <p className="text-xs text-muted-foreground">Allow Cash on Delivery in this city.</p>
                </div>
                <Switch
                  checked={form.watch("isCodAvailable")}
                  onCheckedChange={(val) => form.setValue("isCodAvailable", val, { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Exchange Available</label>
                  <p className="text-xs text-muted-foreground">Allow old battery exchange in this city.</p>
                </div>
                <Switch
                  checked={form.watch("isExchangeAvailable")}
                  onCheckedChange={(val) => form.setValue("isExchangeAvailable", val, { shouldDirty: true })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeCityModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={addCityMutation.isPending || editCityMutation.isPending}>
                {(addCityMutation.isPending || editCityMutation.isPending) && <Spinner className="mr-2" size="sm" />}
                {editingCity ? "Update City" : "Save City"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pincode Management Modal */}
      <Dialog open={!!selectedCityForPincodes} onOpenChange={(open) => !open && setSelectedCityForPincodes(null)}>
        <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-brand" />
              Manage Pincodes: {selectedCityForPincodes?.cityName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 overflow-hidden py-4">
            {/* Add Pincode Section */}
            <div className="flex gap-2">
              <Input 
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                placeholder="Enter pincodes (comma separated e.g. 110001, 110002)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPincodes();
                  }
                }}
              />
              <Button onClick={handleAddPincodes} disabled={!pincodeInput.trim() || addPincodeMutation.isPending}>
                {addPincodeMutation.isPending ? <Spinner size="sm" /> : "Add"}
              </Button>
            </div>

            {/* Pincodes List */}
            <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md bg-muted/20 p-4">
              {isLoadingPincodes ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : pincodes?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No pincodes added yet for this city.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {pincodes?.map((pin) => (
                    <Badge key={pin.pincodeId} variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-2 bg-white border shadow-sm">
                      {pin.code}
                      <button 
                        onClick={() => deletePincodeMutation.mutate(pin.pincodeId)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        disabled={deletePincodeMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
