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
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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
          <p className="text-muted-foreground">Create a new dynamic FAQ.</p>
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
        </div>

        <div className="space-y-2">
          <Label>Title (Question) <span className="text-destructive">*</span></Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. How do I know my car battery is failing?" 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Description (Answer) <span className="text-destructive">*</span></Label>
          <div className="bg-white rounded-md border">
            <ReactQuill 
              theme="snow" 
              value={description} 
              onChange={setDescription} 
              className="h-[200px] mb-12"
            />
          </div>
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
