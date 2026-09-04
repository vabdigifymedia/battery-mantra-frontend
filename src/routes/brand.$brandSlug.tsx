import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  categoriesQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/brand/$brandSlug")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(categoriesQuery());
    return {};
  },
  head: ({ params }) => {
    const brandName = params.brandSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    return buildPageHead(undefined, {
      title: `${brandName} Batteries Online | Buy 100% Genuine Battery`,
      description: `Buy 100% Genuine ${brandName} Batteries Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
    });
  },
  validateSearch: productSearchSchema,
  component: BrandProductsPage,
});

function BrandProductsPage() {
  const { brandSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });

  const { data: brands, isLoading } = useQuery(brandsQuery());

  if (isLoading) {
    return <FullPageLoader />;
  }

  const matchingBrand = brands?.find(b => toSlug(b.brandName) === brandSlug);
  const activeBrandId = matchingBrand?.brandId;

  // We inject the brandId into the search context
  const activeSearch = {
    ...search,
    brandId: activeBrandId ? [activeBrandId] : undefined,
  };

  return (
    <ProductsPageLayout 
      search={activeSearch}
      onSearchChange={(newSearch) => {
        // If the user selects a DIFFERENT brand in the sidebar, we navigate to the generic /products route
        if (newSearch.brandId && newSearch.brandId.length > 0 && newSearch.brandId[0] !== activeBrandId) {
          navigate({ 
            to: "/products", 
            search: { ...activeSearch, ...newSearch, page: newSearch.page ?? activeSearch.page } 
          });
        } else {
          navigate({ search: { ...search, ...newSearch, page: newSearch.page ?? search.page } });
        }
      }}
    />
  );
}
