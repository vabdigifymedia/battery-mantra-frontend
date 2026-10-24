import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VariableDef {
  key: string;
  label: string;
  highlight?: boolean;
}

const VARIABLES_BY_PAGE_TYPE: Record<string, VariableDef[]> = {
  PRODUCT: [
    { key: "{price}", label: "With Exchange Price", highlight: true },
    { key: "{product_name}", label: "Product Name" },
    { key: "{brand_name}", label: "Brand Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{warranty}", label: "Warranty Period" },
    { key: "{capacity}", label: "Capacity (e.g. 35 Ah)" },
    { key: "{mrp}", label: "MRP" },
  ],
  CATEGORY: [
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{price_range}", label: "With Exchange Price Range", highlight: true },
    { key: "{price}", label: "Starting Price (With Exchange)", highlight: true },
    { key: "{delivery_time}", label: "Delivery Time (e.g. 1-2 Hours)" },
  ],
  BRAND: [
    { key: "{brand_name}", label: "Brand Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{price_range}", label: "With Exchange Price Range", highlight: true },
    { key: "{price}", label: "Starting Price (With Exchange)", highlight: true },
    { key: "{delivery_time}", label: "Delivery Time" },
  ],
  MANUFACTURER_MODEL: [
    { key: "{brand_name}", label: "Car Make (e.g. Maruti)" },
    { key: "{model_name}", label: "Car Model (e.g. Swift)" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
    { key: "{price_range}", label: "With Exchange Price Range", highlight: true },
    { key: "{price}", label: "Starting Price (With Exchange)", highlight: true },
  ],
  MANUFACTURER: [
    { key: "{manufacturer_name}", label: "Manufacturer Name" },
    { key: "{category_name}", label: "Category Name" },
    { key: "{city_name}", label: "City Name" },
  ],
  UNIVERSAL: [
    { key: "{city_name}", label: "City Name" },
    { key: "{delivery_time}", label: "Delivery Time" },
  ],
};

interface FaqVariableHelperProps {
  pageType?: string;
}

export function FaqVariableHelper({ pageType }: FaqVariableHelperProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!pageType || !VARIABLES_BY_PAGE_TYPE[pageType]) {
    return (
      <div className="p-3 bg-muted/40 rounded-lg border text-xs text-muted-foreground flex items-center gap-2">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span>Select a <strong>Page Type</strong> above to see supported dynamic variables in curly bracket format <code>{`{...}`}</code>.</span>
      </div>
    );
  }

  const variables = VARIABLES_BY_PAGE_TYPE[pageType];

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success(`Copied ${key} to clipboard`);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  return (
    <div className="p-4 bg-muted/50 rounded-xl border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Supported Variables for <span className="text-primary">{pageType}</span> (Use with curly brackets):
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">Click any variable to copy</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {variables.map((v) => {
          const isCopied = copiedKey === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => handleCopy(v.key)}
              title={`Click to copy ${v.key}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all border shadow-2xs ${v.highlight
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                  : "bg-background text-foreground border-border hover:bg-accent hover:border-primary/40"
                }`}
            >
              <span className="font-bold">{v.key}</span>
              <span className="text-[11px] font-sans opacity-70">({v.label})</span>
              {isCopied ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
        💡 <strong>Price Note:</strong> <code>{`{price}`}</code> and <code>{`{price_range}`}</code> automatically calculate and display the discounted <strong>With Exchange</strong> price (after deducting old scrap battery rebate).
      </p>
    </div>
  );
}
