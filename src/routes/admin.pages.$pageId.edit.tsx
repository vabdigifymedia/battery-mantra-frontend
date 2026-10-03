import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cmsService, CreateCmsPageRequest } from "@/services/cms.service";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { toast } from "sonner";
import { ArrowLeft, Monitor, Smartphone, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/feedback/Spinner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { FormDraftBanner } from "@/components/forms/FormDraftBanner";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

const RESERVED_SLUGS = [
  "cart", "checkout", "login", "register", "admin", "products",
  "product", "categories", "manufacturers", "brands", "dealers",
  "reels", "orders", "account", "profile", "search", "shop",
  "brand-dealer", "contact", "about",
];

export const Route = createFileRoute("/admin/pages/$pageId/edit")({
  component: EditPage,
});

function EditPage() {
  const { pageId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ["admin", "cms-pages", pageId],
    queryFn: () => cmsService.getPageById(pageId),
  });

  const { register, handleSubmit, control, formState: { errors }, reset, watch, setError, clearErrors } = useForm<CreateCmsPageRequest>({
    defaultValues: {
      title: "",
      subTitle: "",
      image1: "",
      image2: "",
      content: "",
      content2: "",
      isActive: true,
      seo: {
        slug: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        ogImage: "",
      }
    },
  });

  useEffect(() => {
    if (page) {
      reset({
        title: page.title,
        subTitle: page.subTitle || "",
        image1: page.image1 || "",
        image2: page.image2 || "",
        content: page.content || "",
        content2: page.content2 || "",
        isActive: page.isActive,
        seo: {
          slug: page.seo?.slug || "",
          metaTitle: page.seo?.metaTitle || "",
          metaDescription: page.seo?.metaDescription || "",
          metaKeywords: page.seo?.metaKeywords || "",
          ogImage: page.seo?.ogImage || "",
        },
      });
    }
  }, [page, reset]);

  const titleValue = watch("title");
  const draft = useFormDraft(`pages_edit_${pageId}`, watch(), (data) => reset(data));

  const isSlugReserved = (slug: string) => {
    const normalized = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/(^-|-$)+/g, "");
    return RESERVED_SLUGS.includes(normalized);
  };

  const mutation = useMutation({
    mutationFn: (data: CreateCmsPageRequest) => cmsService.updatePage(pageId, data),
    onSuccess: () => {
      draft.clearDraft();
      toast.success("Page updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "cms-pages"] });
      navigate({ to: "/admin/pages" });
    },
    onError: () => {
      toast.error("Failed to update page");
    },
  });

  const onSubmit = (data: CreateCmsPageRequest) => {
    if (!data.seo?.slug && data.title) {
      if (!data.seo) data.seo = {};
      data.seo.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }

    // Check reserved slugs
    const finalSlug = data.seo?.slug || "";
    if (isSlugReserved(finalSlug)) {
      setError("seo.slug", { type: "manual", message: `"${finalSlug}" is a reserved route and cannot be used as a page slug.` });
      toast.error(`Slug "${finalSlug}" is reserved. Please choose a different one.`);
      return;
    }

    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Page not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/pages" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Edit Page</h2>
          <p className="text-muted-foreground">Modify details for page "{page.title}"</p>
        </div>
      </div>

      <FormDraftBanner
        hasDraft={draft.hasDraft}
        draftTime={draft.draftTime}
        onRestore={draft.restoreDraft}
        onDiscard={draft.clearDraft}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Page Title *</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subTitle">Sub Title</Label>
              <Input
                id="subTitle"
                {...register("subTitle")}
                placeholder="e.g. India's top battery provider"
              />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isActive">Active (Visible to public)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Hero Banner Images Card */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Banner Images</CardTitle>
            <CardDescription>Upload separate optimized banners for desktop and mobile screens for the best visual experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desktop Banner */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Desktop Banner</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">1920 × 600</Badge>
                </div>
                <Controller
                  control={control}
                  name="image1"
                  render={({ field }) => (
                    <CloudinaryUpload
                      label=""
                      value={field.value || ""}
                      onChange={field.onChange}
                      folder="cms"
                    />
                  )}
                />
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Recommended:</strong> 1920 × 600 px (min 1440 × 500). Landscape ~16:5 ratio.
                    Max 1.2 MB. WebP, JPG or PNG. Keep text/subjects centered for widescreen compatibility.
                  </span>
                </div>
              </div>

              {/* Mobile Banner */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Mobile Banner</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">750 × 500</Badge>
                </div>
                <Controller
                  control={control}
                  name="image2"
                  render={({ field }) => (
                    <CloudinaryUpload
                      label=""
                      value={field.value || ""}
                      onChange={field.onChange}
                      folder="cms"
                    />
                  )}
                />
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Recommended:</strong> 750 × 500 px (min 600 × 400). Portrait-friendly 3:2 ratio.
                    Max 400 KB. WebP, JPG or PNG. Optimize for fast mobile loading.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Card */}
        <Card>
          <CardHeader>
            <CardTitle>Page Content</CardTitle>
            <CardDescription>Write your page content using the rich text editor. You can embed images directly within the editor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="content">Description 1 (Main Content)</Label>
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-xs text-muted-foreground mr-1">Insert variable:</span>
                      {["{city_name}", "{page_title}"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          onClick={() => {
                            const current = field.value || "";
                            field.onChange(current + v);
                            toast.info(`Inserted ${v} — it will appear at the end of current content.`);
                          }}
                        >
                          + {v}
                        </button>
                      ))}
                    </div>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Write your main page content here..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Dynamic variables like <code className="bg-muted px-1 rounded">{`{city_name}`}</code>, <code className="bg-muted px-1 rounded">{`{page_title}`}</code> are automatically replaced based on the user's location and context.
                    </p>
                  </div>
                )}
              />
            </div>

            <div className="grid gap-2 pt-4">
              <Label htmlFor="content2">Description 2 (Secondary Content)</Label>
              <Controller
                control={control}
                name="content2"
                render={({ field }) => (
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-xs text-muted-foreground mr-1">Insert variable:</span>
                      {["{city_name}", "{page_title}"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          onClick={() => {
                            const current = field.value || "";
                            field.onChange(current + v);
                            toast.info(`Inserted ${v} — it will appear at the end of current content.`);
                          }}
                        >
                          + {v}
                        </button>
                      ))}
                    </div>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Write your secondary page content here (optional)..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Dynamic variables like <code className="bg-muted px-1 rounded">{`{city_name}`}</code>, <code className="bg-muted px-1 rounded">{`{page_title}`}</code> are automatically replaced based on the user's location and context.
                    </p>
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize this page for search engines and social media sharing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="seo.slug">URL Slug</Label>
              <Input
                id="seo.slug"
                {...register("seo.slug", {
                  validate: (value) => {
                    if (value && isSlugReserved(value)) {
                      return `"${value}" is a reserved route. Choose a different slug.`;
                    }
                    return true;
                  }
                })}
              />
              {errors.seo?.slug ? (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errors.seo.slug.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Leave empty to auto-generate from title. (e.g. /your-slug)</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seo.metaTitle">Meta Title</Label>
              <Input id="seo.metaTitle" {...register("seo.metaTitle")} placeholder="Default uses Page Title" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seo.metaDescription">Meta Description</Label>
              <Textarea
                id="seo.metaDescription"
                {...register("seo.metaDescription")}
                placeholder="A compelling description for search engine results (150-160 chars recommended)"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seo.metaKeywords">Meta Keywords</Label>
              <Input
                id="seo.metaKeywords"
                {...register("seo.metaKeywords")}
                placeholder="e.g. battery, inverter battery, car battery, buy online"
              />
              <p className="text-xs text-muted-foreground">Comma-separated keywords for SEO targeting</p>
            </div>

            <div className="grid gap-2 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Social Share Image (OG Image)</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">1200 × 630</Badge>
              </div>
              <Controller
                control={control}
                name="seo.ogImage"
                render={({ field }) => (
                  <CloudinaryUpload
                    label=""
                    value={field.value || ""}
                    onChange={field.onChange}
                    folder="cms"
                  />
                )}
              />
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>Recommended:</strong> 1200 × 630 px (1.91:1 ratio). Max 800 KB. JPG or PNG.
                  This image appears when the page URL is shared on WhatsApp, Facebook, Twitter, etc.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/pages" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
