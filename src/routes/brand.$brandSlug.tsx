import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  categoriesQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/brand/$brandSlug")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(categoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());
    
    const [brands, templates] = await Promise.all([
      context.queryClient.ensureQueryData(brandsQuery()),
      context.queryClient.ensureQueryData(seoTemplatesQuery()),
    ]);
    return { brands, templates };
  },
  head: ({ loaderData, params }) => {
    const brandName = params.brandSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const brand = loaderData?.brands?.find((b: any) => toSlug(b.brandName) === params.brandSlug);
    
    const seo = resolveTemplateSeo(
      "BRAND",
      loaderData?.templates,
      { brand_name: brand?.brandName || brandName },
      (brand as any)?.seo,
      {
        title: `${brandName} Batteries Online | Buy 100% Genuine Battery`,
        description: `Buy 100% Genuine ${brandName} Batteries Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );
    
    return buildPageHead(seo);
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

  // We inject the brand slug into the search context
  const activeSearch = {
    ...search,
    brand: brandSlug,
  };

  return (
    <ProductsPageLayout 
      search={activeSearch}
      onSearchChange={(newSearch) => {
        // If the user selects a DIFFERENT brand in the sidebar, we navigate to the generic /products route
        if (
          (newSearch.brand && newSearch.brand.split(',').length > 0 && !newSearch.brand.split(',').includes(brandSlug)) ||
          (newSearch.category && newSearch.category.length > 0)
        ) {
          navigate({ 
            to: "/products", 
            search: { ...activeSearch, ...newSearch, page: newSearch.page ?? activeSearch.page } 
          });
        } else {
          // Remove brand from newSearch if it's the same, so it doesn't pollute the URL
          const { brand, ...cleanSearch } = newSearch;
          navigate({ search: { ...search, ...cleanSearch, page: newSearch.page ?? search.page } });
        }
      }}
    />
  );
}
