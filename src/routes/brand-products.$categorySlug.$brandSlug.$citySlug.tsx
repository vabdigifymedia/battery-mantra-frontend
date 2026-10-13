import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import { locationService } from "@/services/location.service";
import { useLocationStore } from "@/store/useLocationStore";
import {
  rootCategoriesQuery,
  brandsQuery,
  categoriesQuery,
  pageSeoQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/brand-products/$categorySlug/$brandSlug/$citySlug")({
  loader: async ({ context, params }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(categoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());

    const [brands, categories, templates] = await Promise.all([
      context.queryClient.ensureQueryData(brandsQuery()).catch(() => []),
      context.queryClient.ensureQueryData(categoriesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => undefined),
    ]);

    let pageSeo = null;
    try {
      pageSeo = await context.queryClient.fetchQuery(
        pageSeoQuery(`/brand-products/${params.categorySlug}/${params.brandSlug}/${params.citySlug}`)
      );
    } catch {
      // ignore
    }

    return { brands, categories, templates, pageSeo };
  },
  head: ({ loaderData, params }) => {
    const categoryName = params.categorySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const brandName = params.brandSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const cityName = params.citySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const brand = loaderData?.brands?.find((b: any) => toSlug(b.brandName) === params.brandSlug);
    const category = loaderData?.categories?.find((c: any) => {
      const s = toSlug(c.categoryName);
      return (
        s === params.categorySlug ||
        s.replace(/-battery$/, "-batteries") === params.categorySlug ||
        s.replace(/-batteries$/, "-battery") === params.categorySlug
      );
    });

    const displayBrandName = brand?.brandName || brandName;
    const displayCategoryName = category?.categoryName || categoryName;

    const seo = resolveTemplateSeo(
      "BRAND",
      loaderData?.templates ?? undefined,
      {
        brand_name: displayBrandName,
        category_name: displayCategoryName,
        city_name: cityName,
        delivery_time: "1-2 Hours",
      },
      loaderData?.pageSeo?.seo || (brand as any)?.seo,
      {
        title: `${displayBrandName} ${displayCategoryName} in ${cityName} | Buy 100% Genuine Battery — BatteryMantra`,
        description: `Buy 100% Genuine ${displayBrandName} ${displayCategoryName} in ${cityName} at Best Price. Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    const headResult = buildPageHead(seo);
    return {
      ...headResult,
      links: [
        {
          rel: "canonical",
          href: `https://www.batterymantra.com/brand-products/${params.categorySlug}/${params.brandSlug}/${params.citySlug}`,
        },
      ],
    };
  },
  validateSearch: productSearchSchema,
  component: CityBrandProductsPage,
});

function CityBrandProductsPage() {
  const { categorySlug, brandSlug, citySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });
  const { city, pincode, setLocation } = useLocationStore();

  useEffect(() => {
    if (citySlug) {
      const currentCitySlug = city?.cityName?.toLowerCase().replace(/\s+/g, "-");
      if (currentCitySlug !== citySlug.toLowerCase()) {
        locationService
          .getPublicCities()
          .then((cities) => {
            const matchedCity = cities.find(
              (c) => c.cityName?.toLowerCase().replace(/\s+/g, "-") === citySlug.toLowerCase()
            );
            if (matchedCity) {
              setLocation(pincode || "", true, matchedCity);
            }
          })
          .catch(console.error);
      }
    }
  }, [citySlug, city?.cityName, pincode, setLocation]);

  const { data: categories, isLoading: isCatLoading } = useQuery(categoriesQuery());
  const { data: brands, isLoading: isBrandLoading } = useQuery(brandsQuery());

  if (isCatLoading || isBrandLoading) {
    return <FullPageLoader />;
  }

  const matchingCategory = categories?.find((c) => {
    const s = toSlug(c.categoryName);
    return (
      s === categorySlug ||
      s.replace(/-battery$/, "-batteries") === categorySlug ||
      s.replace(/-batteries$/, "-battery") === categorySlug
    );
  });

  const matchingBrand = brands?.find((b) => toSlug(b.brandName) === brandSlug);

  const activeSearch = {
    ...search,
    category: categorySlug,
    brand: brandSlug,
  };

  return (
    <ProductsPageLayout
      search={activeSearch}
      onSearchChange={(newSearch) => {
        if (
          (newSearch.category &&
            newSearch.category.split(",").length > 0 &&
            !newSearch.category.split(",").includes(categorySlug)) ||
          (newSearch.brand &&
            newSearch.brand.split(",").length > 0 &&
            !newSearch.brand.split(",").includes(brandSlug))
        ) {
          navigate({
            to: "/products",
            search: { ...activeSearch, ...newSearch, page: (newSearch as any).page ?? (activeSearch as any).page },
          });
        } else {
          const { category, brand, ...cleanSearch } = newSearch as any;
          navigate({ search: { ...search, ...cleanSearch, page: (newSearch as any).page ?? (search as any).page } });
        }
      }}
      hideCategoryFilter={true}
    />
  );
}
