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
  productFilterQuery,
} from "@/queries";
import {
  assertValidRouteSlugs,
  buildPageHead,
  findBrandBySlug,
  findCategoryBySlug,
  hasAnyInvalidRouteSlug,
  notFoundHead,
} from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo, extractProductPriceStats } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug, toSingularCategory, getBrandSlug } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/brand-dealer/$categorySlug/$brandSlug/$citySlug")({
  loader: async ({ context, params }) => {
    assertValidRouteSlugs(params.categorySlug, params.brandSlug, params.citySlug);

    void context.queryClient.prefetchQuery(seoTemplatesQuery());

    const [brands, categories, rootCategories, templates] = await Promise.all([
      context.queryClient.ensureQueryData(brandsQuery()).catch(() => []),
      context.queryClient.ensureQueryData(categoriesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(rootCategoriesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => undefined),
    ]);

    const brand = findBrandBySlug(brands, params.brandSlug);
    const allCategories = [...(categories || []), ...(rootCategories || [])];
    const category = findCategoryBySlug(allCategories, params.categorySlug);

    if ((brands.length > 0 && !brand) || (allCategories.length > 0 && !category)) {
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

    return { brands, categories, rootCategories, templates, initialProducts };
  },
  head: ({ loaderData, params }) => {
    if (hasAnyInvalidRouteSlug(params.categorySlug, params.brandSlug, params.citySlug) || !loaderData) {
      return notFoundHead();
    }

    const rawCategoryName = params.categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const brandName = params.brandSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const cityName = params.citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const brand = findBrandBySlug(loaderData?.brands, params.brandSlug);
    const category = findCategoryBySlug(
      [...(loaderData?.categories || []), ...(loaderData?.rootCategories || [])],
      params.categorySlug
    );
    const categoryName = toSingularCategory(category?.categoryName || rawCategoryName) || "Battery";
    const displayBrandName = brand?.brandName || brandName;
    const priceStats = extractProductPriceStats(loaderData?.initialProducts);

    // Provide dealer specific SEO
    const seo = resolveTemplateSeo(
      "DEALER",
      loaderData?.templates,
      {
        brand_name: displayBrandName,
        brand: displayBrandName,
        category_name: categoryName,
        category: categoryName,
        city_name: cityName,
        city: cityName,
        delivery_time: "2-4 Hours",
        price: priceStats.priceLowestFormatted,
        price_lowest: priceStats.priceLowestFormatted,
        price_low: priceStats.priceLowestFormatted,
        price_highest: priceStats.priceHighestFormatted,
        price_high: priceStats.priceHighestFormatted,
        price_range: priceStats.priceRangeFormatted,
        warranty_range: priceStats.warrantyRangeFormatted,
      },
      (brand as any)?.seo,
      {
        title: `${brandName} ${categoryName} Authorized Dealer in ${cityName}`,
        description: `Buy 100% Genuine ${brandName} ${categoryName} from Authorized Dealer in ${cityName} at Best Price. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    return buildPageHead(seo, { path: `/brand-dealer/${params.categorySlug}/${params.brandSlug}/${params.citySlug}` });
  },
  validateSearch: productSearchSchema,
  component: DealerBrandCityProductsPage,
});

function DealerBrandCityProductsPage() {
  const { categorySlug, brandSlug, citySlug } = Route.useParams();
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
      baseUrl={`/brand-dealer/${categorySlug}/${brandSlug}`}
    />
  );
}
