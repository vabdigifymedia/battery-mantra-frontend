import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { vehiclesListQuery } from "@/queries";
import { Spinner } from "@/components/feedback/Spinner";
import { ErrorState } from "@/components/feedback/ErrorState";
import { cn } from "@/lib/utils";
import type { VehicleResponse } from "@/types/dto";

export type VehicleSelection = {
  vehicleType: string | null;
  make: string | null;
  vehicleId: string | null;
};

export const emptyVehicleSelection: VehicleSelection = {
  vehicleType: null,
  make: null,
  vehicleId: null,
};

type Props = {
  value: VehicleSelection;
  onChange: (next: VehicleSelection) => void;
  compact?: boolean;
};

export function VehicleStepper({ value, onChange, compact }: Props) {
  const vehicles = useQuery(vehiclesListQuery());

  const types = Array.from(new Set((vehicles.data ?? []).map((v) => v.vehicleType || "CAR"))).sort();
  const makesForType = value.vehicleType
    ? Array.from(new Set((vehicles.data ?? []).filter((v) => (v.vehicleType || "CAR") === value.vehicleType).map((v) => v.make))).sort()
    : [];
  const modelsForMake = value.vehicleType && value.make
    ? (vehicles.data ?? []).filter((v) => (v.vehicleType || "CAR") === value.vehicleType && v.make === value.make)
    : [];

  const formatType = (type: string) => {
    switch (type) {
      case "CAR": return "Car";
      case "BIKE": return "Bike";
      case "COMMERCIAL": return "Commercial";
      case "E_RICKSHAW": return "E-Rickshaw";
      case "INVERTER": return "Inverter";
      default: return type;
    }
  };

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <StepRow label="Vehicle Type" stepIndex={1} done={value.vehicleType != null}>
        {vehicles.isLoading ? (
          <Loading />
        ) : vehicles.isError ? (
          <ErrorState title="Failed to load vehicles" />
        ) : types.length === 0 ? (
          <Empty />
        ) : (
          <Chips
            items={types.map((t) => ({ id: t, label: formatType(t) }))}
            activeId={value.vehicleType}
            onSelect={(id) => onChange({ vehicleType: id, make: null, vehicleId: null })}
          />
        )}
      </StepRow>

      {value.vehicleType ? (
        <StepRow label="Make" stepIndex={2} done={value.make != null}>
          {makesForType.length === 0 ? (
            <Empty />
          ) : (
            <Chips
              items={makesForType.map((m) => ({ id: m, label: m }))}
              activeId={value.make}
              onSelect={(id) => onChange({ ...value, make: String(id), vehicleId: null })}
            />
          )}
        </StepRow>
      ) : null}

      {value.make ? (
        <StepRow label="Model" stepIndex={3} done={value.vehicleId != null}>
          {modelsForMake.length === 0 ? (
            <Empty />
          ) : (
            <Chips
              items={modelsForMake.map((v) => ({
                id: v.vehicleId,
                label: v.model,
                meta: [
                  v.fuelType,
                  v.yearFrom && v.yearTo ? `${v.yearFrom}–${v.yearTo}` : v.yearFrom || v.yearTo,
                ]
                  .filter(Boolean)
                  .join(" · "),
                imageUrl: v.imageUrl,
              }))}
              activeId={value.vehicleId}
              onSelect={(id) => onChange({ ...value, vehicleId: String(id) })}
            />
          )}
        </StepRow>
      ) : null}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-3">
      <Spinner size="sm" />
    </div>
  );
}
function Empty() {
  return <p className="py-1 text-sm text-muted-foreground">No options available.</p>;
}

function StepRow({
  stepIndex,
  label,
  done,
  children,
}: {
  stepIndex: number;
  label: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span
          className={cn(
            "grid h-5 w-5 place-items-center rounded-full text-[10px]",
            done ? "bg-success text-success-foreground" : "bg-primary-soft text-primary",
          )}
        >
          {done ? <Check className="h-3 w-3" /> : stepIndex}
        </span>
        {label}
        <ChevronRight className="h-3 w-3 opacity-50" />
      </div>
      {children}
    </div>
  );
}

type ChipItem = { id: string; label: string; meta?: string; imageUrl?: string | null };

function Chips({
  items,
  activeId,
  onSelect,
}: {
  items: ChipItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface hover:border-primary/40 hover:bg-primary-soft",
            )}
          >
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.label} className="w-8 h-8 object-contain bg-white rounded flex-shrink-0" />
            )}
            <div className="flex flex-col items-start text-left">
              <span className="font-medium leading-tight">{item.label}</span>
              {item.meta ? (
                <span className={cn("text-[10px]", active ? "opacity-90" : "text-muted-foreground")}>
                  {item.meta}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
