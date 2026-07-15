import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";
import { LocationModal } from "./LocationModal";

export const LocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pincode, city, isServiceable } = useLocationStore();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
    if (!pincode) {
      setIsOpen(true);
    }
  }, [pincode]);

  if (!isMounted) return null;

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
      >
        <MapPin className="h-4 w-4" />
        <div className="flex flex-col items-start leading-none text-left">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            {pincode ? "Delivering to" : "Select Location"}
          </span>
          <span className="text-sm font-semibold truncate max-w-[150px]">
            {city?.cityName ? `${city.cityName}, ${pincode}` : pincode || "Enter Pincode"}
          </span>
        </div>
      </Button>

      {/* Mobile view - just icon */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden hover:bg-primary/10 hover:text-primary"
      >
        <MapPin className="h-5 w-5" />
      </Button>

      <LocationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
