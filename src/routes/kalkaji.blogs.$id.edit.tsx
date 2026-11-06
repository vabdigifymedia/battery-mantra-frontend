import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { blogsService, calculateReadTime } from "@/services/blogs.service";
import { productsService } from "@/services/products.service";
import { adminBlogDetailQuery } from "@/queries";
import type { UpdateBlogPostRequest, BlogStatus } from "@/types/dto";
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
import { Spinner } from "@/components/feedback/Spinner";
import {
  ArrowLeft,
  Search,
  X,
  Plus,
  CheckCircle2,
  Globe,
  Package,
  ExternalLink,
} from "lucide-react";
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

  // Related Products
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // SEO Fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");

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
      setTagsInput(blog.tags?.join(", ") || "");
      setAuthorName(blog.authorName || "Battery Mantra");
      setAuthorImage(blog.authorImage || "");
      setIsFeatured(Boolean(blog.isFeatured));
      setStatus(blog.status || "DRAFT");
      setManualReadTime(blog.readTimeMinutes || "");
      setSelectedProductIds(blog.relatedProductIds || blog.relatedProducts?.map((p) => p.productId) || []);
      setMetaTitle(blog.metaTitle || "");
      setMetaDescription(blog.metaDescription || "");
      setMetaKeywords(blog.metaKeywords || "");
      setCanonicalUrl(blog.canonicalUrl || "");
      setOgImage(blog.ogImage || "");
    }
  }, [blog]);

  // Fetch all products for selector
  const { data: allProducts } = useQuery({
    queryKey: ["admin", "products", "selector"],
    queryFn: () => productsService.list(),
  });

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
      toast.error(err?.message || "Failed to update blog post");
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

    const cleanSlug =
      slug.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const finalCategory = isCustomCategory ? customCategory.trim() || "General" : category;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: UpdateBlogPostRequest = {
      title: title.trim(),
      slug: cleanSlug,
      excerpt: excerpt.trim() || undefined,
      content,
      coverImage: coverImage.trim() || undefined,
      category: finalCategory,
      tags,
      authorName: authorName.trim() || "Battery Mantra",
      authorImage: authorImage.trim() || undefined,
      readTimeMinutes: effectiveReadTime,
      status: finalStatus || status,
      isFeatured,
      relatedProductIds: selectedProductIds,
      metaTitle: metaTitle.trim() || title.trim(),
      metaDescription: metaDescription.trim() || excerpt.trim() || undefined,
      metaKeywords: metaKeywords.trim() || tags.join(", ") || undefined,
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
                  <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer">
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
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  Article Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. 5 Signs Your Car Battery is About to Die"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-medium"
                />
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
                  placeholder="5-signs-car-battery-about-to-die"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="font-mono text-xs"
                />
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

          {/* Related Products Section */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Attached Catalog Products
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Recommend relevant batteries or inverters inside this article with direct "Add to Cart" CTA cards.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedProductIds.length} attached
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, brand, capacity (e.g. Amaron 35Ah)..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              {/* Search Results Dropdown */}
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

              {/* Selected Attached Products list */}
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
                            setSelectedProductIds((prev) => prev.filter((id) => id !== p.productId))
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
                  No products attached yet. Search above to embed relevant battery recommendations.
                </p>
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

