import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  MapPinOff,
  Loader2,
  Search,
  ArrowRight,
  Zap,
  Truck,
  Clock,
  Wrench,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";
import { useModalStore } from "@/store/useModalStore";
import { useLocationNavigation } from "@/hooks/useLocationNavigation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useQuery } from "@tanstack/react-query";
import { locationService } from "@/services/location.service";
import { toast } from "sonner";

interface LocationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const LocationModal = ({ isOpen: propIsOpen, onClose: propOnClose }: LocationModalProps) => {
  const [pincodeInput, setPincodeInput] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const { isLocationModalOpen, closeLocationModal } = useModalStore();
  const isControlled = propIsOpen !== undefined;
  const open = isControlled ? propIsOpen : isLocationModalOpen;

  const handleClose = () => {
    if (isControlled) {
      propOnClose?.();
    } else {
      closeLocationModal();
    }
  };

  const { detectLocation, isLocating } = useGeolocation();
  const { pincode: currentPincode, city: currentCity, isServiceable } = useLocationStore();
  const { changeLocation } = useLocationNavigation();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { data: allCities = [] } = useQuery({
    queryKey: ["locations", "public-cities"],
    queryFn: () => locationService.getPublicCities(),
  });

  const popularCities = allCities.filter((c: any) => c.isPopular);
  const displayCities = citySearch.trim()
    ? allCities.filter((c: any) => c.cityName.toLowerCase().includes(citySearch.toLowerCase()))
    : (popularCities.length > 0 ? popularCities : allCities.slice(0, 8));

  const handlePincodeCheck = async (code: string) => {
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit Pincode.");
      return;
    }

