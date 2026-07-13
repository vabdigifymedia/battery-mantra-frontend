import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { rootCategoriesQuery, brandsQuery, vehiclesListQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import type { CreateProductRequest } from "@/types/dto";

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductImportModal({ isOpen, onClose }: ProductImportModalProps) {
  const queryClient = useQueryClient();
  const { data: categories } = useQuery(rootCategoriesQuery());
  const { data: brands } = useQuery(brandsQuery());
  const { data: vehicles } = useQuery(vehiclesListQuery());

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        if (rows.length === 0) {
          toast.error("No valid data found in CSV.");
          return;
        }

        setImporting(true);
        setProgress({ current: 0, total: rows.length });
        let successCount = 0;
        let skipCount = 0;
        const missingMappings = new Set<string>();

        const CATEGORY_ALIASES: Record<string, string> = {
          "car battery": "car batteries",
          "two wheeler batteries": "2 wheeler batteries",
          "ac voltage stabilizers": "ac voltage stabilizer",
          "e riksha battery": "e-rickshaw batteries"
        };

        const BRAND_ALIASES: Record<string, string> = {
          "sf sonic": "sf batteries",
          "powerzone": "power zone",
          "unknown": ""
        };

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            // Mapping Logic
            let rawBrandName = row["BrandName"]?.trim().toLowerCase() || "";
            rawBrandName = BRAND_ALIASES[rawBrandName] ?? rawBrandName;
            const brandId = brands?.find(b => b.brandName.toLowerCase() === rawBrandName)?.brandId;
            
            // Allow subcategory mapping by checking all categories (we flatten if needed, or assume categoryName is unique)
            let rawCategoryName = row["CategoryName"]?.trim().toLowerCase() || "";
            rawCategoryName = CATEGORY_ALIASES[rawCategoryName] ?? rawCategoryName;
            const categoryName = rawCategoryName;
            let categoryId: string | undefined;
            if (categories) {
              for (const c of categories) {
                if (c.categoryName.toLowerCase() === categoryName) {
                  categoryId = c.categoryId;
                  break;
                }
                if (c.subCategories) {
                  const sub = c.subCategories.find(s => s.categoryName.toLowerCase() === categoryName);
                  if (sub) {
                    categoryId = sub.categoryId;
                    break;
                  }
                }
              }
            }
            
            // Map vehicles
            const vehicleNames = row["CompatibleVehicles"]?.split(",").map(v => v.trim()).filter(Boolean) || [];
            const compatibleVehicleIds: string[] = [];
            for (const vName of vehicleNames) {
              const match = vehicles?.find(v => 
                `${v.make} ${v.model} (${v.fuelType || 'Any'})`.toLowerCase().includes(vName.toLowerCase()) || 
                `${v.make} ${v.model}`.toLowerCase() === vName.toLowerCase()
              );
              if (match) compatibleVehicleIds.push(match.vehicleId);
            }

            // Extract specs
            const standardCols = ["ProductName", "ProductDescription", "ProductPrice", "OriginalPrice", "ExchangeDiscount", "ProductStock", "ProductImage", "BrandName", "CategoryName", "CompatibleVehicles"];
            const specs: Record<string, Record<string, string>> = { "Technical Details": {} };
            let hasSpecs = false;
            
            for (const [key, value] of Object.entries(row)) {
              if (!standardCols.includes(key) && value && value.trim() !== "") {
                specs["Technical Details"][key] = value.trim();
                hasSpecs = true;
              }
            }

            // Only parse values if they are valid numbers
            const parsedPrice = parseInt(row["ProductPrice"]);
            const parsedOriginalPrice = parseInt(row["OriginalPrice"]);
            const parsedExchangeDiscount = parseInt(row["ExchangeDiscount"]);
            const parsedStock = parseInt(row["ProductStock"]);
            
            if (!isNaN(parsedOriginalPrice)) {
              specs["Technical Details"]["originalPrice"] = parsedOriginalPrice.toString();
              hasSpecs = true;
            }

            let pDesc = row["ProductDescription"] || "";
            if (pDesc.length > 2000) {
              pDesc = pDesc.substring(0, 1997) + "..."; // truncate to prevent DB constraint errors
            }

            const payload: CreateProductRequest = {
              productName: row["ProductName"] || "Unknown Product",
              productDescription: pDesc,
              productPrice: isNaN(parsedPrice) ? 0 : parsedPrice,
              exchangeDiscount: isNaN(parsedExchangeDiscount) ? 0 : parsedExchangeDiscount,
              productStock: isNaN(parsedStock) ? 0 : parsedStock,
              productImage: row["ProductImage"],
              categoryId,
              brandId,
              compatibleVehicleIds,
              specs: hasSpecs ? specs : undefined
            };

            if (!categoryId && rawCategoryName) {
              missingMappings.add(`Category: ${row["CategoryName"]}`);
              throw new Error(`Category mapping not found for ${row["CategoryName"]}`);
            }
            if (!brandId && rawBrandName) {
              missingMappings.add(`Brand: ${row["BrandName"]}`);
              throw new Error(`Brand mapping not found for ${row["BrandName"]}`);
            }

            await adminService.createProduct(payload);
            successCount++;
          } catch (err: any) {
            console.error(`Skipped row ${i + 1} (${row["ProductName"]}):`, err?.message || err);
            skipCount++;
          }
          setProgress({ current: i + 1, total: rows.length });
        }

        if (skipCount > 0) {
          toast.warning(`Imported ${successCount}. Skipped ${skipCount} products due to missing DB categories/brands. Check console for details.`, { duration: 10000 });
          if (missingMappings.size > 0) {
            console.warn("The following Categories/Brands from the CSV do not exist in the Database:", Array.from(missingMappings));
          }
        } else {
          toast.success(`Successfully imported ${successCount} out of ${rows.length} products!`);
        }
        
        queryClient.invalidateQueries({ queryKey: ["products"] });
        setImporting(false);
        setProgress(null);
        onClose();
      },
      error: () => {
        toast.error("Failed to parse CSV file.");
        setImporting(false);
        setProgress(null);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !importing && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Import Products via Smart CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
            <p className="font-semibold text-foreground">Smart CSV Format:</p>
            <p className="text-muted-foreground leading-relaxed">
              Standard Columns: <code className="block mt-1 bg-background p-1.5 rounded border border-border font-mono text-[11px] text-foreground">
                ProductName, ProductDescription, ProductPrice, OriginalPrice, ExchangeDiscount, ProductStock, ProductImage, BrandName, CategoryName, CompatibleVehicles
              </code>
            </p>
            <p className="text-muted-foreground mt-2">
              Any other column (e.g. <code>Warranty</code>, <code>Capacity</code>) will automatically be mapped as a <strong>Specification</strong> under "Technical Details".
            </p>
          </div>

          {importing ? (
            <div className="space-y-3 py-4 text-center">
              <Spinner className="mx-auto" />
              <p className="text-sm font-semibold text-foreground animate-pulse">
                Importing products...
              </p>
              {progress && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden mt-2">
                  <div 
                    className="bg-primary h-full transition-all duration-200" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 hover:bg-muted/30 transition-colors relative cursor-pointer group">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center space-y-2 text-center pointer-events-none">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium text-foreground">Select CSV File</div>
                <div className="text-xs text-muted-foreground">Click to browse your files</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
