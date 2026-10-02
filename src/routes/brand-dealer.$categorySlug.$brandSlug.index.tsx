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

export const Route = createFileRoute("/brand-dealer/$categorySlug/$brandSlug/")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(categoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());

    const [brands, categories, templates] = await Promise.all([
      context.queryClient.ensureQueryData(brandsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(seoTemplatesQuery()),
    ]);
    return { brands, categories, templates };
  },
  head: ({ loaderData, params }) => {
    const categoryName = params.categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const brandName = params.brandSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const brand = loaderData?.brands?.find((b: any) => toSlug(b.brandName) === params.brandSlug);
    const category = loaderData?.categories?.find((c: any) => toSlug(c.categoryName) === params.categorySlug);

    // Provide dealer specific SEO
    const seo = resolveTemplateSeo(
      "BRAND",
      loaderData?.templates,
      { brand_name: brand?.brandName || brandName, category_name: category?.categoryName || categoryName, delivery_time: "2-4 Hours" },
      (brand as any)?.seo,
      {
        title: `${brandName} ${categoryName} Authorized Dealer Online`,
        description: `Buy 100% Genuine ${brandName} ${categoryName} from Authorized Dealer Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    return buildPageHead(seo);
  },
  validateSearch: productSearchSchema,
  component: DealerBrandProductsPage,
});

function DealerBrandProductsPage() {
  const { categorySlug, brandSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });

  const { data: categories, isLoading: isCatLoading } = useQuery(categoriesQuery());
  const { data: brands, isLoading: isBrandLoading } = useQuery(brandsQuery());

  if (isCatLoading || isBrandLoading) {
    return <FullPageLoader />;
  }

  // We inject both into the search context
  const activeSearch = {
    ...search,
    category: categorySlug,
    brand: brandSlug,
  };

  return (
    <ProductsPageLayout 
      search={activeSearch}
      isDealerPage={true}
      onSearchChange={(newSearch) => {
        // If the user selects DIFFERENT categories or brands, navigate to generic route
        if (
          (newSearch.category && newSearch.category.split(',').length > 0 && !newSearch.category.split(',').includes(categorySlug)) ||
          (newSearch.brand && newSearch.brand.split(',').length > 0 && !newSearch.brand.split(',').includes(brandSlug))
        ) {
          navigate({ 
            to: "/products", 
            search: { ...activeSearch, ...newSearch, page: newSearch.page ?? activeSearch.page } 
          });
        } else {
          const { category, brand, ...cleanSearch } = newSearch;
          navigate({ search: { ...search, ...cleanSearch, page: newSearch.page ?? search.page } });
        }
      }}
      hideCategoryFilter={true}
    />
  );
}
