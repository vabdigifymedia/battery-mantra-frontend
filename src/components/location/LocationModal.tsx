import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, MapPinOff, Loader2 } from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { locationService } from "@/services/location.service";
import { toast } from "sonner";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal = ({ isOpen, onClose }: LocationModalProps) => {
  const [pincodeInput, setPincodeInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { detectLocation, isLocating } = useGeolocation();
  const { setLocation, pincode: currentPincode, isServiceable } = useLocationStore();

  const qc = useQueryClient();

  const { data: popularCities, isLoading: isLoadingCities } = useQuery({
    queryKey: ["locations", "public-cities"],
    queryFn: () => locationService.getPublicCities(),
    select: (cities) => cities.filter(c => c.isPopular),
  });

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden p-0">
        <div className="p-6 bg-gradient-to-b from-primary/5 to-transparent border-b border-gray-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <MapPin className="text-primary h-6 w-6" />
              Select Your Location
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              To see accurate pricing and delivery options, please set your location.
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 pb-6 pt-4">
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

          {/* Popular Cities */}
          {popularCities && popularCities.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Popular Cities</h4>
              <div className="grid grid-cols-3 gap-2">
                {popularCities.map((city) => (
                  <button
                    key={city.cityId}
                    onClick={() => handleCitySelect(city)}
                    className="flex flex-col items-center p-2 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    {city.cityImage ? (
                      <img src={city.cityImage} alt={city.cityName} className="w-10 h-10 object-cover rounded-full mb-2 border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-700">{city.cityName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
