import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight, ShieldCheck } from "lucide-react";
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

  const currentStep = !selection.vehicleType ? 1 : !selection.make ? 2 : 3;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 space-y-4">
      {/* Header with Title and Step Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-gray-900 leading-snug">
              Find Your Battery
            </h3>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              Pick your vehicle make and model to see compatible batteries.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/15">
          Step {currentStep} of 3
        </span>
      </div>

      {/* Stepper with selectors */}
      <VehicleStepper value={selection} onChange={setSelection} compact showSearch />

      {/* Trust micro-text */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>100% Factory Warranty &amp; Zero Fitment Mismatch Guarantee</span>
      </div>

      {/* Action Button */}
      <Button
        variant="brand"
        className="w-full h-12 text-sm sm:text-base font-bold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        disabled={!canFind}
        onClick={() =>
          canFind &&
          navigate({
            to: "/vehicle-finder",
            search: { vehicleId: selection.vehicleId ?? undefined },
          })
        }
      >
        <span>Show Compatible Batteries</span>
        <ArrowRight className="h-4 w-4 ml-0.5" />
      </Button>
    </div>
  );
}
