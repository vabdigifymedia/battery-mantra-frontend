import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/seo/quick/manufacturers")({
  component: SeoQuickManufacturersPage,
});

function SeoQuickManufacturersPage() {
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useQuery({
    queryKey: ["seo", "templates"],
    queryFn: () => apiFetch<any[]>("/api/seo/templates"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiFetch<any>("/api/seo/templates", { method: "POST", body: data }),
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
        <h1 className="text-3xl font-bold tracking-tight">SEO Quick (Manufacturers)</h1>
        <p className="text-muted-foreground mt-2">Manage global SEO templates for all manufacturers.</p>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border text-sm">
          <p className="font-semibold mb-1">Supported Variables:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-primary">{`{manufacturer_name}`}</code> - Name of the manufacturer (e.g. Maruti, Honda)</li>
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-primary">{`{category_name}`}</code> - Name of the category (e.g. Car Batteries)</li>
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-primary">{`{city_name}`}</code> - Name of the selected city</li>
          </ul>
        </div>
      </div>

      <SeoTemplateForm 
        title="Manufacturers (without city)" 
        templateType="MANUFACTURER_WITHOUT_CITY" 
        data={templates?.find((t: any) => t.templateType === "MANUFACTURER_WITHOUT_CITY")} 
        onSave={(data: any) => saveMutation.mutate({ ...data, templateType: "MANUFACTURER_WITHOUT_CITY" })}
        isPending={saveMutation.isPending}
      />

      <SeoTemplateForm 
        title="Manufacturers (with city)" 
        templateType="MANUFACTURER_WITH_CITY" 
        data={templates?.find((t: any) => t.templateType === "MANUFACTURER_WITH_CITY")} 
        onSave={(data: any) => saveMutation.mutate({ ...data, templateType: "MANUFACTURER_WITH_CITY" })}
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
        <CardDescription>Variables: manufacturer_name{templateType.includes("WITH_CITY") && ", city_name"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label>SEO Title</Label>
            <Input placeholder={`Buy manufacturer_name at Best Price | Batterymantra.com`} {...register("seoTitleTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>SEO Keywords</Label>
            <Input placeholder={`manufacturer_name price, buy manufacturer_name...`} {...register("seoKeywordsTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>SEO Description</Label>
            <Input placeholder={`Buy manufacturer_name at Best Price. Cash on delivery available...`} {...register("seoDescriptionTemplate")} />
          </div>
          <div className="space-y-2 mt-4 pt-4 border-t">
            <Label>OG Title</Label>
            <Input placeholder={`Buy manufacturer_name at Best Price | Batterymantra.com`} {...register("ogTitleTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>OG Description</Label>
            <Input placeholder={`Buy manufacturer_name at Best Price. Cash on delivery available...`} {...register("ogDescriptionTemplate")} />
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
