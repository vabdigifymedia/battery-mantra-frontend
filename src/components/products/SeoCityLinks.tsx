import { useQuery, useQueryClient } from "@tanstack/react-query";
import { locationService } from "@/services/location.service";
import { MapPin } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocationStore } from "@/store/useLocationStore";
import { Link } from "@tanstack/react-router";
import { toSlug } from "@/lib/utils";

interface SeoCityLinksProps {
  productName: string;
  productSlug: string;
}

export function SeoCityLinks({ productName, productSlug }: SeoCityLinksProps) {
  const qc = useQueryClient();
  const { setLocation } = useLocationStore();
  
  const { data: cities } = useQuery({
    queryKey: ["locations", "public-cities"],
    queryFn: () => locationService.getPublicCities(),
  });

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
              {cities.map((city) => (
                <Link
                  key={city.cityId}
                  to="/product/$"
                  params={{ _splat: `${productSlug}/${toSlug(city.cityName)}` }}
                  onClick={(e) => {
                    // Update the global store so the UI updates instantly
                    setLocation("", true, city);
                    qc.invalidateQueries({ queryKey: ["products"] });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-sm text-muted-foreground hover:text-brand transition-colors truncate flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <MapPin className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="truncate">
                    {productName} in {city.cityName}
                  </span>
                </Link>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
