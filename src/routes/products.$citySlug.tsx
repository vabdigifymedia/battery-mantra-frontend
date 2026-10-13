import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import { locationService } from "@/services/location.service";
import { useLocationStore } from "@/store/useLocationStore";
import {
  rootCategoriesQuery,
  brandsQuery,
  pageSeoQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";

export const Route = createFileRoute("/products/$citySlug")({
  beforeLoad: ({ params, search }) => {
    if (
      search?.category &&
      typeof search.category === "string" &&
      !search.category.includes(",") &&
      search?.brand &&
      typeof search.brand === "string" &&
      !search.brand.includes(",")
    ) {
      const { category, brand, ...restSearch } = search;
      throw redirect({
        to: "/brand-products/$categorySlug/$brandSlug/$citySlug",
        params: {
          categorySlug: category.trim(),
          brandSlug: brand.trim(),
          citySlug: params.citySlug,
        },
        search: Object.keys(restSearch).length > 0 ? restSearch : undefined,
        statusCode: 301,
      });
    }
  },
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());

    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/products"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: "Shop batteries — BatteryMantra",
      description: "Browse premium automotive, inverter and industrial batteries from trusted brands.",
    }),
  validateSearch: productSearchSchema,
  component: ProductsPage,
});

function ProductsPage() {
  const { citySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });
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

  return (
    <ProductsPageLayout 
      search={search}
      onSearchChange={(newSearch) => navigate({ search: { ...search, ...newSearch, page: newSearch.page ?? search.page } })}
      baseUrl="/products"
    />
  );
}
