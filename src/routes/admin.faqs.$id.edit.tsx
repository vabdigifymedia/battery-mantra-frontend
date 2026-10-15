import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { faqService } from "@/services/faq.service";
import { adminFaqsQuery } from "@/queries";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Spinner } from "@/components/feedback/Spinner";
import { FaqVariableHelper } from "@/components/admin/FaqVariableHelper";
import type { FaqResponse } from "@/types/dto";

export const Route = createFileRoute("/admin/faqs/$id/edit")({
  component: EditFaq,
});

const PAGE_TYPES = [
  { value: "UNIVERSAL", label: "Universal" },
  { value: "CATEGORY", label: "Category" },
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "BRAND", label: "Brand" },
  { value: "BRAND_MODEL", label: "Manufacturer Model" },
  { value: "PRODUCT", label: "Product" },
];

function EditFaq() {
  const { id } = Route.useParams();
  
  const { data: faqs, isLoading } = useQuery(adminFaqsQuery());
  const faq = faqs?.find((f: any) => f.faqId === id);

  if (isLoading) return <div className="p-12 text-center"><Spinner className="mx-auto" /></div>;
  if (!faq) return <div className="p-12 text-center text-red-500">FAQ not found.</div>;

  return <EditFaqForm faq={faq} id={id} />;
}

function EditFaqForm({ faq, id }: { faq: any; id: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pageType, setPageType] = useState<string>(faq.pageType || "");
  const [title, setTitle] = useState(faq.title || "");
  const [description, setDescription] = useState(faq.description || "");
  const [isActive, setIsActive] = useState(faq.isActive ?? faq.active ?? true);

  const updateMutation = useMutation({
    mutationFn: (data: any) => faqService.updateFaq(id, data),
    onSuccess: () => {
      toast.success("FAQ updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
      navigate({ to: "/admin/faqs" });
    },
    onError: () => {
      toast.error("Failed to update FAQ.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageType || !title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    updateMutation.mutate({
      pageType,
      title,
      description,
      isActive,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/faqs" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Edit FAQ</h2>
          <p className="text-muted-foreground">Modify dynamic FAQ with curly bracket variable tokens.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <div className="space-y-2">
          <Label>Page Type <span className="text-destructive">*</span></Label>
          <Select value={pageType} onValueChange={setPageType} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a page type..." />
            </SelectTrigger>
            <SelectContent>
              {PAGE_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Which page should this FAQ appear on?</p>
        </div>

        <FaqVariableHelper pageType={pageType} />

        <div className="space-y-2">
          <Label>Question (Title) <span className="text-destructive">*</span></Label>
          <AutoResizeTextarea 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. What is the price of {product_name} in {city_name}?" 
            required 
          />
          <p className="text-xs text-muted-foreground">
            Use curly brackets for variables, e.g. <code className="bg-muted px-1 py-0.5 rounded">{`{product_name}`}</code>, <code className="bg-muted px-1 py-0.5 rounded">{`{city_name}`}</code>, <code className="bg-muted px-1 py-0.5 rounded">{`{price}`}</code>.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Answer (Description) <span className="text-destructive">*</span></Label>
          <RichTextEditor 
            value={description}
            onChange={setDescription}
            placeholder="Provide a detailed answer. Use dynamic tags like {category_name}, {brand_name}, {price}, etc."
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-input h-4 w-4 text-brand focus:ring-brand"
          />
          <Label htmlFor="isActive" className="cursor-pointer">Active (Visible to users)</Label>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/faqs" })}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
