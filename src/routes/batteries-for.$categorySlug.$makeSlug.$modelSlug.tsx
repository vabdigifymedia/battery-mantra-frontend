import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

export const Route = createFileRoute("/batteries-for/$categorySlug/$makeSlug/$modelSlug")({
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
  const { makeSlug, modelSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });

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
      vehicleIdOverride={vehicleIdOverride}
    />
  );
}
