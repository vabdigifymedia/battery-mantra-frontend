import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { vehiclesListQuery } from "@/queries";
import { Spinner } from "@/components/feedback/Spinner";
import { ErrorState } from "@/components/feedback/ErrorState";
import { cn } from "@/lib/utils";
import type { VehicleResponse } from "@/types/dto";

export type VehicleSelection = {
  make: string | null;
  vehicleId: string | null;
};

export const emptyVehicleSelection: VehicleSelection = {
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

  const makes = Array.from(new Set((vehicles.data ?? []).map((v) => v.make))).sort();
  const modelsForMake: VehicleResponse[] = value.make
    ? (vehicles.data ?? []).filter((v) => v.make === value.make)
    : [];

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <StepRow label="Make" stepIndex={1} done={value.make != null}>
        {vehicles.isLoading ? (
          <Loading />
        ) : vehicles.isError ? (
          <ErrorState title="Failed to load vehicles" />
        ) : makes.length === 0 ? (
          <Empty />
        ) : (
          <Chips
            items={makes.map((m) => ({ id: m, label: m }))}
            activeId={value.make}
            onSelect={(id) => onChange({ make: String(id), vehicleId: null })}
          />
        )}
      </StepRow>

      {value.make ? (
        <StepRow label="Model" stepIndex={2} done={value.vehicleId != null}>
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

type ChipItem = { id: string; label: string; meta?: string };

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
            <span className="font-medium">{item.label}</span>
            {item.meta ? (
              <span className={cn("text-xs", active ? "opacity-90" : "text-muted-foreground")}>
                {item.meta}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
