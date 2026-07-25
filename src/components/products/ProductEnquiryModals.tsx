import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { callbacksService } from "@/services/catalog.service";
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
  productName: string;
  brandName?: string;
  productPrice?: number;
}

export function AskQuotationModal({
  open,
  onOpenChange,
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
    mutationFn: (mobileNumber: string) => callbacksService.create({ mobileNumber }),
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

    mutation.mutate(mobile);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Ask for Quotation</DialogTitle>
              <DialogDescription className="text-xs">
                Request an official price quote for bulk or business purchase.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-3.5 space-y-1 my-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Target Product
          </p>
          <p className="text-sm font-bold text-foreground line-clamp-1">{productName}</p>
          {productPrice ? (
            <p className="text-xs text-muted-foreground">
              Standard Price: <span className="font-semibold text-foreground">₹{productPrice.toLocaleString()}</span> / unit
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quote-name" className="text-xs font-semibold flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name *
              </Label>
              <Input
                id="quote-name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quote-mobile" className="text-xs font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Mobile Number *
              </Label>
              <Input
                id="quote-mobile"
                type="tel"
                placeholder="10-digit number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quote-email" className="text-xs font-semibold flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
              </Label>
              <Input
                id="quote-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quote-qty" className="text-xs font-semibold">
                Required Quantity *
              </Label>
              <Input
                id="quote-qty"
                type="number"
                min="1"
                placeholder="e.g. 5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote-msg" className="text-xs font-semibold">
              Additional Requirements / Delivery Location
            </Label>
            <Textarea
              id="quote-msg"
              rows={2}
              placeholder="Specify model requirement, city, or special delivery instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="submit"
              variant="brand"
              className="flex-1 h-11 text-sm font-semibold"
              disabled={mutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Submitting..." : "Submit Quotation Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleWhatsAppQuote}
              className="h-11 text-sm font-semibold border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
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
  productName: string;
  brandName?: string;
}

export function CorporateEnquiryModal({
  open,
  onOpenChange,
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
    mutationFn: (mobileNumber: string) => callbacksService.create({ mobileNumber }),
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

    mutation.mutate(mobile);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Corporate & B2B Enquiry</DialogTitle>
              <DialogDescription className="text-xs">
                Bulk discounts, GST invoices & dedicated business support.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Feature Highlights */}
        <div className="flex flex-wrap gap-2 my-1">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-1">
            <FileCheck className="h-3.5 w-3.5 mr-1" /> GST Invoice Available
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-1">
            <Percent className="h-3.5 w-3.5 mr-1" /> Bulk Tier Pricing
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs py-1">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Pan-India Delivery
          </Badge>
        </div>

        <div className="rounded-xl border bg-muted/40 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Product Interested
          </p>
          <p className="text-sm font-bold text-foreground line-clamp-1">{productName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="corp-company" className="text-xs font-semibold flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-muted-foreground" /> Company / Business Name *
              </Label>
              <Input
                id="corp-company"
                placeholder="e.g. Acme Logistics Pvt Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="corp-contact" className="text-xs font-semibold flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Contact Person *
              </Label>
              <Input
                id="corp-contact"
                placeholder="e.g. Vikram Singh"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="corp-mobile" className="text-xs font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Mobile Number *
              </Label>
              <Input
                id="corp-mobile"
                type="tel"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="corp-email" className="text-xs font-semibold flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Work Email
              </Label>
              <Input
                id="corp-email"
                type="email"
                placeholder="procurement@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="corp-gstin" className="text-xs font-semibold">
                GSTIN (Optional)
              </Label>
              <Input
                id="corp-gstin"
                placeholder="22AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="corp-qty" className="text-xs font-semibold">
                Estimated Order Quantity *
              </Label>
              <Input
                id="corp-qty"
                type="number"
                min="1"
                placeholder="e.g. 10+"
                value={estimatedQty}
                onChange={(e) => setEstimatedQty(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corp-notes" className="text-xs font-semibold">
              Fleet / Institutional Requirements
            </Label>
            <Textarea
              id="corp-notes"
              rows={2}
              placeholder="Tell us about your fleet, recurring battery needs or delivery locations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              disabled={mutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Submitting..." : "Submit Corporate Enquiry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleWhatsAppCorporate}
              className="h-11 text-sm font-semibold border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
            >
              WhatsApp B2B Team
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
