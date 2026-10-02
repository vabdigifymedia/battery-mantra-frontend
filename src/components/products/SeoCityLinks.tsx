import { useQuery } from "@tanstack/react-query";
import { locationService } from "@/services/location.service";
import { MapPin } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocationNavigation } from "@/hooks/useLocationNavigation";
import { toSlug } from "@/lib/utils";
import { toast } from "sonner";
import { Link, useRouter } from "@tanstack/react-router";

interface SeoCityLinksProps {
  productName: string;
  baseUrl?: string;
}

/**
 * Derives a baseUrl from the current route path by stripping any trailing city slug.
 * E.g. /shop/inverter-battery/exide/faridabad → /shop/inverter-battery/exide
 *      /shop/inverter-battery/exide → /shop/inverter-battery/exide (no change)
 *      /manufacturers/car-battery → /manufacturers/car-battery (no change)
 */
function useAutoBaseUrl(cities: any[] | undefined): string {
  const router = useRouter();
  const pathname = router.state.location.pathname.replace(/\/+$/, ""); // strip trailing slash

  if (!cities || cities.length === 0) return pathname;

  const segments = pathname.split("/");
  const lastSegment = segments[segments.length - 1];

  // If the last segment is a known city slug, strip it to get the base
  const isCity = cities.some(c => toSlug(c.cityName) === lastSegment);
  if (isCity) {
    return segments.slice(0, -1).join("/");
  }

  return pathname;
}

export function SeoCityLinks({ productName, baseUrl }: SeoCityLinksProps) {
  const { changeLocation } = useLocationNavigation();
  
  const { data: cities } = useQuery({
    queryKey: ["locations", "public-cities"],
    queryFn: () => locationService.getPublicCities(),
  });

  // Auto-detect baseUrl from current route if not explicitly provided
  const autoBaseUrl = useAutoBaseUrl(cities);
  const effectiveBaseUrl = baseUrl || autoBaseUrl;

  if (!cities || cities.length === 0) return null;

  return (
    <div className="mt-12 bg-white rounded-xl border p-4 shadow-sm">
      <Accordion type="single" collapsible defaultValue="seo-links">
        <AccordionItem value="seo-links" className="border-none">
          <AccordionTrigger className="hover:no-underline py-2">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand" />
              Available in Top Cities
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
              {cities.map((city) => {
                const targetUrl = `${effectiveBaseUrl}/${toSlug(city.cityName)}`;
                return (
                  <Link
                    key={city.cityId}
                    to={targetUrl as any}
                    onClick={() => {
                      changeLocation(city, "", true);
                      toast.success(`Location changed to ${city.cityName}`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-sm text-muted-foreground hover:text-brand transition-colors truncate flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <MapPin className="h-3 w-3 shrink-0 opacity-50" />
                    <span className="truncate">
                      {productName} in {city.cityName}
                    </span>
                  </Link>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
