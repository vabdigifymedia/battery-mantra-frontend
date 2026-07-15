import { useState } from "react";
import { geocodingService } from "@/services/geocoding.service";
import { useLocationStore } from "@/store/useLocationStore";
import { locationService } from "@/services/location.service";
import { toast } from "sonner";

export const useGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const { setLocation, setPermission } = useLocationStore();

  const detectLocation = async () => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setPermission(true);
        const { latitude, longitude } = position.coords;
        
        try {
          const postcode = await geocodingService.reverseGeocode(latitude, longitude);
          
          if (!postcode) {
            toast.error("Could not determine pincode from your location.");
            return;
          }

          // Check if pincode is serviceable
          const result = await locationService.checkPincode(postcode);
          
          setLocation(postcode, result.isServiceable, result.city);
          
          if (result.isServiceable) {
            toast.success(`Location set to ${result.city?.cityName}, ${postcode}`);
          } else {
            toast.error(`Sorry, we do not deliver to ${postcode} yet.`);
          }
          
        } catch (error) {
          console.error(error);
          toast.error("Failed to detect location details.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setPermission(false);
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enter manually.");
        } else {
          toast.error("Unable to retrieve your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return { detectLocation, isLocating };
};