    setIsChecking(true);
    try {
      const result = await locationService.checkPincode(code);
      if (result.serviceable && result.city) {
        changeLocation(result.city, code, true);
        toast.success(`Delivery available in ${result.city.cityName}!`);
        handleClose();
      } else {
        useLocationStore.getState().setLocation(code, false, result.city);
        toast.error(`Sorry, we don't deliver to ${code} yet.`);
      }
    } catch {
      toast.error("Failed to check pincode. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleCitySelect = (city: any) => {
    changeLocation(city, "", true);
    toast.success(`Location set to ${city.cityName}!`);
    handleClose();
  };

  const handleGpsDetect = async () => {
    try {
      await detectLocation(true);
      // If store updated city/pincode, close modal
      const state = useLocationStore.getState();
      if (state.city || state.pincode) {
        handleClose();
      }
    } catch {
      // Handled inside useGeolocation
    }
  };

  const content = (
    <div className="flex flex-col">
      {/* Header with Glowing Icon & Headline */}
      <div className="p-4 sm:p-5 pb-3 border-b border-gray-100 bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-primary/25 rounded-full blur-md animate-pulse" />
            <div className="relative w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1 pr-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight leading-snug">
              Choose Your Location
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Enter your pincode to check instant doorstep delivery &amp; free fitment.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] sm:max-h-[520px] overflow-y-auto no-scrollbar">
        {/* Primary GPS Action Card */}
        <button
          type="button"
          onClick={handleGpsDetect}
          disabled={isLocating}
          className="w-full text-left p-3.5 rounded-xl bg-gradient-to-r from-primary/[0.05] via-primary/[0.02] to-transparent border border-primary/20 hover:border-primary/50 hover:bg-primary/[0.08] transition-all group relative overflow-hidden flex items-center justify-between shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary/25 animate-ping opacity-75" />
              <span className="relative w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>{isLocating ? "Detecting GPS Location..." : "Use Current Location"}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                  Fastest
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Detect location for 45-min rapid vehicle dispatch
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center text-gray-400 shadow-xs shrink-0 border border-gray-100">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Divider with OR badge */}
        <div className="relative flex items-center justify-center py-0.5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative bg-white px-2">
            <span className="font-bold text-[10px] tracking-wider uppercase text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
              OR ENTER PINCODE
            </span>
          </div>
        </div>

        {/* Pincode Search Bar */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Enter 6-digit Pincode (e.g. 110001)"
              value={pincodeInput}
              onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pincodeInput.length === 6) {
                  handlePincodeCheck(pincodeInput);
                }
              }}
              className="w-full h-11 pl-10 pr-24 rounded-xl bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs transition-all tracking-wider"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => handlePincodeCheck(pincodeInput)}
              disabled={isChecking || pincodeInput.length !== 6}
              className="absolute right-1 top-1 bottom-1 px-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-transform active:scale-95 disabled:opacity-40"
            >
              {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Check"}
            </Button>
          </div>

          {/* Serviceability Status Pill */}
          {currentPincode && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2.5 transition-all duration-300 ${
                isServiceable
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200/80"
                  : "bg-rose-50 text-rose-900 border border-rose-200/80"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                  isServiceable ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                }`}
              >
                {isServiceable ? <Zap className="w-3.5 h-3.5" /> : <MapPinOff className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-1 font-bold">
                  <span className="flex items-center gap-1">
                    {isServiceable ? (
                      <>
                        <span>Express 45-Min Doorstep Fitment</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </>
                    ) : (
                      "Delivery Not Available Yet"
                    )}
                  </span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-full shadow-xs border border-gray-100 font-semibold text-gray-700">
                    PIN: {currentPincode}
                  </span>
                </div>
                <p className="opacity-90 mt-0.5 leading-relaxed text-[11px]">
                  {isServiceable
                    ? `Technicians active in ${currentCity?.cityName || "your zone"} with calibrated digital testers.`
                    : `We don't service pincode ${currentPincode} yet. Select a city hub below or contact support.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Popular Cities Section */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Truck className="w-4 h-4 text-primary" />
              <span>Popular Delivery Hubs</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Free On-Site Testing
            </span>
          </div>

          {/* Quick city search filter */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search city hub..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 text-gray-900"
            />
          </div>

          {/* City Chips Grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            {displayCities.map((c: any) => {
              const isSelected = currentCity?.cityName?.toLowerCase() === c.cityName?.toLowerCase();
              return (
                <button
                  key={c.cityId || c.cityName}
                  type="button"
                  onClick={() => handleCitySelect(c)}
                  className={`p-2 rounded-xl transition-all flex flex-col items-center justify-center text-center cursor-pointer group border ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm shadow-primary/20 ring-2 ring-primary/20 font-bold"
                      : "bg-gray-50 hover:bg-primary/5 hover:border-primary/30 border-gray-200/80 text-gray-800"
                  }`}
                >
                  {c.cityImage ? (
                    <img
                      src={c.cityImage}
                      alt={c.cityName}
                      className="w-7 h-7 object-cover rounded-full mb-1 border border-white shadow-xs"
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 shadow-xs ${
                        isSelected ? "bg-white/20 text-white" : "bg-white text-gray-600 group-hover:text-primary"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="text-[11px] font-semibold leading-tight line-clamp-1">{c.cityName}</span>
                  <span
                    className={`text-[9px] font-medium mt-0.5 ${
                      isSelected ? "text-white/80" : "text-emerald-700 font-semibold"
                    }`}
                  >
                    {isSelected ? "Selected" : "45m SLA"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trust Value Props Strip */}
        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-center gap-1 text-[11px] text-gray-600 font-medium">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>45-120m Dispatch</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          <div className="flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Free Fitment</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>OE Warranty</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : null)}>
        <DialogContent className="sm:max-w-[490px] bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden p-0">
          <DialogTitle className="sr-only">Choose Your Delivery Location</DialogTitle>
          <DialogDescription className="sr-only">
            Select your city or enter a pincode to check instant doorstep delivery.
          </DialogDescription>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => (!o ? handleClose() : null)}>
      <DrawerContent className="bg-white rounded-t-[24px] max-h-[88vh] outline-none">
        <DrawerTitle className="sr-only">Choose Your Delivery Location</DrawerTitle>
        <DrawerDescription className="sr-only">
          Select your city or enter a pincode to check instant doorstep delivery.
        </DrawerDescription>
        {content}
      </DrawerContent>
    </Drawer>
  );
};
