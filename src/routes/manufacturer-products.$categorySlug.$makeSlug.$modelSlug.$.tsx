import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { locationService } from "@/services/location.service";
import { useLocationStore } from "@/store/useLocationStore";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  vehiclesListQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/manufacturer-products/$categorySlug/$makeSlug/$modelSlug/$")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(vehiclesListQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());
    const templates = await context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => []);
    return { templates };
  },
  head: ({ params, loaderData }) => {
    const { templates } = (loaderData as any) || {};
    const { categorySlug, makeSlug, modelSlug, _splat } = params as any;
    const make = makeSlug ? makeSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "";
    
    // Extract the raw model by removing the makeSlug prefix if it exists
    const rawModel = modelSlug && modelSlug.startsWith(makeSlug + '-') 
      ? modelSlug.slice(makeSlug.length + 1)
      : (modelSlug || "");
      
    const model = rawModel ? rawModel.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "";
    const categoryName = categorySlug ? categorySlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Car Batteries";

    // City from splat (e.g. /manufacturer-products/.../noida) or undefined
    const citySlug = _splat || undefined;
    const cityNameStr = citySlug ? citySlug.charAt(0).toUpperCase() + citySlug.slice(1) : undefined;

    const seo = resolveTemplateSeo(
      "SUB_MANUFACTURER",
      templates,
      {
        manufacturer_name: make,
        model_name: model,
        category_name: categoryName,
        delivery_time: "1-2 Hours",
        ...(cityNameStr && { city_name: cityNameStr }),
      },
      null,
      {
        title: `${make} ${model} Battery Online | Buy 100% Genuine Car Battery`,
        description: `Buy 100% Genuine ${make} ${model} Battery Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    return buildPageHead(seo, {
      title: `${make} ${model} Battery Online | Buy 100% Genuine Car Battery`,
      description: `Buy 100% Genuine ${make} ${model} Battery Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
    });
  },
  validateSearch: productSearchSchema,
  component: VehicleProductsPage,
});

function VehicleProductsPage() {
  const { categorySlug, makeSlug, modelSlug, _splat } = Route.useParams() as any;
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/manufacturer-products/$categorySlug/$makeSlug/$modelSlug/$" });
  const { city, pincode, setLocation } = useLocationStore();

  useEffect(() => {
    const citySlug = _splat;
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
  }, [_splat, city?.cityName, pincode, setLocation]);

  // Load all vehicles to find the matching one
  const { data: vehicles, isLoading } = useQuery(vehiclesListQuery());

  if (isLoading) {
    return <FullPageLoader />;
  }

  // Find the exact vehicle matching the slugs
  // We match by slugifying the backend make and model
  const matchingVehicle = vehicles?.find(v => {
    const vMakeSlug = toSlug(v.make);
    const vModelSlug = toSlug(`${v.make}-${v.model}`);
    return vMakeSlug === makeSlug && vModelSlug === modelSlug;
  });

  const vehicleIdOverride = matchingVehicle?.vehicleId;

  return (
    <ProductsPageLayout 
      search={search}
      onSearchChange={(newSearch) => navigate({ search: { ...search, ...newSearch, page: newSearch.page ?? search.page } })}
      hideCategoryFilter={true}
      vehicleIdOverride={vehicleIdOverride}
      baseUrl={`/manufacturer-products/${makeSlug ? categorySlug : ""}/${makeSlug}/${modelSlug}`}
    />
  );
}
