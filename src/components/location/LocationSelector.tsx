import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";
import { LocationModal } from "./LocationModal";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocation, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { locationService } from "@/services/location.service";
import { isRouteCityScoped, getMatchedCityFromUrl } from "@/hooks/useLocationNavigation";

export const LocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pincode, city, locationPermissionGranted, hasHydrated, setLocation } = useLocationStore();
  const { detectLocation, isLocating } = useGeolocation();
  const router = useRouter();
  const { pathname } = useLocation();

  const { data: cities } = useQuery({
    queryKey: ["locations", "public-cities"],
    queryFn: () => locationService.getPublicCities(),
    staleTime: 1000 * 60 * 60,
  });

  const matches = router.state.matches;
  const leafMatch = matches[matches.length - 1];
  const routeId = leafMatch?.routeId as string;
  const params = (leafMatch?.params || {}) as Record<string, string>;

  // Check if current route is city-scoped
  const isCityScoped = isRouteCityScoped(routeId, params, pathname, cities);

  // Sync city from URL to store if the route/URL specifies a city
  useEffect(() => {
    if (isCityScoped && cities && cities.length > 0) {
      const matchedCity = getMatchedCityFromUrl(pathname, params, cities);
      if (matchedCity) {
        const currentCitySlug = city?.cityName?.toLowerCase().replace(/\s+/g, '-');
        const matchedCitySlug = matchedCity.cityName?.toLowerCase().replace(/\s+/g, '-');
        if (currentCitySlug !== matchedCitySlug) {
          setLocation(pincode || "", true, matchedCity);
        }
      }
    }
  }, [isCityScoped, cities, pathname, params, city?.cityName, pincode, setLocation]);

  // Auto-detect location ONLY IF:
  // 1. Store has completed rehydration from cookie
  // 2. The current route is NOT city-scoped
  // 3. No city is set in store
  // 4. No pincode is set
  // 5. User hasn't explicitly denied permission
  useEffect(() => {
    if (!hasHydrated) return;
    if (isCityScoped) return;
    if (!city && !pincode && locationPermissionGranted !== false) {
      detectLocation(false);
    }
  }, [hasHydrated, isCityScoped, city, pincode, locationPermissionGranted, detectLocation]);

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 sm:gap-2 hover:bg-primary/10 hover:text-primary transition-colors px-1 sm:px-3"
        disabled={isLocating}
      >
        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4 shrink-0 text-primary" />}
        <div className="flex flex-col items-start leading-none text-left">
          <span className="text-[8px] sm:text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            {isLocating ? "Detecting..." : (pincode ? "Delivering to" : "Select Location")}
          </span>
          <span className="text-xs sm:text-sm font-semibold truncate max-w-[80px] sm:max-w-[150px]">
            {isLocating ? "Please wait" : (city?.cityName ? (pincode ? `${city.cityName}, ${pincode}` : city.cityName) : pincode || "Enter Pincode")}
          </span>
        </div>
      </Button>

      <LocationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
