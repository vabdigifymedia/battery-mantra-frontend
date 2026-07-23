import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { faqService } from "@/services/faq.service";
import { adminFaqsQuery } from "@/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Spinner } from "@/components/feedback/Spinner";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: faqs, isLoading } = useQuery(adminFaqsQuery());
  const faq = faqs?.find((f) => f.faqId === id);

  const [pageType, setPageType] = useState<any>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (faq) {
      setPageType(faq.pageType);
      setTitle(faq.title);
      setDescription(faq.description);
      setIsActive(faq.isActive);
    }
  }, [faq]);

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

  if (isLoading) return <div className="p-12 text-center"><Spinner className="mx-auto" /></div>;
  if (!faq) return <div className="p-12 text-center text-red-500">FAQ not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/faqs" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Edit FAQ</h2>
          <p className="text-muted-foreground">Modify an existing dynamic FAQ.</p>
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
        
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={isActive ? "ACTIVE" : "INACTIVE"} onValueChange={(val) => setIsActive(val === "ACTIVE")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/faqs" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Updating..." : "Update FAQ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
