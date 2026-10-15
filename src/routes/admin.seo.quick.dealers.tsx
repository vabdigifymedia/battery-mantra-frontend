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
import { VariableChipsHelper } from "@/components/admin/VariableChipsHelper";

export const Route = createFileRoute("/admin/seo/quick/dealers")({
  component: SeoQuickDealersPage,
});

function SeoQuickDealersPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">SEO Quick (Brand Dealers)</h1>
        <p className="text-muted-foreground mt-2">Manage global SEO templates for all authorized brand dealer pages.</p>
        <VariableChipsHelper type="SEO_DEALERS" className="mt-4" />
      </div>

      <SeoTemplateForm 
        title="Brand Dealer (without city)" 
        templateType="DEALER_WITHOUT_CITY" 
        data={templates?.find((t: any) => t.templateType === "DEALER_WITHOUT_CITY")} 
        onSave={(data: any) => saveMutation.mutate({ ...data, templateType: "DEALER_WITHOUT_CITY" })}
        isPending={saveMutation.isPending}
      />

      <SeoTemplateForm 
        title="Brand Dealer (with city)" 
        templateType="DEALER_WITH_CITY" 
        data={templates?.find((t: any) => t.templateType === "DEALER_WITH_CITY")} 
        onSave={(data: any) => saveMutation.mutate({ ...data, templateType: "DEALER_WITH_CITY" })}
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
        <CardDescription>Variables: brand_name, category_name, delivery_time{templateType.includes("WITH_CITY") && ", city_name"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label>SEO Title</Label>
            <Input 
              placeholder={templateType.includes("WITH_CITY") 
                ? "{brand_name} {category_name} Authorized Dealer in {city_name} | Batterymantra.com"
                : "{brand_name} {category_name} Authorized Dealer Online | Batterymantra.com"
              } 
              {...register("seoTitleTemplate")} 
            />
          </div>
          <div className="space-y-2">
            <Label>SEO Keywords</Label>
            <Input 
              placeholder={templateType.includes("WITH_CITY")
                ? "{brand_name} dealer in {city_name}, {brand_name} authorized shop {city_name}, genuine {brand_name} batteries"
                : "{brand_name} dealer, authorized {brand_name} dealer online, genuine {brand_name} batteries"
              } 
              {...register("seoKeywordsTemplate")} 
            />
          </div>
          <div className="space-y-2">
            <Label>SEO Description</Label>
            <Input 
              placeholder={templateType.includes("WITH_CITY")
                ? "Buy 100% Genuine {brand_name} {category_name} from Authorized Dealer in {city_name} at Best Price. Get Free Express Delivery and Installation in {delivery_time}."
                : "Buy 100% Genuine {brand_name} {category_name} from Authorized Dealer Online at Best Price in India. Get Free Express Delivery and Installation in {delivery_time}."
              } 
              {...register("seoDescriptionTemplate")} 
            />
          </div>
          <div className="space-y-2 mt-4 pt-4 border-t">
            <Label>OG Title</Label>
            <Input 
              placeholder={templateType.includes("WITH_CITY") 
                ? "{brand_name} {category_name} Authorized Dealer in {city_name} | Batterymantra.com"
                : "{brand_name} {category_name} Authorized Dealer Online | Batterymantra.com"
              } 
              {...register("ogTitleTemplate")} 
            />
          </div>
          <div className="space-y-2">
            <Label>OG Description</Label>
            <Input 
              placeholder={templateType.includes("WITH_CITY")
                ? "Buy 100% Genuine {brand_name} {category_name} from Authorized Dealer in {city_name} at Best Price. Free Express Delivery."
                : "Buy 100% Genuine {brand_name} {category_name} from Authorized Dealer Online at Best Price in India. Free Express Delivery."
              } 
              {...register("ogDescriptionTemplate")} 
            />
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
