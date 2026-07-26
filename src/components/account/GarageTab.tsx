import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Car, Trash2, Search, Plus, BatteryCharging } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { userVehiclesService } from "@/services/userVehicles.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/feedback/Spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  vehicleType: z.enum(["CAR", "BIKE", "COMMERCIAL", "E_RICKSHAW", "INVERTER"]),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  modelName: z.string().min(1, "Model name is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  nickname: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function GarageTab() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["userVehicles"],
    queryFn: ({ signal }) => userVehiclesService.list(signal),
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleType: "CAR",
      manufacturer: "",
      modelName: "",
      fuelType: "",
      nickname: "",
    },
  });

  const addVehicleMutation = useMutation({
    mutationFn: userVehiclesService.add,
    onSuccess: () => {
      toast.success("Vehicle added successfully");
      queryClient.invalidateQueries({ queryKey: ["userVehicles"] });
      setIsAdding(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add vehicle");
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: userVehiclesService.delete,
    onSuccess: () => {
      toast.success("Vehicle removed");
      queryClient.invalidateQueries({ queryKey: ["userVehicles"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove vehicle");
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">My Garage</h3>
          <p className="text-sm text-muted-foreground">Save your vehicles to easily find compatible batteries.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Add New Vehicle</CardTitle>
          </CardHeader>
          <form onSubmit={form.handleSubmit((data) => addVehicleMutation.mutate(data))}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Vehicle Type" htmlFor="vehicleType" error={form.formState.errors.vehicleType?.message}>
                <Select
                  value={form.watch("vehicleType")}
                  onValueChange={(val: any) => form.setValue("vehicleType", val)}
                >
                  <SelectTrigger id="vehicleType" className="bg-background">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAR">Car</SelectItem>
                    <SelectItem value="BIKE">Bike</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    <SelectItem value="E_RICKSHAW">E-Rickshaw</SelectItem>
                    <SelectItem value="INVERTER">Inverter</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Manufacturer (e.g. Maruti Suzuki)" htmlFor="manufacturer" error={form.formState.errors.manufacturer?.message}>
                <Input id="manufacturer" {...form.register("manufacturer")} className="bg-background" />
              </FormField>

              <FormField label="Model (e.g. Swift Dzire)" htmlFor="modelName" error={form.formState.errors.modelName?.message}>
                <Input id="modelName" {...form.register("modelName")} className="bg-background" />
              </FormField>

              <FormField label="Fuel Type" htmlFor="fuelType" error={form.formState.errors.fuelType?.message}>
                <Input id="fuelType" {...form.register("fuelType")} className="bg-background" />
              </FormField>

              <FormField label="Nickname (Optional)" htmlFor="nickname" className="md:col-span-2">
                <Input id="nickname" placeholder="e.g. My Daily Driver" {...form.register("nickname")} className="bg-background" />
              </FormField>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 pt-0">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={addVehicleMutation.isPending}>
                {addVehicleMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
                Save Vehicle
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : vehicles?.length === 0 && !isAdding ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Your garage is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              Add your car or bike to quickly find compatible batteries without searching every time.
            </p>
            <Button onClick={() => setIsAdding(true)} variant="brand">
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles?.map((vehicle) => (
            <Card key={vehicle.id} className="relative overflow-hidden group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{vehicle.nickname || `${vehicle.manufacturer} ${vehicle.modelName}`}</CardTitle>
                    {vehicle.nickname && (
                      <p className="text-sm text-muted-foreground mt-0.5">{vehicle.manufacturer} {vehicle.modelName}</p>
                    )}
                  </div>
                  <span className="bg-muted text-muted-foreground text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                    {vehicle.vehicleType}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <BatteryCharging className="w-4 h-4" />
                  Fuel: <span className="font-medium text-foreground">{vehicle.fuelType}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t mt-4 bg-muted/10 px-6 py-3 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 -ml-2"
                  onClick={() => {
                    if (window.confirm("Remove this vehicle?")) {
                      deleteVehicleMutation.mutate(vehicle.id);
                    }
                  }}
                  disabled={deleteVehicleMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
                <Button size="sm" asChild>
                  <Link to="/products" search={{ q: vehicle.modelName }}>
                    <Search className="w-4 h-4 mr-2" /> Find Battery
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
