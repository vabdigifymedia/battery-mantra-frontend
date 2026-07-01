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
import { productFilterQuery, vehiclesListQuery } from "@/queries";

const searchSchema = z.object({
  vehicleId: z.string().optional(),
});

export const Route = createFileRoute("/vehicle-finder")({
  head: () => ({
    meta: [
      { title: "Vehicle Finder — BatteryMantra" },
      {
        name: "description",
        content:
          "Find the perfect battery for your car, bike or commercial vehicle. Select make and model to see compatible options.",
      },
    ],
  }),
  validateSearch: searchSchema,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(vehiclesListQuery());
  },
  component: VehicleFinderPage,
});

function VehicleFinderPage() {
  const search = Route.useSearch();
  const vehicles = useQuery(vehiclesListQuery());

  const initialFromSearch = (): VehicleSelection => {
    if (!search.vehicleId) return emptyVehicleSelection;
    const found = (vehicles.data ?? []).find((v) => v.vehicleId === search.vehicleId);
    return found
      ? { make: found.make, vehicleId: found.vehicleId }
      : { make: null, vehicleId: search.vehicleId ?? null };
  };
  const [selection, setSelection] = useState<VehicleSelection>(initialFromSearch);

  useEffect(() => {
    if (search.vehicleId && vehicles.data) {
      const found = vehicles.data.find((v) => v.vehicleId === search.vehicleId);
      if (found && found.vehicleId !== selection.vehicleId) {
        setSelection({ make: found.make, vehicleId: found.vehicleId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.vehicleId, vehicles.data]);

  const compat = useQuery({
    ...productFilterQuery({ vehicleId: selection.vehicleId ?? undefined, size: 40 }),
    enabled: !!selection.vehicleId,
  });

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
            ) : compat.isError ? (
              <ErrorState
                title="Couldn't load batteries"
                description="Please try again in a moment."
                onRetry={() => void compat.refetch()}
              />
            ) : (
              <ProductGrid
                products={compat.data?.content}
                loading={compat.isLoading}
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
