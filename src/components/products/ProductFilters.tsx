import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { rootCategoriesQuery, brandsQuery } from "@/queries";
import type { CategoryListResponse } from "@/types/dto";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type ProductFilterState = {
  categoryId?: string[];
  brandId?: string[];
  minPrice?: number;
  maxPrice?: number;
  capacity?: string[];
  warranty?: string[];
};

export const emptyFilters: ProductFilterState = {
  categoryId: [],
  brandId: [],
  capacity: [],
  warranty: [],
};

const COMMON_CAPACITIES = [
  "35 Ah", "40 Ah", "45 Ah", "50 Ah", "55 Ah", "60 Ah", "65 Ah", "70 Ah", "80 Ah", "100 Ah", "135 Ah", "150 Ah", "160 Ah", "200 Ah", "220 Ah", "230 Ah"
];

const COMMON_WARRANTIES = [
  "18 Months", "24 Months", "36 Months", "42 Months", "48 Months", "54 Months", "60 Months", "66 Months", "72 Months"
];

type Props = {
  state: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
};

export function ProductFilters({ state, onChange }: Props) {
  const cats = useQuery(rootCategoriesQuery());
  const brands = useQuery(brandsQuery());

  const hasFilters = useMemo(
    () =>
      (state.categoryId && state.categoryId.length > 0) ||
      (state.brandId && state.brandId.length > 0) ||
      (state.capacity && state.capacity.length > 0) ||
      (state.warranty && state.warranty.length > 0) ||
      state.minPrice != null ||
      state.maxPrice != null,
    [state],
  );

  const toggleArrayItem = (key: keyof ProductFilterState, value: string) => {
    const current = (state[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    
    onChange({ ...state, [key]: updated });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
        <h3 className="inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(emptyFilters)}
            className="h-7 px-2 text-xs font-semibold text-primary hover:text-primary/80 uppercase"
          >
            Clear All
          </Button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["category", "brand", "capacity", "warranty", "price"]} className="w-full">
        
        {/* CATEGORIES */}
        <AccordionItem value="category" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Categories
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              {cats.data && <CategoryCheckboxTree categories={cats.data} state={state} toggleArrayItem={toggleArrayItem} />}
            </div>
          </AccordionContent>
        </AccordionItem>
        <div className="mx-4 h-px bg-border" />

        {/* BRANDS */}
        <AccordionItem value="brand" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Brands
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 max-h-[250px] overflow-y-auto">
            <div className="space-y-4 pt-1">
              {(brands.data ?? []).map((b) => {
                const isChecked = state.brandId?.includes(b.brandId) || false;
                return (
                  <label key={b.brandId} className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={() => toggleArrayItem("brandId", b.brandId)}
                    />
                    <span>{b.brandName}</span>
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        <div className="mx-4 h-px bg-border" />

        {/* CAPACITY */}
        <AccordionItem value="capacity" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Capacity (Ah)
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 max-h-[250px] overflow-y-auto pt-1">
            <div className="grid grid-cols-2 gap-3">
              {COMMON_CAPACITIES.map((cap) => {
                const isChecked = state.capacity?.includes(cap) || false;
                return (
                  <label key={cap} className="flex items-center gap-2 text-xs font-medium cursor-pointer group">
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={() => toggleArrayItem("capacity", cap)}
                      className="w-4 h-4"
                    />
                    <span className="group-hover:text-primary transition-colors">{cap}</span>
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        <div className="mx-4 h-px bg-border" />

        {/* WARRANTY */}
        <AccordionItem value="warranty" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Warranty
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 max-h-[250px] overflow-y-auto pt-1">
            <div className="space-y-4">
              {COMMON_WARRANTIES.map((war) => {
                const isChecked = state.warranty?.includes(war) || false;
                return (
                  <label key={war} className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={() => toggleArrayItem("warranty", war)}
                    />
                    <span>{war}</span>
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        <div className="mx-4 h-px bg-border" />

        {/* PRICE */}
        <AccordionItem value="price" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Price Range
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6 mt-2">
              <Slider
                min={0}
                max={50000}
                step={500}
                value={[state.minPrice || 0, state.maxPrice || 50000]}
                onValueChange={(vals) => {
                  onChange({
                    ...state,
                    minPrice: vals[0] > 0 ? vals[0] : undefined,
                    maxPrice: vals[1] < 50000 ? vals[1] : undefined,
                  });
                }}
              />
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">₹</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Min"
                    min={0}
                    value={state.minPrice || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      onChange({ ...state, minPrice: val });
                    }}
                    className="pl-6 h-9 text-xs"
                  />
                </div>
                <span className="text-muted-foreground text-xs font-medium">to</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">₹</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Max"
                    min={0}
                    value={state.maxPrice || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      onChange({ ...state, maxPrice: val });
                    }}
                    className="pl-6 h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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

function CategoryCheckboxTree({
  categories,
  depth = 0,
  state,
  toggleArrayItem
}: {
  categories: CategoryListResponse[];
  depth?: number;
  state: ProductFilterState;
  toggleArrayItem: (key: keyof ProductFilterState, value: string) => void;
}) {
  return (
    <div className={cn(depth > 0 && "ml-5 space-y-3 mt-3 border-l-2 border-border/50 pl-3")}>
      {categories.map((c) => {
        const isChecked = state.categoryId?.includes(c.categoryId) || false;
        return (
          <div key={c.categoryId} className={cn("space-y-3", depth === 0 && "mb-3")}>
            <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors group pt-1">
              <Checkbox 
                checked={isChecked}
                onCheckedChange={() => toggleArrayItem("categoryId", c.categoryId)}
              />
              <span className={cn(depth === 0 ? "font-medium" : "text-muted-foreground group-hover:text-primary")}>
                {c.categoryName}
              </span>
            </label>
            {c.subCategories && c.subCategories.length > 0 && (
              <CategoryCheckboxTree categories={c.subCategories} depth={depth + 1} state={state} toggleArrayItem={toggleArrayItem} />
            )}
          </div>
        );
      })}
    </div>
  );
}

