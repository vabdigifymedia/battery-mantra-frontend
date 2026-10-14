import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { categoriesQuery, brandsQuery, adminBrandContentsQuery } from "@/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/Spinner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import {
  Save,
  Copy,
  Check,
  ExternalLink,
  FileEdit,
  Layers,
  Tag,
  ShieldCheck,
  ShoppingBag,
  Info,
  Search,
  RotateCcw
} from "lucide-react";
import { toSlug } from "@/lib/utils";
import type { BrandContentRequest, BrandContentResponse } from "@/types/dto";

export const Route = createFileRoute("/admin/brand-contents")({
  component: AdminBrandContentsPage,
});

const TEMPLATE_VARIABLES = [
  { key: "{city_name}", label: "City Name" },
  { key: "{brand_name}", label: "Brand Name" },
  { key: "{category_name}", label: "Category Name" },
  { key: "{delivery_time}", label: "Delivery Time (1-2 Hours)" },
  { key: "{price}", label: "Starting Price (With Exchange)" },
  { key: "{price_range}", label: "Price Range (With Exchange)" },
  { key: "{warranty_range}", label: "Warranty Period" },
];

function AdminBrandContentsPage() {
  const queryClient = useQueryClient();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");

  // Form state: only category-specific detailed descriptions
  const [normalDescription, setNormalDescription] = useState("");
  const [dealerDescription, setDealerDescription] = useState("");

  const [isDirty, setIsDirty] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState("");

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery(categoriesQuery());
  const { data: brands = [], isLoading: isLoadingBrands } = useQuery(brandsQuery(selectedCategoryId || undefined));
  const { data: allBrandContents = [], isLoading: isLoadingContents } = useQuery(adminBrandContentsQuery());

  // Specific content query for selected Category + Brand
  const {
    data: activeContent,
    isLoading: isLoadingActiveContent,
    isFetching: isFetchingActiveContent
  } = useQuery({
    queryKey: ["admin", "brand-content", selectedCategoryId, selectedBrandId],
    queryFn: () => adminService.findBrandContent(selectedCategoryId, selectedBrandId),
    enabled: Boolean(selectedCategoryId && selectedBrandId),
  });

  // Populate form fields when activeContent loads or changes
  useEffect(() => {
    if (activeContent) {
      setNormalDescription(activeContent.normalDescription || "");
      setDealerDescription(activeContent.dealerDescription || "");
    } else {
      setNormalDescription("");
      setDealerDescription("");
    }
    setIsDirty(false);
  }, [activeContent, selectedCategoryId, selectedBrandId]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: BrandContentRequest) => adminService.saveBrandContent(payload),
    onSuccess: () => {
      toast.success("Brand content saved successfully!");
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "brand-contents"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "brand-content", selectedCategoryId, selectedBrandId] });
      queryClient.invalidateQueries({ queryKey: ["brand-content"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save brand content");
    },
  });

  const handleSave = () => {
    if (!selectedCategoryId || !selectedBrandId) {
      toast.error("Please select both a Category and a Brand.");
      return;
    }

    const payload: BrandContentRequest = {
      categoryId: selectedCategoryId,
      brandId: selectedBrandId,
      normalDescription: normalDescription.trim() || undefined,
      dealerDescription: dealerDescription.trim() || undefined,
    };

    saveMutation.mutate(payload);
  };

  const handleReset = () => {
    if (activeContent) {
      setNormalDescription(activeContent.normalDescription || "");
      setDealerDescription(activeContent.dealerDescription || "");
    } else {
      setNormalDescription("");
      setDealerDescription("");
    }
    setIsDirty(false);
    toast.info("Form reset to saved content.");
  };

  const handleCopyVariable = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Find selected names for previews
  const selectedCategory = categories.find((c: any) => c.categoryId === selectedCategoryId);
  const selectedBrand = brands.find((b: any) => b.brandId === selectedBrandId);

  const previewRetailUrl = selectedCategory && selectedBrand
    ? `/brand-products/${toSlug(selectedCategory.categoryName)}/${toSlug(selectedBrand.brandName)}`
    : null;

  const previewDealerUrl = selectedCategory && selectedBrand
    ? `/brand-dealer/${toSlug(selectedCategory.categoryName)}/${toSlug(selectedBrand.brandName)}`
    : null;

  // Filter existing content table
  const filteredContents = useMemo(() => {
    if (!tableSearch.trim()) return allBrandContents;
    const q = tableSearch.toLowerCase();
    return allBrandContents.filter(
      (c) =>
        c.categoryName?.toLowerCase().includes(q) ||
        c.brandName?.toLowerCase().includes(q)
    );
  }, [allBrandContents, tableSearch]);

  const handleSelectFromTable = (item: BrandContentResponse) => {
    setSelectedCategoryId(item.categoryId);
    setSelectedBrandId(item.brandId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileEdit className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Brand Content Management</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Customize category + brand specific rich descriptions for Normal and Dealer landing pages.
              </p>
            </div>
          </div>
        </div>

        {selectedCategoryId && selectedBrandId && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            {previewRetailUrl && (
              <a
                href={previewRetailUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border bg-background hover:bg-muted text-foreground transition-colors"
              >
                <span>View Brand Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {previewDealerUrl && (
              <a
                href={previewDealerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border bg-background hover:bg-muted text-foreground transition-colors"
              >
                <span>View Dealer Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Selection Bar */}
      <Card className="border-primary/20 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>Select Category & Brand</span>
            {isFetchingActiveContent && <Spinner className="h-4 w-4 text-primary" />}
          </CardTitle>
          <CardDescription>
            Choose a Category and Brand combination to view and update its descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-select" className="text-sm font-medium flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>Category</span>
              </Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(val) => {
                  setSelectedCategoryId(val);
                  setIsDirty(true);
                }}
              >
                <SelectTrigger id="category-select" className="w-full">
                  <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select Category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-select" className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>Brand</span>
              </Label>
              <Select
                value={selectedBrandId}
                onValueChange={(val) => {
                  setSelectedBrandId(val);
                  setIsDirty(true);
                }}
              >
                <SelectTrigger id="brand-select" className="w-full">
                  <SelectValue placeholder={isLoadingBrands ? "Loading brands..." : "Select Brand"} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b: any) => (
                    <SelectItem key={b.brandId} value={b.brandId}>
                      {b.brandName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCategoryId && selectedBrandId && (
            <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                {isLoadingActiveContent ? (
                  <span className="flex items-center gap-1"><Spinner className="h-3 w-3" /> Checking records...</span>
                ) : activeContent ? (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                    Existing Record Found
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">
                    New Content Pair (Not Yet Created)
                  </Badge>
                )}
              </div>

              {isDirty && (
                <span className="text-amber-600 font-medium">
                  Unsaved changes detected
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variable Chips Helper */}
      <Card className="bg-muted/40 border-muted">
        <CardContent className="py-3 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>Supported Template Variables (click any chip to copy with curly brackets):</span>
            </div>
            <span className="text-[11px] text-muted-foreground italic">
              Variables resolve dynamically on customer pages for their selected city and prices.
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => handleCopyVariable(v.key)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-background hover:bg-primary/10 border hover:border-primary/40 text-foreground transition-all cursor-pointer font-mono group"
                title={`Click to copy ${v.key} (${v.label})`}
              >
                <span className="font-semibold text-primary">{v.key}</span>
                <span className="text-[11px] text-muted-foreground font-sans">({v.label})</span>
                {copiedKey === v.key ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor Form (Two Columns) */}
      {selectedCategoryId && selectedBrandId ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Normal */}
            <Card className="shadow-xs border-blue-500/20">
              <CardHeader className="bg-blue-500/5 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Normal</CardTitle>
                      <CardDescription className="text-xs">
                        Appears at the bottom of the brand page (/brand-products/...)
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Normal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <Label className="text-xs font-semibold">
                  Detailed Description
                </Label>
                <RichTextEditor
                  value={normalDescription}
                  onChange={(html) => {
                    setNormalDescription(html);
                    setIsDirty(true);
                  }}
                  placeholder="Write detailed rich content, headings, brand features, and guarantees for normal customers..."
                  maxHeight="320px"
                  minHeight="220px"
                />
                <p className="text-[11px] text-muted-foreground">
                  Supports headings, lists, links, formatting, and template variables like {'{city_name}'}.
                </p>
              </CardContent>
            </Card>

            {/* Right Column: Dealer */}
            <Card className="shadow-xs border-amber-500/20">
              <CardHeader className="bg-amber-500/5 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Dealer</CardTitle>
                      <CardDescription className="text-xs">
                        Appears at the bottom of the dealer page (/brand-dealer/...)
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Dealer
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <Label className="text-xs font-semibold">
                  Detailed Description
                </Label>
                <RichTextEditor
                  value={dealerDescription}
                  onChange={(html) => {
                    setDealerDescription(html);
                    setIsDirty(true);
                  }}
                  placeholder="Write authorized dealership information, genuine warranty, and certified service benefits..."
                  maxHeight="320px"
                  minHeight="220px"
                />
                <p className="text-[11px] text-muted-foreground">
                  Supports headings, lists, links, formatting, and template variables like {'{city_name}'}.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Action Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-4 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                Editing:
              </span>
              <Badge variant="outline" className="font-semibold text-foreground">
                {selectedCategory?.categoryName || "Category"} + {selectedBrand?.brandName || "Brand"}
              </Badge>
              {isDirty && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                  Unsaved changes
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={saveMutation.isPending || !isDirty}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reset
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="min-w-[120px]"
              >
                {saveMutation.isPending ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="border-dashed py-12 text-center text-muted-foreground">
          <CardContent className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <FileEdit className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Select a Category & Brand</h3>
            <p className="text-sm max-w-md mx-auto">
              Please choose both a Category and Brand from the dropdowns above, or click &quot;Edit&quot; on any configured pair in the table below to load its content.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configured Brand Contents Table */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Configured Brand Contents</CardTitle>
            <CardDescription className="text-xs">
              Overview of all Category + Brand content records currently configured ({allBrandContents.length} total)
            </CardDescription>
          </div>

          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search category or brand..."
                className="pl-8 text-xs"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px] font-semibold">Category</TableHead>
                <TableHead className="w-[200px] font-semibold">Brand</TableHead>
                <TableHead className="font-semibold">Normal Description</TableHead>
                <TableHead className="font-semibold">Dealer Description</TableHead>
                <TableHead className="w-[100px] text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingContents ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Spinner className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground mt-2">Loading configured brand contents...</p>
                  </TableCell>
                </TableRow>
              ) : filteredContents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                    {tableSearch ? "No matching brand contents found." : "No brand contents configured yet. Select a category and brand above to create the first one."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContents.map((item) => {
                  const isSelected = item.categoryId === selectedCategoryId && item.brandId === selectedBrandId;
                  const hasNormal = Boolean(item.normalDescription);
                  const hasDealer = Boolean(item.dealerDescription);

                  return (
                    <TableRow
                      key={item.id}
                      className={isSelected ? "bg-primary/5 font-medium" : undefined}
                    >
                      <TableCell className="font-semibold text-foreground">
                        {item.categoryName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {item.brandName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasNormal ? (
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Empty
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasDealer ? (
                          <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Empty
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleSelectFromTable(item)}
                        >
                          {isSelected ? "Editing" : "Edit"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
