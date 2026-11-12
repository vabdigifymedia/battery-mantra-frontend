import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  categoriesQuery,
} from "@/queries";
import { useMemo } from "react";
import {
  assertValidRouteSlugs,
  buildPageHead,
  findCategoryBySlug,
  hasAnyInvalidRouteSlug,
  notFoundHead,
} from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug, toSingularCategory } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/shop/c/$categorySlug/")({
  loader: async ({ context, params }) => {
    assertValidRouteSlugs(params.categorySlug);

    void context.queryClient.prefetchQuery(brandsQuery());

    const [categories, rootCategories, templates] = await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(rootCategoriesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => undefined),
    ]);

    const allCategories = [...(categories || []), ...(rootCategories || [])];
    const category = findCategoryBySlug(allCategories, params.categorySlug);
    if (allCategories.length > 0 && !category) {
      throw notFound();
    }

    return { categories, rootCategories, templates };
  },
  head: ({ loaderData, params }) => {
    if (hasAnyInvalidRouteSlug(params.categorySlug) || !loaderData) {
      return notFoundHead();
    }

    const rawCategoryName = params.categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const category = findCategoryBySlug(
      [...(loaderData?.categories || []), ...(loaderData?.rootCategories || [])],
      params.categorySlug
    );
    const categoryName = toSingularCategory(category?.categoryName || rawCategoryName);

    const seo = resolveTemplateSeo(
      "CATEGORY",
      loaderData?.templates,
      { category_name: categoryName, delivery_time: "2-4 Hours" },
      (category as any)?.seo,
      {
        title: `${categoryName} Online | Buy 100% Genuine Battery`,
        description: `Buy 100% Genuine ${categoryName} Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    return buildPageHead(seo);
  },
  validateSearch: productSearchSchema,
  component: CategoryProductsPage,
});

function CategoryProductsPage() {
  const { categorySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });

  const { data: categories, isLoading: isLoadingFlat } = useQuery(categoriesQuery());
  const { data: rootCategories, isLoading: isLoadingRoot } = useQuery(rootCategoriesQuery());

  const isLoading = isLoadingFlat || isLoadingRoot;

  // Find category match from flat list first, then search tree recursively
  const matchingCategory = useMemo(() => {
    if (!categories && !rootCategories) return undefined;

    // 1. Try flat list match by categorySlug property or name-derived slug
    const flatMatch = categories?.find(c => {
      const cSlug = c.categorySlug || toSlug(c.categoryName);
      const cNameSlug = toSlug(c.categoryName);
      return cSlug === categorySlug || cNameSlug === categorySlug;
    });
    if (flatMatch) return flatMatch;

    // 2. Search recursively in root categories tree (for subcategories)
    const normalizeSlug = (s: string) => s.toLowerCase().trim().replace(/-batteries$/, '-battery').replace(/\s+/g, '-');
    const findInTree = (cats: any[]): any | undefined => {
      for (const c of cats) {
        const cSlug = c.categorySlug || toSlug(c.categoryName);
        const cNameSlug = toSlug(c.categoryName);
        if (
          cSlug === categorySlug ||
          cNameSlug === categorySlug ||
          normalizeSlug(cSlug) === normalizeSlug(categorySlug) ||
          normalizeSlug(cNameSlug) === normalizeSlug(categorySlug)
        ) {
          return c;
        }
        if (c.subCategories?.length) {
          const found = findInTree(c.subCategories);
          if (found) return found;
        }
      }
      return undefined;
    };
    return rootCategories ? findInTree(rootCategories) : undefined;
  }, [categories, rootCategories, categorySlug]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  const activeCategoryId = matchingCategory?.categoryId;

  // We inject the category into the search context
  const activeSearch = {
    ...search,
    category: categorySlug,
  };

  return (
    <ProductsPageLayout 
      search={activeSearch}
      onSearchChange={(newSearch) => {
        // If the user selects a DIFFERENT category in the sidebar, or adds a brand, 
        // we navigate to the generic /products route to handle complex filters seamlessly
        if (
          (newSearch.category && newSearch.category.split(',').length > 0 && !newSearch.category.split(',').includes(categorySlug)) ||
          (newSearch.brand && newSearch.brand.length > 0)
        ) {
          navigate({ 
            to: "/products", 
            search: { ...activeSearch, ...newSearch, page: newSearch.page ?? activeSearch.page } 
          });
        } else {
          const { category, ...cleanSearch } = newSearch;
          navigate({ search: { ...search, ...cleanSearch, page: newSearch.page ?? search.page } });
        }
      }}
      hideCategoryFilter={true}
    />
  );
}
