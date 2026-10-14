import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { faqService } from "@/services/faq.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FaqVariableHelper } from "@/components/admin/FaqVariableHelper";

export const Route = createFileRoute("/admin/faqs/new")({
  component: NewFaq,
});

const PAGE_TYPES = [
  { value: "UNIVERSAL", label: "Universal" },
  { value: "CATEGORY", label: "Category" },
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "BRAND", label: "Brand" },
  { value: "BRAND_MODEL", label: "Manufacturer Model" },
  { value: "PRODUCT", label: "Product" },
];

function NewFaq() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [pageType, setPageType] = useState<any>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const createMutation = useMutation({
    mutationFn: faqService.createFaq,
    onSuccess: () => {
      toast.success("FAQ created successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
      navigate({ to: "/admin/faqs" });
    },
    onError: () => {
      toast.error("Failed to create FAQ.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageType || !title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    createMutation.mutate({
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
          <h2 className="font-display text-3xl font-bold tracking-tight">Add New FAQ</h2>
          <p className="text-muted-foreground">Create a new dynamic FAQ with curly bracket variable tokens.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <div className="space-y-2">
          <Label>Page Type <span className="text-destructive">*</span></Label>
          <Select value={pageType || undefined} onValueChange={setPageType} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a page type..." />
            </SelectTrigger>
            <SelectContent>
              {PAGE_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FaqVariableHelper pageType={pageType} />

        <div className="space-y-2">
          <Label>Title (Question) <span className="text-destructive">*</span></Label>
          <Input 
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
          <Label>Description (Answer) <span className="text-destructive">*</span></Label>
          <RichTextEditor 
            value={description} 
            onChange={setDescription} 
            placeholder="Provide a detailed answer. Use dynamic tags like {category_name}, {brand_name}, {price}, etc."
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/faqs" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save FAQ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
