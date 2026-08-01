import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, MapPinOff, Loader2, Search } from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { locationService } from "@/services/location.service";
import { toast } from "sonner";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal = ({ isOpen, onClose }: LocationModalProps) => {
  const [pincodeInput, setPincodeInput] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { detectLocation, isLocating } = useGeolocation();
  const { setLocation, pincode: currentPincode, isServiceable } = useLocationStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const qc = useQueryClient();

  const { data: allCities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["locations", "public-cities"],
    queryFn: () => locationService.getPublicCities(),
  });

  const popularCities = allCities.filter((c: any) => c.isPopular);
  const filteredCities = citySearch.trim() 
    ? allCities.filter((c: any) => c.cityName.toLowerCase().includes(citySearch.toLowerCase()))
    : popularCities;

  const handlePincodeCheck = async (code: string) => {
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit Pincode.");
      return;
    }
    
    setIsChecking(true);
    try {
      const result = await locationService.checkPincode(code);
      setLocation(code, result.serviceable, result.city);
      qc.invalidateQueries({ queryKey: ["products"] });
      
      if (result.serviceable) {
        toast.success(`Delivery available in ${result.city?.cityName}!`);
        onClose();
      } else {
        toast.error(`Sorry, we don't deliver to ${code} yet.`);
      }
    } catch (error) {
      toast.error("Failed to check pincode.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleCitySelect = (city: any) => {
    // If they click a popular city, we set it as their location without a specific pincode.
    // Since it's a registered city, we know delivery is available there.
    setLocation("", true, city);
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success(`Location set to ${city.cityName}!`);
    onClose();
  };

  const content = (
    <>
      <div className="p-4 bg-gradient-to-b from-primary/5 to-transparent border-b border-gray-50">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 justify-center sm:justify-start">
            <MapPin className="text-primary h-5 w-5" />
            Select Your Location
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            To see accurate pricing and delivery options, please set your location.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-8 sm:pb-4 pt-3 overflow-y-auto">
        {/* Detect Location Button */}
        <Button 
          variant="default" 
          className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all duration-300"
          onClick={() => {
            detectLocation().then(() => {
              // We don't automatically close here unless we want to, wait for state to update.
            });
          }}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Navigation className="mr-2 h-5 w-5" />
          )}
          {isLocating ? "Detecting Location..." : "Detect My Location"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-medium">
            <span className="bg-white px-3 text-gray-400">
              Or enter pincode
            </span>
          </div>
        </div>

        {/* Manual Input */}
        <div className="flex gap-2">
          <Input 
            placeholder="Enter 6-digit Pincode" 
            value={pincodeInput}
            onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-12 text-lg text-center tracking-widest bg-gray-50 border-gray-200 focus-visible:ring-primary/50 focus-visible:border-primary shadow-inner"
            maxLength={6}
          />
          <Button 
            className="h-12 px-6" 
            onClick={() => handlePincodeCheck(pincodeInput)}
            disabled={isChecking || pincodeInput.length !== 6}
          >
            {isChecking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check"}
          </Button>
        </div>

        {/* Current Status Indicator */}
        {currentPincode && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${isServiceable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {isServiceable ? <MapPin className="h-5 w-5 mt-0.5 shrink-0" /> : <MapPinOff className="h-5 w-5 mt-0.5 shrink-0" />}
            <div>
              <p className="font-semibold text-sm">
                {isServiceable ? "Delivery Available!" : "Delivery Not Available"}
              </p>
              <p className="text-xs opacity-90 mt-1">
                Pincode: {currentPincode}
              </p>
            </div>
          </div>
        )}

        {/* City Search */}
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search your city..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="pl-9 h-10 bg-gray-50 border-gray-200 focus-visible:ring-primary/50"
            />
          </div>
          
          <div className="max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
            {filteredCities.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {filteredCities.map((city: any) => (
                  <button
                    key={city.cityId}
                    onClick={() => handleCitySelect(city)}
                    className="flex flex-col items-center p-2 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    {city.cityImage ? (
                      <img src={city.cityImage} alt={city.cityName} className="w-8 h-8 object-cover rounded-full mb-1 border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-gray-700 text-center leading-tight line-clamp-1">{city.cityName}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500 py-4">No cities found</div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-sm bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden p-0">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-white rounded-t-[24px] max-h-[85vh] outline-none">
        {content}
      </DrawerContent>
    </Drawer>
  );
};
