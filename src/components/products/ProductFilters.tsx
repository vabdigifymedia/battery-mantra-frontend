import { useMemo, useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { rootCategoriesQuery, brandsQuery } from "@/queries";
import type { CategoryListResponse } from "@/types/dto";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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
  const cats = useQuery(rootCategoriesQuery());
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

      <Accordion type="multiple" defaultValue={["category", "brand", "price"]} className="w-full">
        {/* CATEGORIES */}
        <AccordionItem value="category" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Categories
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <RadioGroup
              value={state.categoryId ?? ""}
              onValueChange={(v) => onChange({ ...state, categoryId: v || undefined })}
              className="space-y-2"
            >
              <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">
                <RadioGroupItem value="" id="cat-all" className="scale-110" />
                <span>All Categories</span>
              </label>
              {cats.data && <CategoryRadioTree categories={cats.data} />}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <div className="mx-4 h-px bg-border" />

        {/* BRANDS */}
        <AccordionItem value="brand" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Brands
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <RadioGroup
              value={state.brandId ?? ""}
              onValueChange={(v) => onChange({ ...state, brandId: v || undefined })}
              className="space-y-2"
            >
              <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">
                <RadioGroupItem value="" id="brand-all" className="scale-110" />
                <span>All Brands</span>
              </label>
              {(brands.data ?? []).map((b) => (
                <label key={b.brandId} className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary transition-colors">
                  <RadioGroupItem value={b.brandId} id={`brand-${b.brandId}`} className="scale-110" />
                  <span>{b.brandName}</span>
                </label>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <div className="mx-4 h-px bg-border" />

        {/* PRICE */}
        <AccordionItem value="price" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 font-semibold uppercase tracking-wide text-xs">
            Price Range
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">₹</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Min"
                  min={0}
                  className="pl-7 h-9 text-sm rounded-md bg-muted/20"
                  value={state.minPrice ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      minPrice: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>
              <span className="text-muted-foreground text-xs">to</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">₹</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Max"
                  min={0}
                  className="pl-7 h-9 text-sm rounded-md bg-muted/20"
                  value={state.maxPrice ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      maxPrice: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
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

function CategoryNode({ c, depth = 0 }: { c: CategoryListResponse; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = c.subCategories && c.subCategories.length > 0;

  return (
    <div>
      <label
        className={cn(
          "flex items-center justify-between text-sm cursor-pointer hover:text-primary transition-colors py-0.5",
          depth > 0 && "text-muted-foreground"
        )}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') return;
          setIsExpanded((prev) => !prev);
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <RadioGroupItem
            value={c.categoryId}
            id={`cat-${c.categoryId}`}
            className="scale-110"
            onClick={(e) => e.stopPropagation()}
          />
          <span>{c.categoryName}</span>
        </div>
        {hasChildren && (
          <button
            type="button"
            className="p-1 hover:bg-muted/50 rounded-md transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform shrink-0", isExpanded ? "rotate-180" : "-rotate-90")} />
          </button>
        )}
      </label>
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          <CategoryRadioTree categories={c.subCategories} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

function CategoryRadioTree({ categories, depth = 0 }: { categories: CategoryListResponse[]; depth?: number }) {
  const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <>
      {sorted.map((c) => (
        <CategoryNode key={c.categoryId} c={c} depth={depth} />
      ))}
    </>
  );
}

