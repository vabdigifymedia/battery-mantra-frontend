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
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/manufacturer-products/$categorySlug/$makeSlug/$modelSlug/$")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(vehiclesListQuery());
    return {};
  },
  head: ({ params }) => {
    const make = params.makeSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const model = params.modelSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    return buildPageHead(undefined, {
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
    const vModelSlug = toSlug(v.model);
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
