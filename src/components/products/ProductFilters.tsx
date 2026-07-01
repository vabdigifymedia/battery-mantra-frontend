import { useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { categoriesQuery, brandsQuery } from "@/queries";

export type ProductFilterState = {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
};

export const emptyFilters: ProductFilterState = {};

type Props = {
  state: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
};

export function ProductFilters({ state, onChange }: Props) {
  const cats = useQuery(categoriesQuery());
  const brands = useQuery(brandsQuery());

  const hasFilters = useMemo(
    () =>
      !!state.categoryId ||
      !!state.brandId ||
      state.minPrice != null ||
      state.maxPrice != null,
    [state],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </h3>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(emptyFilters)}
            className="h-7 px-2 text-xs"
          >
            <X className="h-3.5 w-3.5" /> Reset
          </Button>
        ) : null}
      </div>

      <FilterGroup title="Category">
        <RadioGroup
          value={state.categoryId ?? ""}
          onValueChange={(v) => onChange({ ...state, categoryId: v || undefined })}
          className="space-y-1.5"
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="" id="cat-all" />
            <span>All</span>
          </label>
          {(cats.data ?? []).map((c) => (
            <label key={c.categoryId} className="flex items-center gap-2 text-sm">
              <RadioGroupItem value={c.categoryId} id={`cat-${c.categoryId}`} />
              <span>{c.categoryName}</span>
            </label>
          ))}
        </RadioGroup>
      </FilterGroup>

      <FilterGroup title="Brand">
        <RadioGroup
          value={state.brandId ?? ""}
          onValueChange={(v) => onChange({ ...state, brandId: v || undefined })}
          className="space-y-1.5"
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="" id="brand-all" />
            <span>All</span>
          </label>
          {(brands.data ?? []).map((b) => (
            <label key={b.brandId} className="flex items-center gap-2 text-sm">
              <RadioGroupItem value={b.brandId} id={`brand-${b.brandId}`} />
              <span>{b.brandName}</span>
            </label>
          ))}
        </RadioGroup>
      </FilterGroup>

      <FilterGroup title="Price (₹)">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            min={0}
            value={state.minPrice ?? ""}
            onChange={(e) =>
              onChange({
                ...state,
                minPrice: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            min={0}
            value={state.maxPrice ?? ""}
            onChange={(e) =>
              onChange({
                ...state,
                maxPrice: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export type ProductSort =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

export function sortToApi(sort: ProductSort): { sortBy?: string; sortDir?: "asc" | "desc" } {
  switch (sort) {
    case "price-asc":
      return { sortBy: "productPrice", sortDir: "asc" };
    case "price-desc":
      return { sortBy: "productPrice", sortDir: "desc" };
    case "name-asc":
      return { sortBy: "productName", sortDir: "asc" };
    case "name-desc":
      return { sortBy: "productName", sortDir: "desc" };
    default:
      return {};
  }
}
