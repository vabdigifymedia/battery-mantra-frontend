import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
import { Save } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VariableChipsHelper } from "@/components/admin/VariableChipsHelper";

export const Route = createFileRoute("/kalkaji/seo/quick/manufacturers")({
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
        <h1 className="text-3xl font-bold tracking-tight">SEO Quick (Manufacturers & Models)</h1>
        <p className="text-muted-foreground mt-2">Manage global SEO templates for manufacturers (Make level) and sub-manufacturers / vehicle models.</p>
      </div>

      <Tabs defaultValue="manufacturers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="manufacturers">Manufacturers (Make)</TabsTrigger>
          <TabsTrigger value="sub-manufacturers">Sub-Manufacturers (Models)</TabsTrigger>
        </TabsList>

        <TabsContent value="manufacturers" className="space-y-6">
          <VariableChipsHelper type="SEO_MANUFACTURERS" title="Supported Variables (Manufacturer / Make):" />

          <SeoTemplateForm 
            title="Manufacturers (without city)" 
            templateType="MANUFACTURER_WITHOUT_CITY" 
            data={templates?.find((t: any) => t.templateType === "MANUFACTURER_WITHOUT_CITY")} 
            onSave={(data: any) => saveMutation.mutate({ ...data, templateType: "MANUFACTURER_WITHOUT_CITY" })}
            isPending={saveMutation.isPending}
            placeholderEntity="manufacturer_name"
          />

          <SeoTemplateForm 
            title="Manufacturers (with city)" 
            templateType="MANUFACTURER_WITH_CITY" 
            data={templates?.find((t: any) => t.templateType === "MANUFACTURER_WITH_CITY")} 
            onSave={(data: any) => saveMutation.mutate({ ...data, templateType: "MANUFACTURER_WITH_CITY" })}
            isPending={saveMutation.isPending}
            placeholderEntity="manufacturer_name"
          />
        </TabsContent>

        <TabsContent value="sub-manufacturers" className="space-y-6">
          <VariableChipsHelper type="SEO_MODELS" title="Supported Variables (Sub-Manufacturer / Models):" />

          <SeoTemplateForm 
            title="Sub-Manufacturers / Models (without city)" 
            templateType="SUB_MANUFACTURER_WITHOUT_CITY" 
            data={templates?.find((t: any) => t.templateType === "SUB_MANUFACTURER_WITHOUT_CITY")} 
            onSave={(data: any) => saveMutation.mutate({ ...data, templateType: "SUB_MANUFACTURER_WITHOUT_CITY" })}
            isPending={saveMutation.isPending}
            placeholderEntity="manufacturer_name model_name"
          />

          <SeoTemplateForm 
            title="Sub-Manufacturers / Models (with city)" 
            templateType="SUB_MANUFACTURER_WITH_CITY" 
            data={templates?.find((t: any) => t.templateType === "SUB_MANUFACTURER_WITH_CITY")} 
            onSave={(data: any) => saveMutation.mutate({ ...data, templateType: "SUB_MANUFACTURER_WITH_CITY" })}
            isPending={saveMutation.isPending}
            placeholderEntity="manufacturer_name model_name"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SeoTemplateForm({ title, templateType, data, onSave, isPending, placeholderEntity }: any) {
  const isSub = templateType.startsWith("SUB_MANUFACTURER");
  const varDesc = isSub
    ? `Variables: manufacturer_name, model_name, category_name, capacity, price, price_range, price_low, price_high, fuel_type, warranty_range, delivery_time${templateType.includes("WITH_CITY") ? ", city_name" : ""}`
    : `Variables: manufacturer_name, category_name, delivery_time${templateType.includes("WITH_CITY") ? ", city_name" : ""}`;
  const entityExample = isSub ? "{manufacturer_name} {model_name}" : "{manufacturer_name}";
  const titlePlaceholder = templateType.includes("WITH_CITY")
    ? (isSub
        ? `Buy ${entityExample} {capacity} Battery in {city_name} at {price_range} | Batterymantra.com`
        : `Buy ${entityExample} Battery in {city_name} | Batterymantra.com`)
    : (isSub
        ? `Buy ${entityExample} {capacity} Battery Online at Best Price {price_range} | Batterymantra.com`
        : `Buy ${entityExample} Battery at Best Price | Batterymantra.com`);

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
        <CardDescription>{varDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label>SEO Title</Label>
            <AutoResizeTextarea placeholder={titlePlaceholder} {...register("seoTitleTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>SEO Keywords</Label>
            <AutoResizeTextarea placeholder={`${entityExample} battery, buy ${entityExample}...`} {...register("seoKeywordsTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>SEO Description</Label>
            <AutoResizeTextarea placeholder={`Buy 100% genuine ${entityExample} battery online at lowest price...`} {...register("seoDescriptionTemplate")} />
          </div>
          <div className="space-y-2 mt-4 pt-4 border-t">
            <Label>OG Title</Label>
            <AutoResizeTextarea placeholder={titlePlaceholder} {...register("ogTitleTemplate")} />
          </div>
          <div className="space-y-2">
            <Label>OG Description</Label>
            <AutoResizeTextarea placeholder={`Buy 100% genuine ${entityExample} battery online at lowest price...`} {...register("ogDescriptionTemplate")} />
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
