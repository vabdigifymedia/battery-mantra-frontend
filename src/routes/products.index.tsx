import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  pageSeoQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";

export const Route = createFileRoute("/products/")({
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
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });

  return (
    <ProductsPageLayout 
      search={search}
      onSearchChange={(newSearch) => navigate({ search: { ...search, ...newSearch, page: newSearch.page ?? search.page } })}
    />
  );
}
