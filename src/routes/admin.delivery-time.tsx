import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { locationService } from "@/services/location.service";
import { categoriesService } from "@/services/catalog.service";
import { deliveryTimeService, DeliveryTimeRequest } from "@/services/delivery-time.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/delivery-time")({
  component: AdminDeliveryTime,
});

function AdminDeliveryTime() {
  const queryClient = useQueryClient();
  const [grid, setGrid] = useState<Record<string, Record<string, { days: string; hours: string }>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: () => locationService.getAllCities(),
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => categoriesService.list(),
  });

  const { data: deliveryTimes = [], isLoading: isLoadingDeliveryTimes } = useQuery({
    queryKey: ["admin", "delivery-times"],
    queryFn: () => deliveryTimeService.getAllDeliveryTimes(),
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (deliveryTimes.length > 0) {
      const initialGrid: Record<string, Record<string, { days: string; hours: string }>> = {};
      deliveryTimes.forEach(dt => {
        if (!initialGrid[dt.categoryId]) {
          initialGrid[dt.categoryId] = {};
        }
        initialGrid[dt.categoryId][dt.cityId] = { days: dt.days || "", hours: dt.hours || "" };
      });
      setGrid(initialGrid);
      setHasChanges(false);
    }
  }, [deliveryTimes]);

  const updateDeliveryTimesMutation = useMutation({
    mutationFn: (requests: DeliveryTimeRequest[]) => deliveryTimeService.updateDeliveryTimes(requests),
    onSuccess: () => {
      toast.success("Delivery times updated successfully!");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "delivery-times"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update delivery times");
    }
  });

  const handleInputChange = (categoryId: string, cityId: string, field: "days" | "hours", value: string) => {
    setGrid(prev => {
      const currentCityData = prev[categoryId]?.[cityId] || { days: "", hours: "" };
      return {
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          [cityId]: {
            ...currentCityData,
            [field]: value
          }
        }
      };
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const requests: DeliveryTimeRequest[] = [];
    Object.entries(grid).forEach(([categoryId, cityData]) => {
      Object.entries(cityData).forEach(([cityId, data]) => {
        // Only save if there's actual data
        if (data.days || data.hours) {
          requests.push({
            categoryId,
            cityId,
            days: data.days,
            hours: data.hours
          });
        }
      });
    });

    updateDeliveryTimesMutation.mutate(requests);
  };

  const isLoading = isLoadingCities || isLoadingCategories || isLoadingDeliveryTimes;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Delivery Time Matrix</h2>
          <p className="text-muted-foreground mt-1">Configure delivery times based on Product Category and City combinations.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || updateDeliveryTimesMutation.isPending}
          className="shrink-0"
        >
          {updateDeliveryTimesMutation.isPending ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-auto max-h-[70vh] relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-muted shadow-sm">
            <tr>
              <th className="px-4 py-3 font-semibold min-w-[200px] sticky left-0 top-0 bg-muted z-30 border-r border-b">
                Category / City
              </th>
              {cities.map((city) => (
                <th key={city.cityId} className="px-4 py-3 font-semibold min-w-[150px] text-center border-r border-b last:border-0 bg-muted">
                  {city.cityName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.categoryId} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                <td className="px-4 py-3 font-medium sticky left-0 bg-card group-hover:bg-muted/10 z-10 border-r shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                  {category.categoryName}
                </td>
                {cities.map((city) => {
                  const cellData = grid[category.categoryId]?.[city.cityId] || { days: "", hours: "" };
                  return (
                    <td key={city.cityId} className="px-4 py-3 border-r last:border-0">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Days (e.g. 1-2)"
                            className="h-8 w-20 text-xs"
                            value={cellData.days}
                            onChange={(e) => handleInputChange(category.categoryId, city.cityId, "days", e.target.value)}
                          />
                          <span className="text-xs text-muted-foreground w-8">Days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Hours (e.g. 2)"
                            className="h-8 w-20 text-xs"
                            value={cellData.hours}
                            onChange={(e) => handleInputChange(category.categoryId, city.cityId, "hours", e.target.value)}
                          />
                          <span className="text-xs text-muted-foreground w-8">Hours</span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {categories.length === 0 || cities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No categories or cities found. Please add them first.
          </div>
        ) : null}
      </div>
    </div>
  );
}
