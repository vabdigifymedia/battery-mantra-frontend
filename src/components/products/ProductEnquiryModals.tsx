import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { enquiriesService } from "@/services/enquiries.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Building2,
  Send,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  FileCheck,
  Percent,
} from "lucide-react";

interface QuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName: string;
  brandName?: string;
  productPrice?: number;
}

export function AskQuotationModal({
  open,
  onOpenChange,
  productId,
  productName,
  brandName,
  productPrice,
}: QuotationModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof enquiriesService.createQuotation>[0]) => 
      enquiriesService.createQuotation(data),
    onSuccess: () => {
      toast.success("Quotation request submitted! Our sales team will email/call you shortly.");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to submit quotation request. Please try again.");
    },
  });

  const resetForm = () => {
    setName("");
    setMobile("");
    setEmail("");
    setQuantity("1");
    setMessage("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    mutation.mutate({
      name,
      mobileNumber: mobile,
      email: email || undefined,
      quantity,
      message: message || undefined,
      productId,
      productName: productName + (brandName ? ` (${brandName})` : ""),
    });
  };

  const handleWhatsAppQuote = () => {
    const text = encodeURIComponent(
      `Hi BatteryMantra, I would like to request an official quotation for:\n\n*Product:* ${productName}${
        brandName ? ` (${brandName})` : ""
      }\n*Qty Required:* ${quantity}\n*Name:* ${name || "Customer"}\n*Mobile:* ${mobile || "N/A"}\n*Email:* ${
        email || "N/A"
      }${message ? `\n*Details:* ${message}` : ""}`
    );
    window.open(`https://wa.me/919200920051?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-4 sm:p-5 gap-3">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Ask for Quotation</DialogTitle>
              <DialogDescription className="text-xs">
                Request an official price quote for bulk or business purchase.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 px-3 py-1.5 text-xs flex items-center justify-between">
          <div className="truncate pr-2">
            <span className="font-semibold text-muted-foreground uppercase text-[10px]">Product: </span>
            <span className="font-bold text-foreground">{productName}</span>
          </div>
          {productPrice ? (
            <span className="font-bold text-primary shrink-0">₹{productPrice.toLocaleString()}</span>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="quote-name" className="text-[11px] font-semibold flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" /> Full Name *
              </Label>
              <Input
                id="quote-name"
                placeholder="e.g. Rahul Sharma"
                className="h-8 text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="quote-mobile" className="text-[11px] font-semibold flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" /> Mobile Number *
              </Label>
              <Input
                id="quote-mobile"
                type="tel"
                placeholder="10-digit number"
                className="h-8 text-xs"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="quote-email" className="text-[11px] font-semibold flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" /> Email Address
              </Label>
              <Input
                id="quote-email"
                type="email"
                placeholder="name@example.com"
                className="h-8 text-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="quote-qty" className="text-[11px] font-semibold">
                Required Quantity *
              </Label>
              <Input
                id="quote-qty"
                type="number"
                min="1"
                placeholder="e.g. 5"
                className="h-8 text-xs"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="quote-msg" className="text-[11px] font-semibold">
              Additional Requirements / Delivery Location
            </Label>
            <Textarea
              id="quote-msg"
              rows={2}
              className="text-xs min-h-[48px] py-1.5"
              placeholder="Model requirement, city, or delivery instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              variant="brand"
              size="sm"
              className="flex-1 h-9 text-xs font-semibold"
              disabled={mutation.isPending}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {mutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsAppQuote}
              className="h-9 text-xs font-semibold border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
            >
              WhatsApp Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CorporateEnquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName: string;
  brandName?: string;
}

export function CorporateEnquiryModal({
  open,
  onOpenChange,
  productId,
  productName,
  brandName,
}: CorporateEnquiryModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [estimatedQty, setEstimatedQty] = useState("10");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof enquiriesService.createCorporate>[0]) => 
      enquiriesService.createCorporate(data),
    onSuccess: () => {
      toast.success("Corporate enquiry submitted! Our B2B account manager will contact you shortly.");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to submit corporate enquiry. Please try again.");
    },
  });

  const resetForm = () => {
    setCompanyName("");
    setContactPerson("");
    setMobile("");
    setEmail("");
    setGstin("");
    setEstimatedQty("10");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!contactPerson.trim()) {
      toast.error("Please enter contact person name.");
      return;
    }
    if (!companyName.trim()) {
      toast.error("Please enter company or organization name.");
      return;
    }

    mutation.mutate({
      companyName,
      contactPerson,
      mobileNumber: mobile,
      email: email || undefined,
      gstin: gstin || undefined,
      estimatedQty,
      notes: notes || undefined,
      productId,
      productName: productName + (brandName ? ` (${brandName})` : ""),
    });
  };

  const handleWhatsAppCorporate = () => {
    const text = encodeURIComponent(
      `Hi BatteryMantra B2B Team, I have a Corporate / Bulk Enquiry:\n\n*Company:* ${
        companyName || "N/A"
      }\n*Contact Person:* ${contactPerson || "N/A"}\n*Mobile:* ${mobile || "N/A"}\n*Work Email:* ${
        email || "N/A"
      }\n*GSTIN:* ${gstin || "N/A"}\n*Product:* ${productName}${
        brandName ? ` (${brandName})` : ""
      }\n*Estimated Qty:* ${estimatedQty}\n${notes ? `*Notes:* ${notes}` : ""}`
    );
    window.open(`https://wa.me/919200920051?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-4 sm:p-5 gap-2.5">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Corporate & B2B Enquiry</DialogTitle>
              <DialogDescription className="text-xs">
                Bulk discounts, GST invoices & dedicated business support.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0.5 px-2">
            <FileCheck className="h-3 w-3 mr-1" /> GST Invoice
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] py-0.5 px-2">
            <Percent className="h-3 w-3 mr-1" /> Bulk Pricing
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] py-0.5 px-2">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Pan-India Delivery
          </Badge>
        </div>

        <div className="rounded-lg border bg-muted/40 px-3 py-1 text-xs">
          <span className="font-semibold text-muted-foreground uppercase text-[10px]">Product: </span>
          <span className="font-bold text-foreground line-clamp-1">{productName}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label htmlFor="corp-company" className="text-[11px] font-semibold flex items-center gap-1">
                <Building className="h-3 w-3 text-muted-foreground" /> Company Name *
              </Label>
              <Input
                id="corp-company"
                placeholder="e.g. Acme Logistics"
                className="h-8 text-xs"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="corp-contact" className="text-[11px] font-semibold flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" /> Contact Person *
              </Label>
              <Input
                id="corp-contact"
                placeholder="e.g. Vikram Singh"
                className="h-8 text-xs"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label htmlFor="corp-mobile" className="text-[11px] font-semibold flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" /> Mobile Number *
              </Label>
              <Input
                id="corp-mobile"
                type="tel"
                placeholder="10-digit number"
                className="h-8 text-xs"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="corp-email" className="text-[11px] font-semibold flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" /> Work Email
              </Label>
              <Input
                id="corp-email"
                type="email"
                placeholder="procurement@company.com"
                className="h-8 text-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label htmlFor="corp-gstin" className="text-[11px] font-semibold">
                GSTIN (Optional)
              </Label>
              <Input
                id="corp-gstin"
                placeholder="22AAAAA0000A1Z5"
                className="h-8 text-xs"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="corp-qty" className="text-[11px] font-semibold">
                Estimated Quantity *
              </Label>
              <Input
                id="corp-qty"
                type="number"
                min="1"
                placeholder="e.g. 10+"
                className="h-8 text-xs"
                value={estimatedQty}
                onChange={(e) => setEstimatedQty(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <Label htmlFor="corp-notes" className="text-[11px] font-semibold">
              Fleet / Institutional Requirements
            </Label>
            <Textarea
              id="corp-notes"
              rows={2}
              className="text-xs min-h-[44px] py-1"
              placeholder="Tell us about your battery needs or delivery locations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              className="flex-1 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              disabled={mutation.isPending}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {mutation.isPending ? "Submitting..." : "Submit Corporate Enquiry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsAppCorporate}
              className="h-9 text-xs font-semibold border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
            >
              WhatsApp B2B
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
