import { useState } from "react";
import { Truck, CheckCircle2, RotateCcw, Banknote, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LocationModal } from "@/components/location/LocationModal";
import type { CityDto } from "@/types/dto";

interface ProductDeliveryInfoBoxProps {
  city: CityDto | null;
  deliveryTimeDays?: number | string;
  deliveryTimeHours?: number | string;
}

export function ProductDeliveryInfoBox({
  city,
  deliveryTimeDays,
  deliveryTimeHours,
}: ProductDeliveryInfoBoxProps) {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"replacement" | "cod" | "gst" | null>(null);

  const cityName = city?.cityName || "Noida";
  const isCodAvailable = city?.isCodAvailable !== false;
  const deliveryCharge = city?.deliveryCharge ?? 0;
  const originalDeliveryCharge = city?.originalDeliveryCharge ?? 40;

  const parsedHours = deliveryTimeHours ? Number(deliveryTimeHours) : undefined;
  const parsedDays = deliveryTimeDays ? Number(deliveryTimeDays) : undefined;

  // Delivery SLA Text
  const formatSla = () => {
    if (parsedHours && parsedHours <= 2) {
      return `Delivery by Today within ${parsedHours} Hours`;
    }
    if (parsedDays && parsedDays === 1) {
      return "Delivery by Tomorrow";
    }
    if (parsedDays) {
      return `Delivery within ${parsedDays} Days`;
    }
    return "Delivery by Today within 1 Hours";
  };

  return (
    <div className="space-y-3 font-sans">
      {/* City Header */}
      <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
        <span>Deliver to <span className="font-bold text-foreground">{cityName}</span></span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLocationModalOpen(true)}
          className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/5 hover:text-primary rounded-md font-medium"
        >
          Change
        </Button>
      </div>

      {/* Main Delivery Box */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4 text-sm text-foreground">
        
        {/* Row 1: Free / Discounted Delivery */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2 font-medium">
            {deliveryCharge === 0 ? (
              <span className="text-emerald-600 font-bold text-base">Free</span>
            ) : (
              <span className="text-foreground font-bold text-base">₹{deliveryCharge}</span>
            )}
            {originalDeliveryCharge > 0 && (
              <span className="text-muted-foreground line-through text-xs font-normal">
                ₹{originalDeliveryCharge}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Delivery SLA & Cutoff */}
        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          className="w-full flex items-start justify-between text-left group hover:opacity-80 transition-opacity"
        >
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground leading-snug">
                {formatSla()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                if ordered between 9:00 A.M. to 6:00 P.M.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
        </button>

        {/* Row 3: Replacement Policy */}
        <button
          type="button"
          onClick={() => setActiveModal("replacement")}
          className="w-full flex items-center justify-between text-left group hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="font-semibold text-foreground">Replacement Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* Row 4: Cash on Delivery */}
        <button
          type="button"
          onClick={() => setActiveModal("cod")}
          className="w-full flex items-center justify-between text-left group hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="font-semibold text-foreground">
              {isCodAvailable ? "Cash on Delivery Available" : "Pay Online Available"}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* Row 5: GST Invoice */}
        <button
          type="button"
          onClick={() => setActiveModal("gst")}
          className="w-full flex items-center justify-between text-left group hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-semibold text-foreground">GST Invoice Available</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>

      {/* Location Modal */}
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />

      {/* Info Modals */}
      <Dialog open={activeModal === "replacement"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600" /> Replacement Policy
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm space-y-2">
              <p>Every battery purchased from BatteryMantra comes with a 100% genuine manufacturer warranty.</p>
              <p>If you experience any manufacturing defect during the warranty period, we provide hassle-free doorstep inspection and replacement directly from the brand.</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "cod"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" /> Cash on Delivery (COD)
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm space-y-2">
              <p>Cash on delivery is available for {cityName} and surrounding serviceable pin codes.</p>
              <p>You can pay via Cash, UPI, or Credit/Debit Card to our delivery & installation partner upon successful delivery.</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "gst"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" /> Business GST Invoice
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm space-y-2">
              <p>Claim input tax credit (ITC) on your battery purchase.</p>
              <p>You can enter your company GSTIN and business name during checkout to get a tax invoice with your order.</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
