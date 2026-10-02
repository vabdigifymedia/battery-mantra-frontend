import { useState } from "react";
import { geocodingService } from "@/services/geocoding.service";
import { useLocationStore } from "@/store/useLocationStore";
import { useLocationNavigation, isRouteCityScoped } from "@/hooks/useLocationNavigation";
import { locationService } from "@/services/location.service";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

export const useGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const { setPermission } = useLocationStore();
  const { changeLocation } = useLocationNavigation();
  const router = useRouter();

  const detectLocation = async (isManual: boolean = false) => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      if (isManual) {
        toast.error("Geolocation is not supported by your browser");
      }
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
      
      const cityName = await geocodingService.reverseGeocodeCity(latitude, longitude);
      
      if (!cityName) {
        if (isManual) {
          toast.error("Could not determine your city from your location.");
        }
        setIsLocating(false);
        return;
      }

      // Check if city is serviceable by finding it in public cities list
      const publicCities = await locationService.getPublicCities();
      console.log("[Geolocation] Detected city from GPS:", cityName, "| Available cities:", publicCities.map(c => c.cityName));
      
      const normalizedDetected = cityName.toLowerCase().trim();
      const matchedCity = publicCities.find(c => {
        const normalizedCity = c.cityName.toLowerCase().trim();
        return (
          normalizedCity === normalizedDetected ||
          normalizedDetected.includes(normalizedCity) ||
          normalizedCity.includes(normalizedDetected)
        );
      });
      
      if (matchedCity) {
        if (isManual) {
          // Explicit manual action by user
          changeLocation(matchedCity, "", true);
          toast.success(`Location set to ${matchedCity.cityName}`);
        } else {
          // Automatic detection on page load:
          // NEVER redirect or overwrite if current page/route is already city-scoped!
          const matches = router.state.matches;
          const leafMatch = matches[matches.length - 1];
          const routeId = leafMatch?.routeId as string;
          const params = (leafMatch?.params || {}) as Record<string, string>;
          const pathname = router.state.location.pathname;

          if (isRouteCityScoped(routeId, params, pathname, publicCities)) {
            console.log("[Geolocation] Auto-detect skipped redirect because current page is city-scoped:", pathname);
          } else {
            changeLocation(matchedCity, "", true);
            toast.success(`Location set to ${matchedCity.cityName}`);
          }
        }
      } else {
        if (isManual) {
          toast.error(`Sorry, we do not deliver to ${cityName} yet.`);
        }
      }
    } catch (error: any) {
      setPermission(false);
      console.error(error);
      if (isManual) {
        if (error.code === 1) { // PERMISSION_DENIED
          toast.error("Location permission denied. Please enter manually.");
        } else {
          toast.error("Unable to retrieve your location.");
        }
      }
    } finally {
      setIsLocating(false);
    }
  };

  return { detectLocation, isLocating };
};
