import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { blogsService, calculateReadTime } from "@/services/blogs.service";
import { productsService } from "@/services/products.service";
import { adminBlogDetailQuery, categoriesQuery, brandsQuery, manufacturersListQuery } from "@/queries";
import type {
  UpdateBlogPostRequest,
  BlogStatus,
  BlogRecommendationType,
  ProductListResponse,
} from "@/types/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { VariableChipsHelper } from "@/components/admin/VariableChipsHelper";
import { Spinner } from "@/components/feedback/Spinner";
import {
  ArrowLeft,
  Sparkles,
  Search,
  X,
  Plus,
  CheckCircle2,
  Globe,
  Package,
  Layers,
  Tag,
  Car,
  Factory,
  ArrowRight,
  ExternalLink,
  Eye,
} from "lucide-react";
import { cn, cleanBlogSlug, applyBlogVariables } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_CATEGORIES = [
  "Car Batteries",
  "Inverter Batteries",
  "Maintenance Guides",
  "Solar & Lithium",
  "Buying Advice",
  "Electric Vehicles",
  "Industry News",
];

export const Route = createFileRoute("/kalkaji/blogs/$id/edit")({
  component: EditBlogPost,
});

function EditBlogPost() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: blog, isLoading, error } = useQuery(adminBlogDetailQuery(id));

  // Core Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("Car Batteries");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [authorName, setAuthorName] = useState("Battery Mantra");
  const [authorImage, setAuthorImage] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<BlogStatus>("DRAFT");
  const [manualReadTime, setManualReadTime] = useState<number | "">("");
  const [previewCity, setPreviewCity] = useState("Delhi");

  // Recommendations & CTAs
  const [recommendationType, setRecommendationType] = useState<BlogRecommendationType>("PRODUCTS");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>("");
  const [productSearch, setProductSearch] = useState("");

  // SEO Fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");

  // Selectors Data
  const { data: allCategories } = useQuery(categoriesQuery());
  const { data: allBrands } = useQuery(brandsQuery());
  const { data: allManufacturers } = useQuery(manufacturersListQuery());
  const { data: allProducts } = useQuery({
    queryKey: ["admin", "products", "selector"],
    queryFn: () => productsService.list(),
  });

  // Populate data when loaded
  useEffect(() => {
    if (blog) {
      setTitle(blog.title || "");
      setSlug(blog.slug || "");
      setExcerpt(blog.excerpt || "");
      setContent(blog.content || "");
      setCoverImage(blog.coverImage || "");
      if (DEFAULT_CATEGORIES.includes(blog.category)) {
        setCategory(blog.category);
        setIsCustomCategory(false);
      } else if (blog.category) {
        setIsCustomCategory(true);
        setCustomCategory(blog.category);
      }
      setTagsInput(Array.isArray(blog.tags) ? blog.tags.join(", ") : (blog.tags || ""));
      setAuthorName(blog.authorName || "Battery Mantra");
      setAuthorImage(blog.authorImage || "");
      setIsFeatured(Boolean(blog.isFeatured));
      setStatus(blog.status || "DRAFT");
      setManualReadTime(blog.readTimeMinutes || "");
      setSelectedProductIds(blog.relatedProductIds || blog.relatedProducts?.map((p) => p.productId) || []);
      
      // Target / Recommendation Type
      const recType = blog.recommendationType || (blog.relatedCategoryId ? "CATEGORY" : (blog.relatedBrandId ? "BRAND" : (blog.relatedManufacturerId ? "MANUFACTURER" : (blog.relatedProductIds && blog.relatedProductIds.length > 0 ? "PRODUCTS" : "NONE"))));
      setRecommendationType(recType);
      setSelectedCategoryId(blog.relatedCategoryId || "");
      setSelectedBrandId(blog.relatedBrandId || "");
      setSelectedManufacturerId(blog.relatedManufacturerId || "");

      setMetaTitle(blog.metaTitle || "");
      setMetaDescription(blog.metaDescription || "");
      setMetaKeywords(blog.metaKeywords || "");
      setCanonicalUrl(blog.canonicalUrl || "");
      setOgImage(blog.ogImage || "");
    }
  }, [blog]);

  const autoReadTime = useMemo(() => calculateReadTime(content), [content]);
  const effectiveReadTime = manualReadTime !== "" ? Number(manualReadTime) : autoReadTime;

  // Products filtering for selector
  const filteredProducts = useMemo(() => {
    if (!allProducts || !productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return allProducts
      .filter(
        (p) =>
          !selectedProductIds.includes(p.productId) &&
          (p.productName.toLowerCase().includes(q) ||
            p.brandName?.toLowerCase().includes(q) ||
            p.capacity?.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [allProducts, productSearch, selectedProductIds]);

  const selectedProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((p) => selectedProductIds.includes(p.productId));
  }, [allProducts, selectedProductIds]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBlogPostRequest) => blogsService.update(id, data),
    onSuccess: () => {
      toast.success("Blog post updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      navigate({ to: "/kalkaji/blogs" });
    },
    onError: (err: any) => {
      console.error("Update blog failed:", err);
      let errMsg = err?.message;
      if (err?.fieldErrors && typeof err.fieldErrors === "object") {
        const details = Object.entries(err.fieldErrors)
          .map(([f, msgs]) => `${f}: ${(msgs as string[]).join(", ")}`)
          .join(" | ");
        if (details) errMsg = `${errMsg}: ${details}`;
      }
      toast.error(errMsg || "Failed to update blog post. Please check fields.");
    },
  });

  const handleSubmit = (finalStatus?: BlogStatus) => {
    if (!title.trim()) {
      toast.error("Please enter an article title");
      return;
    }
    if (!content.trim() || content === "<p></p>") {
      toast.error("Please write some article content");
      return;
    }

    const cleanSlug = cleanBlogSlug(slug.trim() || title);

    const finalCategory = isCustomCategory ? customCategory.trim() || "General" : category;

    const selectedCat = allCategories?.find((c) => (c.categoryId || (c as any).id) === selectedCategoryId);
    const selectedBrd = allBrands?.find((b) => (b.brandId || (b as any).id) === selectedBrandId);
    const selectedMfr = allManufacturers?.find((m) => m.id === selectedManufacturerId);

    // Fallback product IDs if category or brand is selected
    let fallbackProductIds: string[] | undefined = undefined;
    if (recommendationType === "PRODUCTS" && selectedProductIds.length > 0) {
      fallbackProductIds = selectedProductIds;
    } else if (recommendationType === "CATEGORY" && selectedCategoryId && allProducts) {
      fallbackProductIds = allProducts
        .filter((p) => p.categoryId === selectedCategoryId)
        .slice(0, 4)
        .map((p) => p.productId);
    } else if (recommendationType === "BRAND" && selectedBrandId && allProducts) {
      fallbackProductIds = allProducts
        .filter((p) => p.brandId === selectedBrandId)
        .slice(0, 4)
        .map((p) => p.productId);
    }

    const payload: UpdateBlogPostRequest = {
      title: title.trim(),
      slug: cleanSlug,
      excerpt: excerpt.trim() || undefined,
      content,
      coverImage: coverImage.trim() || undefined,
      category: finalCategory,
      tags: tagsInput.trim() || undefined,
      authorName: authorName.trim() || "Battery Mantra",
      authorImage: authorImage.trim() || undefined,
      readTimeMinutes: Math.max(1, Number(effectiveReadTime) || 3),
      status: finalStatus || status,
      isFeatured,
      relatedProductIds: fallbackProductIds && fallbackProductIds.length > 0 ? fallbackProductIds : undefined,
      recommendationType,
      relatedCategoryId: recommendationType === "CATEGORY" ? selectedCategoryId || undefined : undefined,
      relatedCategoryName: recommendationType === "CATEGORY" ? selectedCat?.categoryName || undefined : undefined,
      relatedCategorySlug: recommendationType === "CATEGORY" ? selectedCat?.categorySlug || undefined : undefined,
      relatedBrandId: recommendationType === "BRAND" ? selectedBrandId || undefined : undefined,
      relatedBrandName: recommendationType === "BRAND" ? selectedBrd?.brandName || undefined : undefined,
      relatedBrandSlug: recommendationType === "BRAND" ? selectedBrd?.slug || undefined : undefined,
      relatedManufacturerId: recommendationType === "MANUFACTURER" ? selectedManufacturerId || undefined : undefined,
      relatedManufacturerName: recommendationType === "MANUFACTURER" ? selectedMfr?.name || undefined : undefined,
      metaTitle: metaTitle.trim() || title.trim(),
      metaDescription: metaDescription.trim() || excerpt.trim() || undefined,
      metaKeywords: metaKeywords.trim() || tagsInput.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      ogImage: ogImage.trim() || coverImage.trim() || undefined,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading article data...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-lg font-semibold text-destructive">Could not load article</p>
        <Button asChild variant="outline">
          <Link to="/kalkaji/blogs">Return to Blogs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto pb-20">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/kalkaji/blogs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Edit Article</h1>
              {blog.status === "PUBLISHED" && (
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                  <a
                    href={`/blog/${(blog.slug || "").replace(/\{city_name\}|\{city\}/g, "delhi")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" /> View Live
                  </a>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Editing: <span className="font-medium text-foreground">{blog.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status !== "PUBLISHED" ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={updateMutation.isPending}
                onClick={() => handleSubmit("DRAFT")}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => handleSubmit("PUBLISHED")}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {updateMutation.isPending ? "Publishing..." : "Publish Article"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => handleSubmit()}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {updateMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Core Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Article Title & Slug */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Title & URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <VariableChipsHelper
                type="BLOGS"
                compact={true}
                title="Dynamic Variables (Click any to copy):"
              />

              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  Article Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Best Car Battery in {city_name} ({year})"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-medium"
                />

                {title.includes("{") && (
                  <div className="rounded-lg border bg-primary/5 p-2.5 space-y-1.5 text-xs mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Customer View Live Preview:
                      </span>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-muted-foreground">Preview City:</span>
                        {["Delhi", "Noida", "Gurgaon", "Ghaziabad"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setPreviewCity(c)}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                              previewCity === c
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "bg-background hover:bg-muted text-muted-foreground border"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="font-medium text-foreground bg-background px-2.5 py-1.5 rounded border text-sm">
                      {applyBlogVariables(title, { cityName: previewCity })}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug" className="text-xs text-muted-foreground">
                    URL Slug (batterymantra.com/blog/...)
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    /blog/{slug || "auto-generated"}
                  </span>
                </div>
                <Input
                  id="slug"
                  placeholder="best-car-battery or best-car-battery-in-delhi"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  {slug.includes("{city_name}") ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-3 w-3" /> Multi-city resolver active: Automatically matches visitors across all cities (/blog/...-in-delhi, /blog/...-in-noida).
                    </span>
                  ) : (
                    <span>
                      <strong>SEO Best Practice:</strong> Keep slug clean (e.g. <code className="text-foreground font-mono bg-muted px-1 rounded">best-car-battery</code> or <code className="text-foreground font-mono bg-muted px-1 rounded">best-car-battery-in-delhi</code>). System will automatically serve city variations (<code className="text-foreground font-mono bg-muted px-1 rounded">/blog/...-in-noida</code>, <code className="text-foreground font-mono bg-muted px-1 rounded">/blog/...-in-gurgaon</code>) with dynamic variable replacement!
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt" className="text-sm font-medium">
                    Excerpt / Short Summary
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {excerpt.length}/250 characters
                  </span>
                </div>
                <Textarea
                  id="excerpt"
                  placeholder="A concise 1-2 sentence hook explaining what readers will learn. Displayed on blog cards and Google snippets."
                  rows={3}
                  maxLength={300}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rich Text Editor */}
          <Card className="shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Content</CardTitle>
                <CardDescription className="text-xs">
                  Format headings, bullet points, images, and links using the editor.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {effectiveReadTime} min read
              </Badge>
            </CardHeader>
            <div className="px-6 pb-2">
              <VariableChipsHelper
                type="BLOGS"
                compact={true}
                title="Dynamic Variables for Content (Click to copy):"
              />
            </div>
            <CardContent>
              <RichTextEditor
                value={content}
                onChange={setContent}
                minHeight="320px"
                maxHeight="650px"
                placeholder="Write your article here..."
              />
            </CardContent>
          </Card>

          {/* Attached Recommendations & Conversion CTAs */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Attached Recommendations & Conversion CTAs
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose what high-converting purchase recommendation to display at the end of this blog post.
                  </CardDescription>
                </div>
                {recommendationType === "PRODUCTS" && (
                  <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                    {selectedProductIds.length} products attached
                  </Badge>
                )}
              </div>

              {/* Recommendation Type Tabs / Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t mt-3 bg-muted/40 p-1.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRecommendationType("PRODUCTS")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    recommendationType === "PRODUCTS"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Package className="h-3.5 w-3.5" /> Specific Products
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendationType("CATEGORY")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    recommendationType === "CATEGORY"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="h-3.5 w-3.5" /> Category
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendationType("BRAND")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    recommendationType === "BRAND"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Tag className="h-3.5 w-3.5" /> Brand
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendationType("MANUFACTURER")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    recommendationType === "MANUFACTURER"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Car className="h-3.5 w-3.5" /> Car Manufacturer
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendationType("NONE")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    recommendationType === "NONE"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  None
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {/* MODE 1: SPECIFIC PRODUCTS */}
              {recommendationType === "PRODUCTS" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name, brand, capacity (e.g. Amaron 35Ah)..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>

                  {filteredProducts.length > 0 && (
                    <div className="rounded-md border bg-popover p-2 shadow-sm space-y-1 max-h-56 overflow-y-auto">
                      <span className="text-[11px] font-medium text-muted-foreground px-2">
                        Click to attach product:
                      </span>
                      {filteredProducts.map((p) => (
                        <div
                          key={p.productId}
                          onClick={() => {
                            setSelectedProductIds((prev) => [...prev, p.productId]);
                            setProductSearch("");
                          }}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/70 cursor-pointer text-sm transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {p.productImage ? (
                              <img
                                src={p.productImage}
                                alt={p.productName}
                                className="h-8 w-8 rounded object-contain border bg-white"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="truncate">
                              <p className="font-medium truncate text-xs">{p.productName}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {p.brandName} • ₹{p.productPrice?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-primary shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedProducts.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Currently Selected Products:
                      </span>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedProducts.map((p) => (
                          <div
                            key={p.productId}
                            className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {p.productImage && (
                                <img
                                  src={p.productImage}
                                  alt={p.productName}
                                  className="h-9 w-9 rounded object-contain border bg-white shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate">{p.productName}</p>
                                <p className="text-muted-foreground">
                                  ₹{p.productPrice?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setSelectedProductIds((prev) =>
                                  prev.filter((id) => id !== p.productId)
                                )
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No products attached yet. Search above to embed individual battery recommendations.
                    </p>
                  )}
                </div>
              )}

              {/* MODE 2: CATEGORY */}
              {recommendationType === "CATEGORY" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Select Target Category</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a Category (e.g. Car Batteries, Inverter Batteries)" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories?.map((c) => {
                          const id = (c.categoryId || (c as any).id) as string;
                          return (
                            <SelectItem key={id} value={id}>
                              {c.categoryName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCategoryId && (
                    <div className="rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-primary" />
                          <span className="font-bold text-sm">
                            {allCategories?.find((c) => (c.categoryId || (c as any).id) === selectedCategoryId)?.categoryName}
                          </span>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                          Category Banner + Top 4 Products
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When readers finish this guide, they will see a dedicated showcase banner inviting them to browse all batteries in this category, plus live pricing and top 4 product cards.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: BRAND */}
              {recommendationType === "BRAND" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Select Target Brand</Label>
                    <Select
                      value={selectedBrandId}
                      onValueChange={setSelectedBrandId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a Brand (e.g. Exide, Amaron, Luminous)" />
                      </SelectTrigger>
                      <SelectContent>
                        {allBrands?.map((b) => {
                          const id = (b.brandId || (b as any).id) as string;
                          return (
                            <SelectItem key={id} value={id}>
                              {b.brandName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedBrandId && (
                    <div className="rounded-xl border bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {allBrands?.find((b) => (b.brandId || (b as any).id) === selectedBrandId)?.brandLogo ? (
                            <img
                              src={allBrands.find((b) => (b.brandId || (b as any).id) === selectedBrandId)!.brandLogo!}
                              alt="Brand Logo"
                              className="h-6 w-auto max-w-[80px] object-contain"
                            />
                          ) : (
                            <Tag className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-bold text-sm">
                            {allBrands?.find((b) => (b.brandId || (b as any).id) === selectedBrandId)?.brandName}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">
                          Official Brand Dealer CTA
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Displays an official brand dealer banner highlighting 100% genuine warranty, instant doorstep replacement, and top bestselling batteries for this brand.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 4: VEHICLE MANUFACTURER */}
              {recommendationType === "MANUFACTURER" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Select Vehicle Manufacturer (Car Maker)</Label>
                    <Select
                      value={selectedManufacturerId}
                      onValueChange={setSelectedManufacturerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a Car Maker (e.g. Maruti Suzuki, Hyundai, Tata Motors)" />
                      </SelectTrigger>
                      <SelectContent>
                        {allManufacturers?.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedManufacturerId && (
                    <div className="rounded-xl border bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {allManufacturers?.find((m) => m.id === selectedManufacturerId)?.logoUrl ? (
                            <img
                              src={allManufacturers.find((m) => m.id === selectedManufacturerId)!.logoUrl!}
                              alt="Make Logo"
                              className="h-6 w-auto max-w-[70px] object-contain"
                            />
                          ) : (
                            <Car className="h-5 w-5 text-blue-600" />
                          )}
                          <span className="font-bold text-sm">
                            {allManufacturers?.find((m) => m.id === selectedManufacturerId)?.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px]">
                          Vehicle Battery Fitment CTA
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Displays a specialized car fitment banner allowing readers to find 100% compatible batteries specifically for this vehicle manufacturer.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 5: NONE */}
              {recommendationType === "NONE" && (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No products or recommendations will be attached to this article. The guide will end cleanly without bottom CTA cards.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings, Cover Image & SEO */}
        <div className="space-y-6">
          {/* Status & Categorization */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Select */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Article Status</Label>
                <Select value={status} onValueChange={(val: BlogStatus) => setStatus(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Category</Label>
                {!isCustomCategory ? (
                  <div className="flex gap-2">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCustomCategory(true)}
                    >
                      New
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCustomCategory(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Author */}
              <div className="space-y-1.5">
                <Label htmlFor="author" className="text-sm font-medium">
                  Author Name
                </Label>
                <Input
                  id="author"
                  placeholder="e.g. Battery Mantra Team"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-sm font-medium">
                  Tags (comma separated)
                </Label>
                <Input
                  id="tags"
                  placeholder="Car Battery, Amaron, Tips, Summer"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              {/* Read Time Override */}
              <div className="space-y-1.5">
                <Label htmlFor="readTime" className="text-sm font-medium">
                  Read Time (minutes)
                </Label>
                <Input
                  id="readTime"
                  type="number"
                  min="1"
                  placeholder={`Auto-calculated (${autoReadTime} min)`}
                  value={manualReadTime}
                  onChange={(e) =>
                    setManualReadTime(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>

              {/* Featured Switch */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Featured Article</Label>
                  <p className="text-xs text-muted-foreground">
                    Pin this article to the top of the blog directory.
                  </p>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Cover Image</CardTitle>
              <CardDescription className="text-xs">
                Featured image displayed on social media cards and blog headers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CloudinaryUpload
                folder="blogs"
                label="Upload Banner / Cover"
                value={coverImage}
                onChange={setCoverImage}
                hint="Recommended resolution: 1200x630 (16:9 ratio)"
              />
              {coverImage && (
                <div className="overflow-hidden rounded-md border">
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="h-32 w-full object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Metadata */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-emerald-600" /> Search Engine Optimization (SEO)
              </CardTitle>
              <CardDescription className="text-xs">
                Customize titles and tags for Google and social sharing previews.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VariableChipsHelper
                type="BLOGS"
                compact={true}
                title="SEO Dynamic Variables (Click any to copy):"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaTitle" className="text-xs font-medium">
                    Meta Title
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {(metaTitle || title).length}/60
                  </span>
                </div>
                <Input
                  id="metaTitle"
                  placeholder={title || "SEO Title (defaults to article title)"}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaDesc" className="text-xs font-medium">
                    Meta Description
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {(metaDescription || excerpt).length}/160
                  </span>
                </div>
                <Textarea
                  id="metaDesc"
                  placeholder={excerpt || "Search engine summary description..."}
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="metaKeywords" className="text-xs font-medium">
                  Keywords
                </Label>
                <Input
                  id="metaKeywords"
                  placeholder="car battery tips, amaron inverter, battery price"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

