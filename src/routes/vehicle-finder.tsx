import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeading } from "@/components/layout/SectionHeading";
import {
  VehicleStepper,
  emptyVehicleSelection,
  type VehicleSelection,
} from "@/components/vehicle-finder/VehicleStepper";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { productFilterQuery, vehiclesListQuery, productListQuery, pageSeoQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";

const searchSchema = z.object({
  vehicleId: z.string().optional(),
});

export const Route = createFileRoute("/vehicle-finder")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(vehiclesListQuery());
    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/vehicle-finder"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: "Vehicle Finder — BatteryMantra",
      description:
        "Find the perfect battery for your car, bike or commercial vehicle. Select make and model to see compatible options.",
    }),
  component: VehicleFinderPage,
});

function VehicleFinderPage() {
  const search = Route.useSearch();
  const vehicles = useQuery(vehiclesListQuery());

  const initialFromSearch = (): VehicleSelection => {
    if (!search.vehicleId) return emptyVehicleSelection;
    const found = (vehicles.data ?? []).find((v) => v.vehicleId === search.vehicleId);
    return found
      ? { vehicleType: found.vehicleType || "CAR", make: found.make, vehicleId: found.vehicleId }
      : { vehicleType: null, make: null, vehicleId: search.vehicleId ?? null };
  };
  const [selection, setSelection] = useState<VehicleSelection>(initialFromSearch);

  useEffect(() => {
    if (search.vehicleId && vehicles.data) {
      const found = vehicles.data.find((v) => v.vehicleId === search.vehicleId);
      if (found && found.vehicleId !== selection.vehicleId) {
        setSelection({ vehicleType: found.vehicleType || "CAR", make: found.make, vehicleId: found.vehicleId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.vehicleId, vehicles.data]);

  const allProducts = useQuery(productListQuery());
  
  const selectedVehicle = vehicles.data?.find((v) => v.vehicleId === selection.vehicleId);
  const vehicleCapacities = selectedVehicle?.capacity 
    ? selectedVehicle.capacity.split(",").map(c => c.trim()).filter(Boolean)
    : [];

  const compatibleProducts = (allProducts.data as any[])?.filter(p => {
    if (!p.capacity) return false;
    return vehicleCapacities.includes(p.capacity);
  });

  const compat = useQuery({
    ...productFilterQuery({ vehicleId: selection.vehicleId ?? undefined, size: 40 }),
    enabled: !!selection.vehicleId && vehicleCapacities.length === 0, // Fallback to backend filter if no capacity set
  });

  const displayProducts = vehicleCapacities.length > 0 ? compatibleProducts : compat.data?.content;
  const isLoadingProducts = vehicleCapacities.length > 0 ? allProducts.isLoading : compat.isLoading;
  const isErrorProducts = vehicleCapacities.length > 0 ? allProducts.isError : compat.isError;

  return (
    <div>
      <PageHeader
        title="Find your battery"
        description="Tell us about your vehicle and we'll show you compatible batteries instantly."
      />
      <Container size="xl" className="grid gap-10 py-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          <SectionHeading
            title="Your vehicle"
            description="Pick the make, then choose the model."
          />
          <VehicleStepper value={selection} onChange={setSelection} />
        </div>

        <div className="min-w-0">
          <SectionHeading
            title="Compatible batteries"
            description={
              selection.vehicleId
                ? "These batteries fit your selected vehicle."
                : "Complete the steps to see matching batteries."
            }
          />
          <div className="mt-6">
            {!selection.vehicleId ? (
              <EmptyState
                title="Pick your model"
                description="Choose your vehicle make and model on the left to see compatible batteries."
              />
            ) : isErrorProducts ? (
              <ErrorState
                title="Couldn't load batteries"
                description="Please try again in a moment."
                onRetry={() => {
                  void compat.refetch();
                  void allProducts.refetch();
                }}
              />
            ) : (
              <ProductGrid
                products={displayProducts}
                loading={isLoadingProducts}
                emptyTitle="No batteries available"
                emptyDescription="No batteries are listed for this vehicle yet."
              />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
