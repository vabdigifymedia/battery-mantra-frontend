import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  VehicleStepper,
  emptyVehicleSelection,
  type VehicleSelection,
} from "@/components/vehicle-finder/VehicleStepper";

export function VehicleFinderWidget() {
  const navigate = useNavigate();
  const [selection, setSelection] = useState<VehicleSelection>(emptyVehicleSelection);
  const canFind = selection.vehicleId != null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-product sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Search className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold">Find my battery</h3>
          <p className="text-xs text-muted-foreground">
            Pick your vehicle make and model to see compatible batteries.
          </p>
        </div>
      </div>
      <VehicleStepper value={selection} onChange={setSelection} compact />
      <Button
        variant="brand"
        className="mt-4 w-full"
        disabled={!canFind}
        onClick={() =>
          canFind &&
          navigate({
            to: "/vehicle-finder",
            search: { vehicleId: selection.vehicleId ?? undefined },
          })
        }
      >
        Show compatible batteries
      </Button>
    </div>
  );
}
