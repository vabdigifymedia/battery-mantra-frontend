import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";
import { LocationModal } from "./LocationModal";
import { useGeolocation } from "@/hooks/useGeolocation";

export const LocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pincode, city, locationPermissionGranted } = useLocationStore();
  const { detectLocation, isLocating } = useGeolocation();
  useEffect(() => {
    // Auto-detect location if not set, and user hasn't explicitly denied permission
    if (!pincode && locationPermissionGranted !== false) {
      detectLocation();
    }
  }, []);

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
        disabled={isLocating}
      >
        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        <div className="flex flex-col items-start leading-none text-left">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            {isLocating ? "Detecting..." : (pincode ? "Delivering to" : "Select Location")}
          </span>
          <span className="text-sm font-semibold truncate max-w-[150px]">
            {isLocating ? "Please wait" : (city?.cityName ? `${city.cityName}, ${pincode}` : pincode || "Enter Pincode")}
          </span>
        </div>
      </Button>

      {/* Mobile view - just icon */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden hover:bg-primary/10 hover:text-primary"
        disabled={isLocating}
      >
        {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
      </Button>

      <LocationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
