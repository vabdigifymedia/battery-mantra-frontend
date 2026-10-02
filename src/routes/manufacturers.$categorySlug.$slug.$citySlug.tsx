import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { locationService } from "@/services/location.service";
import { useLocationStore } from "@/store/useLocationStore";
import { manufacturersListQuery, rootCategoriesQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";
import { ManufacturerPage } from "@/components/manufacturers/ManufacturerPage";

const toSlug = (text?: string) => text ? text.toLowerCase().replace(/\s+/g, '-') : '';

export const Route = createFileRoute("/manufacturers/$categorySlug/$slug/$citySlug")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(manufacturersListQuery());
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());

    const [manufacturers, categories, templates] = await Promise.all([
      context.queryClient.ensureQueryData(manufacturersListQuery()),
      context.queryClient.ensureQueryData(rootCategoriesQuery()),
      context.queryClient.ensureQueryData(seoTemplatesQuery()),
    ]);
    return { manufacturers, categories, templates };
  },
  head: ({ loaderData, params }) => {
    const makeName = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const categoryName = params.categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    const manufacturer = loaderData?.manufacturers?.find((m: any) => toSlug(m.name) === params.slug);
    const category = loaderData?.categories?.find((c: any) => toSlug(c.categoryName) === params.categorySlug);

    const seo = resolveTemplateSeo(
      "MANUFACTURER",
      loaderData?.templates,
      { 
        manufacturer_name: manufacturer?.name || makeName, 
        category_name: category?.categoryName || categoryName,
        delivery_time: "2-4 Hours",
      },
      (manufacturer as any)?.seo,
      {
        title: `Buy ${makeName} ${categoryName} Online at Best Price | Battery Mantra`,
        description: `Find 100% compatible batteries for all ${makeName} vehicle models at guaranteed lowest prices. Free doorstep installation & 24/7 service on Battery Mantra.`,
      }
    );

    return buildPageHead(seo);
  },
  component: ManufacturerCityPage,
});

function ManufacturerCityPage() {
  const { categorySlug, slug, citySlug } = Route.useParams();
  const { city, pincode, setLocation } = useLocationStore();

  useEffect(() => {
    if (citySlug) {
      const currentCitySlug = city?.cityName?.toLowerCase().replace(/\s+/g, '-');
      if (currentCitySlug !== citySlug.toLowerCase()) {
        locationService.getPublicCities().then(cities => {
          const matchedCity = cities.find(c => c.cityName?.toLowerCase().replace(/\s+/g, '-') === citySlug.toLowerCase());
          if (matchedCity) {
            setLocation(pincode || "", true, matchedCity);
          }
        }).catch(console.error);
      }
    }
  }, [citySlug, city?.cityName, pincode, setLocation]);

  return <ManufacturerPage categorySlug={categorySlug} makeSlug={slug} />;
}
