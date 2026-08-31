import { useMemo, useState } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { rootCategoriesQuery, brandsQuery, capacitiesQuery } from "@/queries";
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
  products?: any[];
  aggregations?: import("@/types/dto").ProductAggregationsResponse;
  hideCategoryFilter?: boolean;
};

export function ProductFilters({ state, onChange, products, aggregations, hideCategoryFilter }: Props) {
  const [brandSearch, setBrandSearch] = useState("");
  const [capSearch, setCapSearch] = useState("");

  const cats = useQuery(rootCategoriesQuery());
  const selectedCategoryId = state.categoryId?.[0];
  const brands = useQuery(brandsQuery(selectedCategoryId));
  const dynamicCapacities = useQuery(capacitiesQuery(selectedCategoryId));

  // Dynamic Price Range
  const priceRange = useMemo(() => {
    if (!products || products.length === 0) return { min: 0, max: 50000 };
    const prices = products.map(p => p.productPrice).filter(p => typeof p === 'number' && !isNaN(p));
    if (prices.length === 0) return { min: 0, max: 50000 };
    return {
      min: Math.floor(Math.min(...prices) / 500) * 500,
      max: Math.ceil(Math.max(...prices) / 500) * 500
    };
  }, [products]);

  // Dynamic Capacities
  const availableCapacities = useMemo(() => {
    const aggCaps = aggregations?.capacities || (aggregations as any)?.capacity || [];
    if (aggCaps.length) {
      return [...aggCaps].sort((a, b) => {
        const numA = parseInt(String(a));
        const numB = parseInt(String(b));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a).localeCompare(String(b));
      });
    }

    const caps = new Set<string>();
    
    if (dynamicCapacities.data && Array.isArray(dynamicCapacities.data)) {
      dynamicCapacities.data.forEach((c: any) => caps.add(c.capacityName));
    }
    
    if (products) {
      products.forEach((p: any) => {
        const specCap = p.specDetails?.find((s: any) => s.attributeName?.toLowerCase().includes('capacity'))?.value;
        if (specCap) caps.add(String(specCap));
        else if (p.specs) {
          const capKey = Object.keys(p.specs).find(k => k.toLowerCase().includes('capacity') || k.toLowerCase() === 'ah');
          if (capKey) caps.add(String(p.specs[capKey]));
        } else {
          const match = p.productName?.match(/(\d+)\s*(Ah|AH|ah)/i);
          if (match) caps.add(match[0].toUpperCase());
          else {
            const dinMatch = p.productName?.match(/DIN-?(\d+)/i);
            if (dinMatch) caps.add(`${dinMatch[1]} AH`);
          }
        }
      });
    }
    
    return Array.from(caps).length > 0 
      ? Array.from(caps).sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        }) 
      : COMMON_CAPACITIES;
  }, [dynamicCapacities.data, products, aggregations]);

  // Dynamic Warranties
  const availableWarranties = useMemo(() => {
    const aggWars = aggregations?.warranties || (aggregations as any)?.warranty || [];
    if (aggWars.length) {
      return [...aggWars].sort((a, b) => {
        const numA = parseInt(String(a));
        const numB = parseInt(String(b));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a).localeCompare(String(b));
      });
    }

    const wars = new Set<string>();
    if (products) {
      products.forEach((p: any) => {
        let specWar = p.specDetails?.find((s: any) => s.attributeName?.toLowerCase().includes('warranty'))?.value;
        if (!specWar && p.specs) {
          const warKey = Object.keys(p.specs).find(k => k.toLowerCase().includes('warranty') || k.toLowerCase().includes('guarantee'));
          if (warKey) specWar = p.specs[warKey];
        }
        if (specWar) wars.add(String(specWar));
      });
    }
    return Array.from(wars).length > 0 
      ? Array.from(wars).sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        }) 
      : COMMON_WARRANTIES;
  }, [products, aggregations]);

  const getBrandCount = (brandId: string) => {
    if (!products || products.length === 0) return 0;
    const bName = brands.data?.find((b: any) => b.brandId === brandId)?.brandName;
    return products.filter((p: any) => p.brandId === brandId || (bName && p.brandName === bName)).length;
  };

  const getCapCount = (cap: string) => {
    if (!products || products.length === 0) return 0;
    return products.filter((p: any) => {
      const specCap = p.specDetails?.find((s: any) => s.attributeName?.toLowerCase().includes('capacity'))?.value;
      if (specCap && String(specCap) === cap) return true;
      if (p.specs) {
        const capKey = Object.keys(p.specs).find(k => k.toLowerCase().includes('capacity') || k.toLowerCase() === 'ah');
        if (capKey && String(p.specs[capKey]) === cap) return true;
      }
      const match = p.productName?.match(/(\d+)\s*(Ah|AH|ah)/i);
      if (match && match[0].toUpperCase() === cap) return true;
      const dinMatch = p.productName?.match(/DIN-?(\d+)/i);
      if (dinMatch && `${dinMatch[1]} AH` === cap) return true;
      return false;
    }).length;
  };

  const getWarCount = (war: string) => {
    if (!products || products.length === 0) return 0;
    return products.filter((p: any) => {
      let specWar = p.specDetails?.find((s: any) => s.attributeName?.toLowerCase().includes('warranty'))?.value;
      if (!specWar && p.specs) {
        const warKey = Object.keys(p.specs).find(k => k.toLowerCase().includes('warranty') || k.toLowerCase().includes('guarantee'));
        if (warKey) specWar = p.specs[warKey];
      }
      return specWar && String(specWar) === war;
    }).length;
  };

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
        {!hideCategoryFilter && (cats.data && cats.data.length > 0) && (
          <>
            <AccordionItem value="category" className="border-b-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
                Categories
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="max-h-[220px] overflow-y-auto">
                  <CategoryCheckboxTree categories={cats.data} state={state} toggleArrayItem={toggleArrayItem} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <div className="mx-4 h-px bg-border" />
          </>
        )}

        {/* BRANDS */}
        <AccordionItem value="brand" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Brands
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
            <div className="space-y-4 pt-1 max-h-[220px] overflow-y-auto">
              {(brands.data ?? [])
                .filter(b => b.productCount === undefined || b.productCount > 0)
                .filter(b => b.brandName?.toLowerCase().includes(brandSearch.toLowerCase()))
                .map((b) => {
                const isChecked = state.brandId?.includes(b.brandId) || false;
                let count = null;
                let isDisabled = false;

                if (aggregations) {
                  const aggBrands = aggregations.brands || (aggregations as any).brand || (aggregations as any).brandNames || (aggregations as any).brandIds || [];
                  const isAvailable = aggBrands.some((ab: any) => {
                    if (typeof ab === 'string') {
                      return ab === b.brandId || (typeof b.brandName === 'string' && ab.toLowerCase() === b.brandName.toLowerCase());
                    }
                    if (typeof ab === 'object' && ab !== null) {
                      return ab.brandId === b.brandId || ab.brandName === b.brandName;
                    }
                    return false;
                  });
                  isDisabled = !isAvailable && !isChecked;
                } else {
                  count = products ? getBrandCount(b.brandId) : null;
                  isDisabled = count === 0 && !isChecked;
                }
                
                return (
                  <label key={b.brandId} className={cn("flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors", isDisabled && "opacity-50 cursor-not-allowed")}>
                    <Checkbox 
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={() => toggleArrayItem("brandId", b.brandId)}
                    />
                    <span className="flex-1">{b.brandName}</span>
                    {count !== null && <span className="text-xs text-muted-foreground">({count})</span>}
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
          <AccordionContent className="px-4 pb-4">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search capacity..."
                value={capSearch}
                onChange={(e) => setCapSearch(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
            <div className="space-y-4 pt-1 max-h-[220px] overflow-y-auto">
              {availableCapacities
                .filter(cap => cap.toLowerCase().includes(capSearch.toLowerCase()))
                .map((cap) => {
                const isChecked = state.capacity?.includes(cap) || false;
                let count = null;
                let isDisabled = false;

                if (aggregations) {
                  const aggCaps = aggregations.capacities || (aggregations as any).capacity || [];
                  const isAvailable = aggCaps.some((ac: any) => typeof ac === 'string' && typeof cap === 'string' && ac.toLowerCase() === cap.toLowerCase());
                  isDisabled = !isAvailable && !isChecked;
                } else {
                  count = products ? getCapCount(cap) : null;
                  isDisabled = count === 0 && !isChecked;
                }
                
                return (
                  <label key={cap} className={cn("flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors group", isDisabled && "opacity-50 cursor-not-allowed")}>
                    <Checkbox 
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={() => toggleArrayItem("capacity", cap)}
                      className="w-4 h-4"
                    />
                    <span className="flex-1 group-hover:text-primary transition-colors">{cap}</span>
                    {count !== null && <span className="text-xs text-muted-foreground">({count})</span>}
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
              {availableWarranties.map((war) => {
                const isChecked = state.warranty?.includes(war) || false;
                let count = null;
                let isDisabled = false;

                if (aggregations) {
                  const aggWars = aggregations.warranties || (aggregations as any).warranty || [];
                  const isAvailable = aggWars.some((aw: any) => typeof aw === 'string' && typeof war === 'string' && aw.toLowerCase() === war.toLowerCase());
                  isDisabled = !isAvailable && !isChecked;
                } else {
                  count = products ? getWarCount(war) : null;
                  isDisabled = count === 0 && !isChecked;
                }
                
                return (
                  <label key={war} className={cn("flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors", isDisabled && "opacity-50 cursor-not-allowed")}>
                    <Checkbox 
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={() => toggleArrayItem("warranty", war)}
                    />
                    <span className="flex-1">{war}</span>
                    {count !== null && <span className="text-xs text-muted-foreground">({count})</span>}
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
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>₹{priceRange.min.toLocaleString('en-IN')}</span>
                <span>₹{priceRange.max.toLocaleString('en-IN')}</span>
              </div>
              <Slider
                min={priceRange.min}
                max={priceRange.max}
                step={100}
                value={[state.minPrice || priceRange.min, state.maxPrice || priceRange.max]}
                onValueChange={(vals) => {
                  onChange({
                    ...state,
                    minPrice: vals[0] > priceRange.min ? vals[0] : undefined,
                    maxPrice: vals[1] < priceRange.max ? vals[1] : undefined,
                  });
                }}
              />
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">₹</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder={String(priceRange.min)}
                    min={priceRange.min}
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
                    placeholder={String(priceRange.max)}
                    min={priceRange.min}
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

