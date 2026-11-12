import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import { locationService } from "@/services/location.service";
import { useLocationStore } from "@/store/useLocationStore";
import {
  rootCategoriesQuery,
  brandsQuery,
  categoriesQuery,
} from "@/queries";
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

export const Route = createFileRoute("/shop/c/$categorySlug/$citySlug")({
  loader: async ({ context, params }) => {
    assertValidRouteSlugs(params.categorySlug, params.citySlug);

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
    if (hasAnyInvalidRouteSlug(params.categorySlug, params.citySlug) || !loaderData) {
      return notFoundHead();
    }

    const rawCategoryName = params.categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const cityName = params.citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const category = findCategoryBySlug(
      [...(loaderData?.categories || []), ...(loaderData?.rootCategories || [])],
      params.categorySlug
    );
    const categoryName = toSingularCategory(category?.categoryName || rawCategoryName) || "Battery";

    const seo = resolveTemplateSeo(
      "CATEGORY",
      loaderData?.templates,
      {
        category_name: categoryName,
        category: categoryName,
        city_name: cityName,
        city: cityName,
        delivery_time: "2-4 Hours",
      },
      (category as any)?.seo,
      {
        title: `${categoryName} in ${cityName} Online | Buy 100% Genuine Battery`,
        description: `Buy 100% Genuine ${categoryName} in ${cityName} Online at Best Price. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    return buildPageHead(seo, { path: `/shop/c/${params.categorySlug}/${params.citySlug}` });
  },
  validateSearch: productSearchSchema,
  component: CategoryProductsPage,
});

function CategoryProductsPage() {
  const { categorySlug, citySlug } = Route.useParams();
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

  const { data: categories, isLoading } = useQuery(categoriesQuery());

  if (isLoading) {
    return <FullPageLoader />;
  }

  const matchingCategory = categories?.find(c => toSlug(c.categoryName) === categorySlug);
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
      baseUrl={`/shop/c/${categorySlug}`}
    />
  );
}
