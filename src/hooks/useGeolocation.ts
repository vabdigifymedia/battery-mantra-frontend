import { useState } from "react";
import { geocodingService } from "@/services/geocoding.service";
import { useLocationStore } from "@/store/useLocationStore";
import { locationService } from "@/services/location.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const { setLocation, setPermission } = useLocationStore();
  const qc = useQueryClient();

  const detectLocation = async () => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    const fetchPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    try {
      // First try with high accuracy (GPS)
      let position: GeolocationPosition;
      try {
        position = await fetchPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      } catch (err: any) {
        // If high accuracy times out or fails, fallback to low accuracy (Wi-Fi/Cell)
        console.warn("High accuracy location failed, falling back to low accuracy...", err);
        position = await fetchPosition({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes cached allowed
        });
      }

      setPermission(true);
      const { latitude, longitude } = position.coords;
      
      const postcode = await geocodingService.reverseGeocode(latitude, longitude);
      
      if (!postcode) {
        toast.error("Could not determine pincode from your location.");
        setIsLocating(false);
        return;
      }

      // Check if pincode is serviceable
      const result = await locationService.checkPincode(postcode);
      
      setLocation(postcode, result.serviceable, result.city);
      qc.invalidateQueries({ queryKey: ["products"] });
      
      if (result.serviceable) {
        toast.success(`Location set to ${result.city?.cityName}, ${postcode}`);
      } else {
        toast.error(`Sorry, we do not deliver to ${postcode} yet.`);
      }
    } catch (error: any) {
      setPermission(false);
      console.error(error);
      if (error.code === 1) { // PERMISSION_DENIED
        toast.error("Location permission denied. Please enter manually.");
      } else {
        toast.error("Unable to retrieve your location.");
      }
    } finally {
      setIsLocating(false);
    }
  };

  return { detectLocation, isLocating };
};
