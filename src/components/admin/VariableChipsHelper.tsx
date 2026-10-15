import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VariableDef {
  key: string;
  label: string;
  highlight?: boolean;
}

export type VariablePresetType =
  | "SEO_BRANDS"
  | "SEO_CATEGORIES"
  | "SEO_DEALERS"
  | "SEO_MANUFACTURERS"
  | "SEO_MODELS"
  | "SEO_PRODUCTS"
  | "BRAND_CONTENTS"
  | "CATEGORIES"
  | "BRANDS"
  | "MANUFACTURERS"
  | "VEHICLES"
  | "CMS_PAGES"
  | "PRODUCT";

const PRESET_VARIABLES: Record<VariablePresetType, VariableDef[]> = {
  SEO_BRANDS: [
    { key: "{brand_name}", label: "Brand Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "Selected City" },
    { key: "{delivery_time}", label: "Delivery Time (e.g. 2-4 Hours)" },
  ],
  SEO_CATEGORIES: [
    { key: "{category_name}", label: "Category Name" },
    { key: "{manufacturer_name}", label: "Manufacturer Name" },
    { key: "{city_name}", label: "Selected City" },
    { key: "{delivery_time}", label: "Delivery Time (e.g. 2-4 Hours)" },
  ],
  SEO_DEALERS: [
    { key: "{brand_name}", label: "Brand Name" },
    { key: "{category_name}", label: "Category Name (e.g. Batteries, Inverters)" },
    { key: "{city_name}", label: "Selected City" },
    { key: "{delivery_time}", label: "Delivery Time (e.g. 2-4 Hours)" },
  ],
  SEO_MANUFACTURERS: [
    { key: "{manufacturer_name}", label: "Manufacturer (Make e.g. Maruti, BMW)" },
    { key: "{category_name}", label: "Category Name (e.g. Car Batteries)" },
    { key: "{city_name}", label: "Selected City" },
    { key: "{delivery_time}", label: "Delivery Time (e.g. 2-4 Hours)" },
  ],
  SEO_MODELS: [
    { key: "{manufacturer_name}", label: "Manufacturer / Make (e.g. Maruti)" },
    { key: "{model_name}", label: "Model / Sub-Make (e.g. Swift Petrol)" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "Selected City" },
    { key: "{delivery_time}", label: "Delivery Time (e.g. 1-2 Hours)" },
  ],
  SEO_PRODUCTS: [
    { key: "{product_name}", label: "Product Name" },
    { key: "{brand_name}", label: "Brand Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{manufacturer_name}", label: "Manufacturer Name" },
    { key: "{city_name}", label: "Selected City" },
    { key: "{delivery_time}", label: "Delivery Time" },
  ],
  BRAND_CONTENTS: [
    { key: "{city_name}", label: "City Name" },
    { key: "{brand_name}", label: "Brand Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{delivery_time}", label: "Delivery Time (1-2 Hours)" },
    { key: "{price}", label: "Starting Price (With Exchange)", highlight: true },
    { key: "{price_range}", label: "Price Range (With Exchange)", highlight: true },
    { key: "{warranty_range}", label: "Warranty Period" },
  ],
  CATEGORIES: [
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{delivery_time}", label: "Delivery Time" },
    { key: "{price}", label: "Starting Price (With Exchange)", highlight: true },
    { key: "{price_range}", label: "Price Range (With Exchange)", highlight: true },
  ],
  BRANDS: [
    { key: "{brand_name}", label: "Brand Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{delivery_time}", label: "Delivery Time" },
  ],
  MANUFACTURERS: [
    { key: "{manufacturer_name}", label: "Manufacturer Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{delivery_time}", label: "Delivery Time" },
  ],
  VEHICLES: [
    { key: "{manufacturer_name}", label: "Car Make" },
    { key: "{model_name}", label: "Car Model" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{delivery_time}", label: "Delivery Time" },
  ],
  CMS_PAGES: [
    { key: "{city_name}", label: "City Name" },
    { key: "{page_title}", label: "Page Title" },
    { key: "{delivery_time}", label: "Delivery Time" },
  ],
  PRODUCT: [
    { key: "{price}", label: "With Exchange Price", highlight: true },
    { key: "{product_name}", label: "Product Name" },
    { key: "{brand_name}", label: "Brand Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{manufacturer_name}", label: "Manufacturer Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{delivery_time}", label: "Delivery Time" },
    { key: "{warranty}", label: "Warranty Period" },
    { key: "{capacity}", label: "Capacity" },
    { key: "{mrp}", label: "MRP" },
  ],
};

export interface VariableChipsHelperProps {
  type?: VariablePresetType;
  variables?: VariableDef[];
  title?: string;
  subtitle?: string;
  showPriceNote?: boolean;
  compact?: boolean;
  className?: string;
}

export function VariableChipsHelper({
  type,
  variables: customVariables,
  title,
  subtitle = "Click any variable to copy to clipboard",
  showPriceNote,
  compact = false,
  className,
}: VariableChipsHelperProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const variables = customVariables || (type ? PRESET_VARIABLES[type] : []);

  if (!variables || variables.length === 0) return null;

  const handleCopy = (key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(key);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = key;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      toast.success(`Copied ${key} to clipboard`);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch {
      toast.error("Could not copy variable.");
    }
  };

  const hasPriceVariables = variables.some((v) => v.key.includes("price"));
  const displayPriceNote = showPriceNote ?? hasPriceVariables;

  return (
    <div
      className={cn(
        "rounded-xl border bg-muted/40 transition-all",
        compact ? "p-3 space-y-2 text-xs" : "p-4 space-y-3",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <Info className={cn("text-primary shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          <span className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
            {title || "Supported Variables (Use with curly brackets):"}
          </span>
        </div>
        {subtitle && (
          <span className="text-[11px] text-muted-foreground italic">
            {subtitle}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {variables.map((v) => {
          const isCopied = copiedKey === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => handleCopy(v.key)}
              title={`Click to copy ${v.key} (${v.label})`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border font-mono transition-all cursor-pointer shadow-2xs group active:scale-95",
                compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
                v.highlight
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                  : "bg-background text-foreground border-border hover:bg-accent hover:border-primary/40",
                isCopied && "ring-2 ring-emerald-500/50 border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60"
              )}
            >
              <span className="font-bold text-primary dark:text-primary-foreground">
                {v.key}
              </span>
              <span className="text-[10px] sm:text-[11px] font-sans opacity-75">
                ({v.label})
              </span>
              {isCopied ? (
                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {displayPriceNote && (
        <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          💡 <strong>Price Note:</strong> <code>{`{price}`}</code> and <code>{`{price_range}`}</code> dynamically calculate discounted <strong>With Exchange</strong> prices (after deducting old scrap battery rebate).
        </p>
      )}
    </div>
  );
}
