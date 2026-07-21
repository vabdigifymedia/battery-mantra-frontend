import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cmsService, CreateCmsPageRequest } from "@/services/cms.service";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/feedback/Spinner";
import { useEffect } from "react";

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

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<CreateCmsPageRequest>({
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
        seo: page.seo || { slug: "", metaTitle: "", metaDescription: "" },
      });
    }
  }, [page, reset]);

  const mutation = useMutation({
    mutationFn: (data: CreateCmsPageRequest) => cmsService.updatePage(pageId, data),
    onSuccess: () => {
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
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner />
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
          <p className="text-muted-foreground">Update your dynamic CMS page content.</p>
        </div>
      </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                control={control}
                name="image1"
                render={({ field }) => (
                  <CloudinaryUpload
                    label="Hero Image (Image 1)"
                    value={field.value || ""}
                    onChange={field.onChange}
                    folder="cms"
                  />
                )}
              />
              <Controller
                control={control}
                name="image2"
                render={({ field }) => (
                  <CloudinaryUpload
                    label="Secondary Image (Image 2)"
                    value={field.value || ""}
                    onChange={field.onChange}
                    folder="cms"
                  />
                )}
              />
            </div>

            <div className="grid gap-2 pt-4">
              <Label htmlFor="content">Description 1 (Main Content)</Label>
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Write your main page content here..."
                  />
                )}
              />
            </div>

            <div className="grid gap-2 pt-4">
              <Label htmlFor="content2">Description 2 (Secondary Content)</Label>
              <Controller
                control={control}
                name="content2"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Write your secondary page content here (optional)..."
                  />
                )}
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

        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize this page for search engines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="seo.slug">URL Slug</Label>
              <Input
                id="seo.slug"
                {...register("seo.slug")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seo.metaTitle">Meta Title</Label>
              <Input id="seo.metaTitle" {...register("seo.metaTitle")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seo.metaDescription">Meta Description</Label>
              <Input id="seo.metaDescription" {...register("seo.metaDescription")} />
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
