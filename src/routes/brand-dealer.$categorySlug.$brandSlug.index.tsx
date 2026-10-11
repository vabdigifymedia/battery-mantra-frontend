import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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
import { locationService } from "@/services/location.service";
import { useLocationStore } from "@/store/useLocationStore";

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
    const firstSlug = params.categorySlug.toLowerCase();
    const secondSlug = params.brandSlug.toLowerCase();

    const brandMatchesFirst = loaderData?.brands?.find((b: any) => toSlug(b.brandName) === firstSlug);
    const brandMatchesSecond = loaderData?.brands?.find((b: any) => toSlug(b.brandName) === secondSlug);

    let brand = null;
    let category = null;
    let cityName = "";
    let brandName = "";
    let categoryName = "";

    if (brandMatchesFirst) {
      // Pattern: /brand-dealer/:brandSlug/:citySlug (e.g. /brand-dealer/exide/noida)
      brand = brandMatchesFirst;
      brandName = brand.brandName;
      cityName = secondSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      categoryName = "Batteries";
    } else if (brandMatchesSecond) {
      // Pattern: /brand-dealer/:categorySlug/:brandSlug (e.g. /brand-dealer/car-battery/exide)
      brand = brandMatchesSecond;
      brandName = brand.brandName;
      category = loaderData?.categories?.find((c: any) => toSlug(c.categoryName) === firstSlug);
      categoryName = category?.categoryName || firstSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else {
      brandName = secondSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      categoryName = firstSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    const defaultTitle = cityName
      ? `${brandName} Authorized Dealer in ${cityName}`
      : `${brandName} ${categoryName} Authorized Dealer Online`;
    const defaultDesc = cityName
      ? `Buy 100% Genuine ${brandName} Batteries from Authorized Dealer in ${cityName} at Best Price. Get Free Express Delivery and Installation in 1-2 hours.`
      : `Buy 100% Genuine ${brandName} ${categoryName} from Authorized Dealer Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`;

    const seo = resolveTemplateSeo(
      "DEALER",
      loaderData?.templates,
      {
        brand_name: brand?.brandName || brandName,
        category_name: category?.categoryName || categoryName,
        city_name: cityName,
        delivery_time: "2-4 Hours",
      },
      (brand as any)?.seo,
      {
        title: defaultTitle,
        description: defaultDesc,
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
  const { city, pincode, setLocation } = useLocationStore();

  const { data: categories, isLoading: isCatLoading } = useQuery(categoriesQuery());
  const { data: brands, isLoading: isBrandLoading } = useQuery(brandsQuery());

  const firstSlug = categorySlug.toLowerCase();
  const secondSlug = brandSlug.toLowerCase();

  const brandMatchesFirst = brands?.find((b: any) => toSlug(b.brandName) === firstSlug);
  const brandMatchesSecond = brands?.find((b: any) => toSlug(b.brandName) === secondSlug);

  const isBrandCity = Boolean(brandMatchesFirst);

  const resolvedBrandSlug = isBrandCity ? categorySlug : (brandMatchesSecond ? brandSlug : brandSlug);
  const resolvedCategorySlug = isBrandCity ? (search.category || undefined) : categorySlug;
  const resolvedCitySlug = isBrandCity ? brandSlug : undefined;

  useEffect(() => {
    if (resolvedCitySlug) {
      const currentCitySlug = city?.cityName?.toLowerCase().replace(/\s+/g, '-');
      if (currentCitySlug !== resolvedCitySlug.toLowerCase()) {
        locationService.getPublicCities().then(cities => {
          const matchedCity = cities.find(c => c.cityName?.toLowerCase().replace(/\s+/g, '-') === resolvedCitySlug.toLowerCase());
          if (matchedCity) {
            setLocation(pincode || "", true, matchedCity);
          }
        }).catch(console.error);
      }
    }
  }, [resolvedCitySlug, city?.cityName, pincode, setLocation]);

  if (isCatLoading || isBrandLoading) {
    return <FullPageLoader />;
  }

  const activeSearch = {
    ...search,
    ...(resolvedCategorySlug ? { category: resolvedCategorySlug } : {}),
    brand: resolvedBrandSlug,
  };

  const baseUrl = isBrandCity 
    ? `/brand-dealer/${resolvedBrandSlug}`
    : `/brand-dealer/${categorySlug}/${brandSlug}`;

  return (
    <ProductsPageLayout 
      search={activeSearch}
      isDealerPage={true}
      baseUrl={baseUrl}
      onSearchChange={(newSearch) => {
        if (
          (newSearch.category && newSearch.category.split(',').length > 0 && resolvedCategorySlug && !newSearch.category.split(',').includes(resolvedCategorySlug)) ||
          (newSearch.brand && newSearch.brand.split(',').length > 0 && !newSearch.brand.split(',').includes(resolvedBrandSlug))
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
      hideCategoryFilter={!isBrandCity}
    />
  );
}
