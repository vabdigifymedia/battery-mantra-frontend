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

export const Route = createFileRoute("/shop/c/$categorySlug")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(categoriesQuery());
    return {};
  },
  head: ({ params }) => {
    const categoryName = params.categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    return buildPageHead(undefined, {
      title: `${categoryName} Online | Buy 100% Genuine Battery`,
      description: `Buy 100% Genuine ${categoryName} Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
    });
  },
  validateSearch: productSearchSchema,
  component: CategoryProductsPage,
});

function CategoryProductsPage() {
  const { categorySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });

  const { data: categories, isLoading } = useQuery(categoriesQuery());

  if (isLoading) {
    return <FullPageLoader />;
  }

  const matchingCategory = categories?.find(c => toSlug(c.categoryName) === categorySlug);
  const activeCategoryId = matchingCategory?.categoryId;

  // We inject the categoryId into the search context
  const activeSearch = {
    ...search,
    categoryId: activeCategoryId ? [activeCategoryId] : undefined,
  };

  return (
    <ProductsPageLayout 
      search={activeSearch}
      onSearchChange={(newSearch) => {
        // If the user selects a DIFFERENT category in the sidebar, or adds a brand, 
        // we navigate to the generic /products route to handle complex filters seamlessly
        if (
          (newSearch.categoryId && newSearch.categoryId.length > 0 && newSearch.categoryId[0] !== activeCategoryId) ||
          (newSearch.brandId && newSearch.brandId.length > 0)
        ) {
          navigate({ 
            to: "/products", 
            search: { ...activeSearch, ...newSearch, page: newSearch.page ?? activeSearch.page } 
          });
        } else {
          navigate({ search: { ...search, ...newSearch, page: newSearch.page ?? search.page } });
        }
      }}
      hideCategoryFilter={true}
    />
  );
}
