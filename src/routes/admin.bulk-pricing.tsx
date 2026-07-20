import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { bulkPricingService } from "@/services/bulk-pricing.service";

export const Route = createFileRoute("/admin/bulk-pricing")({
  component: BulkPricingPage,
});

function BulkPricingPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [percentages, setPercentages] = useState<Record<string, number>>({});

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminService.getCategories,
  });

  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ["admin", "brands"],
    queryFn: adminService.getBrands,
  });

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: adminService.getLocations,
  });

  const { data: matrixData, isLoading: loadingMatrix } = useQuery({
    queryKey: ["admin", "bulk-pricing", selectedCategory, selectedBrand],
    queryFn: () => bulkPricingService.getMatrix(selectedCategory, selectedBrand),
    enabled: !!selectedCategory && !!selectedBrand,
  });

  useEffect(() => {
    if (matrixData) {
      const newPercentages: Record<string, number> = {};
      matrixData.forEach(item => {
        newPercentages[item.cityId] = item.percentage;
      });
      setPercentages(newPercentages);
    } else {
      setPercentages({});
    }
  }, [matrixData, selectedCategory, selectedBrand]);

  const updateMutation = useMutation({
    mutationFn: bulkPricingService.updateMatrix,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bulk-pricing"] });
    },
    onError: (error) => {
      toast.error("Failed to update percentage");
      console.error(error);
    },
  });

  const handleSave = (cityId: string) => {
    if (!selectedCategory || !selectedBrand) {
      toast.error("Please select both a Category and a Brand.");
      return;
    }
    const val = percentages[cityId];
    if (val === undefined || val === null || val <= 0) {
      toast.error("Please enter a valid percentage greater than 0");
      return;
    }
    
    updateMutation.mutate({
      categoryId: selectedCategory,
      brandId: selectedBrand,
      cityId: cityId,
      percentage: val,
    }, {
      onSuccess: () => {
        toast.success("Pricing updated! All matching products have been recalculated.");
      }
    });
  };

  const handlePercentageChange = (cityId: string, value: string) => {
    const parsed = parseFloat(value);
    setPercentages(prev => ({
      ...prev,
      [cityId]: isNaN(parsed) ? 0 : parsed
    }));
  };

  if (loadingCategories || loadingBrands || loadingLocations) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing %</h1>
        <p className="text-muted-foreground mt-2">
          Set a markup percentage for a Category + Brand combination. The system will automatically recalculate and round the prices for all cities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Products</CardTitle>
          <CardDescription>Choose the category and brand you want to apply bulk pricing to.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.brandId} value={b.brandId}>
                      {b.brandName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCategory && selectedBrand && (
        <Card>
          <CardHeader>
            <CardTitle>City Markup Matrix</CardTitle>
            <CardDescription>Enter the percentage (e.g., 115 for 115%) to apply to the base price.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMatrix ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase sticky top-0 z-10 text-xs">
                    <tr>
                      <th className="px-6 py-4 font-medium border-b w-1/2">City</th>
                      <th className="px-6 py-4 font-medium border-b w-1/4">Without %</th>
                      <th className="px-6 py-4 font-medium border-b w-1/4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((city) => (
                      <tr key={city.cityId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-medium">{city.cityName}</td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={percentages[city.cityId] || ""}
                              onChange={(e) => handlePercentageChange(city.cityId, e.target.value)}
                              className="pr-8 h-9"
                              placeholder="e.g. 115"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            disabled={updateMutation.isPending}
                            onClick={() => handleSave(city.cityId)}
                            className="w-24"
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
