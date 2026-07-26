import { useState } from "react";
import { Truck, CheckCircle2, RotateCcw, Banknote, FileText, ChevronRight, MapPin } from "lucide-react";
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
    <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm text-xs sm:text-sm text-foreground space-y-3">
      {/* Top Header: Location + Delivery Price */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span>Deliver to <span className="font-bold text-foreground">{cityName}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-semibold text-xs">
            {deliveryCharge === 0 ? (
              <span className="text-emerald-600 font-bold">Free</span>
            ) : (
              <span className="text-foreground">₹{deliveryCharge}</span>
            )}
            {originalDeliveryCharge > 0 && (
              <span className="text-muted-foreground line-through text-[11px] font-normal">
                ₹{originalDeliveryCharge}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="text-xs text-primary font-semibold hover:underline underline-offset-2 ml-1"
          >
            Change
          </button>
        </div>
      </div>

      {/* Row 1: Delivery Time & SLA */}
      <button
        type="button"
        onClick={() => setIsLocationModalOpen(true)}
        className="w-full flex items-center justify-between text-left group hover:bg-muted/30 p-1.5 -mx-1.5 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-foreground text-xs sm:text-sm">
              {formatSla()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              if ordered between 9:00 A.M. to 6:00 P.M.
            </p>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>

      {/* Row 2: Features Grid (Compact 3-Item List) */}
      <div className="grid grid-cols-1 gap-1 pt-1 border-t border-border/40 text-xs">
        {/* Replacement Policy */}
        <button
          type="button"
          onClick={() => setActiveModal("replacement")}
          className="flex items-center justify-between p-1.5 -mx-1.5 rounded-lg hover:bg-muted/30 transition-colors group text-left"
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-medium text-foreground">Replacement Policy</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* Cash on Delivery */}
        <button
          type="button"
          onClick={() => setActiveModal("cod")}
          className="flex items-center justify-between p-1.5 -mx-1.5 rounded-lg hover:bg-muted/30 transition-colors group text-left"
        >
          <div className="flex items-center gap-2.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium text-foreground">
              {isCodAvailable ? "Cash on Delivery Available" : "Pay Online Available"}
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* GST Invoice */}
        <button
          type="button"
          onClick={() => setActiveModal("gst")}
          className="flex items-center justify-between p-1.5 -mx-1.5 rounded-lg hover:bg-muted/30 transition-colors group text-left"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="font-medium text-foreground">GST Invoice Available</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
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
