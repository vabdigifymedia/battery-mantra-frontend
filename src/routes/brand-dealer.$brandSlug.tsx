import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  categoriesQuery,
  productFilterQuery,
} from "@/queries";
import {
  assertValidRouteSlugs,
  buildPageHead,
  findBrandBySlug,
  hasAnyInvalidRouteSlug,
  notFoundHead,
} from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo, extractProductPriceStats } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/brand-dealer/$brandSlug")({
  loader: async ({ context, params }) => {
    assertValidRouteSlugs(params.brandSlug);

    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(categoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());
    
    const [brands, templates] = await Promise.all([
      context.queryClient.ensureQueryData(brandsQuery()).catch(() => []),
      context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => undefined),
    ]);

    const brand = findBrandBySlug(brands, params.brandSlug);
    if (brands.length > 0 && !brand) {
      throw notFound();
    }

    let initialProducts: any[] = [];
    if (brand?.brandId) {
      try {
        const prodData = await context.queryClient.ensureQueryData(
          productFilterQuery({ brandId: [brand.brandId], size: 24 })
        );
        initialProducts = prodData?.content || [];
      } catch {
        initialProducts = [];
      }
    }

    return { brands, templates, initialProducts, brand };
  },
  head: ({ loaderData, params }) => {
    if (hasAnyInvalidRouteSlug(params.brandSlug) || !loaderData) {
      return notFoundHead();
    }

    const brandName = params.brandSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const brand = loaderData?.brand || findBrandBySlug(loaderData?.brands, params.brandSlug);
    const priceStats = extractProductPriceStats(loaderData?.initialProducts);
    const displayBrandName = brand?.brandName || brandName;
    
    const seo = resolveTemplateSeo(
      "DEALER",
      loaderData?.templates,
      { 
        brand_name: displayBrandName,
        brand: displayBrandName,
        category_name: "Battery",
        category: "Battery",
        delivery_time: "2-4 Hours",
        price: priceStats.priceFormatted,
        price_low: priceStats.priceLowestFormatted,
        price_lowest: priceStats.priceLowestFormatted,
        price_high: priceStats.priceHighestFormatted,
        price_highest: priceStats.priceHighestFormatted,
        price_range: priceStats.priceRangeFormatted,
        warranty_range: priceStats.warrantyRangeFormatted,
      },
      (brand as any)?.seo,
      {
        title: `${displayBrandName} Authorized Dealer Online`,
        description: `Buy 100% Genuine ${displayBrandName} Batteries from Authorized Dealer Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );
    
    return buildPageHead(seo, { path: `/brand-dealer/${params.brandSlug}` });
  },
  validateSearch: productSearchSchema,
  component: DealerBrandProductsPage,
});

function DealerBrandProductsPage() {
  const { brandSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });

  const { data: brands, isLoading } = useQuery(brandsQuery());

  if (isLoading) {
    return <FullPageLoader />;
  }

  // We inject the brand slug into the search context
  const activeSearch = {
    ...search,
    brand: brandSlug,
  };

  return (
    <ProductsPageLayout 
      search={activeSearch}
      isDealerPage={true}
      baseUrl={`/brand-dealer/${brandSlug}`}
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
