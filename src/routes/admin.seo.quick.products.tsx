import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/seo/quick/products")({
  component: SeoQuickProductsPage,
});

function SeoQuickProductsPage() {
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useQuery({
    queryKey: ["seo", "templates"],
    queryFn: async () => {
      const res = await adminService.api.get("/api/seo/templates");
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminService.api.post("/api/seo/templates", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo", "templates"] });
      toast.success("SEO template saved successfully");
    },
    onError: () => {
      toast.error("Failed to save SEO template");
    }
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-32">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Quick (Products)</h1>
        <p className="text-muted-foreground mt-2">Manage global SEO templates for all products.</p>
      </div>

      <SeoTemplateForm 
        title="Products (without city)" 
        templateType="PRODUCT_WITHOUT_CITY" 
        data={templates?.find((t: any) => t.templateType === "PRODUCT_WITHOUT_CITY")} 
        onSave={(data) => saveMutation.mutate({ ...data, templateType: "PRODUCT_WITHOUT_CITY" })}
        isPending={saveMutation.isPending}
      />

      <SeoTemplateForm 
        title="Products (with city)" 
        templateType="PRODUCT_WITH_CITY" 
        data={templates?.find((t: any) => t.templateType === "PRODUCT_WITH_CITY")} 
        onSave={(data) => saveMutation.mutate({ ...data, templateType: "PRODUCT_WITH_CITY" })}
        isPending={saveMutation.isPending}
      />
    </div>
  );
}

function SeoTemplateForm({ title, templateType, data, onSave, isPending }: any) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      seoTitleTemplate: data?.seoTitleTemplate || "",
      seoDescriptionTemplate: data?.seoDescriptionTemplate || "",
      seoKeywordsTemplate: data?.seoKeywordsTemplate || "",
      ogTitleTemplate: data?.ogTitleTemplate || "",
      ogDescriptionTemplate: data?.ogDescriptionTemplate || "",
    }
  });

  useEffect(() => {
    if (data) {
      reset({
        seoTitleTemplate: data.seoTitleTemplate || "",
        seoDescriptionTemplate: data.seoDescriptionTemplate || "",
        seoKeywordsTemplate: data.seoKeywordsTemplate || "",
        ogTitleTemplate: data.ogTitleTemplate || "",
        ogDescriptionTemplate: data.ogDescriptionTemplate || "",
      });
    }
  }, [data, reset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Variables: product_name, brand_name, category_name{templateType.includes("WITH_CITY") && ", city_name"}, delivery_time</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label>SEO Title</Label>
            <Input placeholder={`Buy product_name at Best Price | Batterymantra.com`} {...register("seoTitleTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>SEO Keywords</Label>
            <Input placeholder={`product_name price, buy product_name...`} {...register("seoKeywordsTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>SEO Description</Label>
            <Input placeholder={`Buy product_name at Best Price. Cash on delivery available...`} {...register("seoDescriptionTemplate")} />
          </div>
          <div className="space-y-2 mt-4 pt-4 border-t">
            <Label>OG Title</Label>
            <Input placeholder={`Buy product_name at Best Price | Batterymantra.com`} {...register("ogTitleTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>OG Description</Label>
            <Input placeholder={`Buy product_name at Best Price. Cash on delivery available...`} {...register("ogDescriptionTemplate")} />
          </div>
          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner size="sm" className="mr-2" />}
              <Save className="h-4 w-4 mr-2" /> Save {title}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
