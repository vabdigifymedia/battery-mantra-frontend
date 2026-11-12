import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  categoriesQuery,
  pageSeoQuery,
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

export const Route = createFileRoute("/brand-products/$categorySlug/$brandSlug/")({
  loader: async ({ context, params }) => {
    assertValidRouteSlugs(params.categorySlug, params.brandSlug);

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

    let pageSeo = null;
    try {
      pageSeo = await context.queryClient.fetchQuery(
        pageSeoQuery(`/brand-products/${params.categorySlug}/${params.brandSlug}`)
      );
    } catch {
      // ignore
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

    return { brands, categories, rootCategories, templates, pageSeo, initialProducts };
  },
  head: ({ loaderData, params }) => {
    if (hasAnyInvalidRouteSlug(params.categorySlug, params.brandSlug) || !loaderData) {
      return notFoundHead();
    }

    const categoryName = params.categorySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const brandName = params.brandSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const brand = findBrandBySlug(loaderData?.brands, params.brandSlug);
    const category = findCategoryBySlug(
      [...(loaderData?.categories || []), ...(loaderData?.rootCategories || [])],
      params.categorySlug
    );

    const displayBrandName = brand?.brandName || brandName;
    const displayCategoryName = toSingularCategory(category?.categoryName || categoryName) || "Battery";
    const priceStats = extractProductPriceStats(loaderData?.initialProducts);

    // Use specific CMS Page SEO first, then entity SEO, then templates
    const seo = resolveTemplateSeo(
      "BRAND",
      loaderData?.templates ?? undefined,
      {
        brand_name: displayBrandName,
        brand: displayBrandName,
        category_name: displayCategoryName,
        category: displayCategoryName,
        delivery_time: "1-2 Hours",
        price: priceStats.priceLowestFormatted,
        price_lowest: priceStats.priceLowestFormatted,
        price_low: priceStats.priceLowestFormatted,
        price_highest: priceStats.priceHighestFormatted,
        price_high: priceStats.priceHighestFormatted,
        price_range: priceStats.priceRangeFormatted,
        warranty_range: priceStats.warrantyRangeFormatted,
      },
      loaderData?.pageSeo?.seo || (brand as any)?.seo || (category as any)?.seo,
      {
        title: `${displayBrandName} ${displayCategoryName} Online | Buy 100% Genuine Battery — BatteryMantra`,
        description: `Buy 100% Genuine ${displayBrandName} ${displayCategoryName} Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    const headResult = buildPageHead(seo);
    return {
      ...headResult,
      links: [
        {
          rel: "canonical",
          href: `https://batterymantra.com/brand-products/${params.categorySlug}/${params.brandSlug}`,
        },
      ],
    };
  },
  validateSearch: productSearchSchema,
  component: BrandProductsPage,
});

function BrandProductsPage() {
  const { categorySlug, brandSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });

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

  const matchingBrand = brands?.find((b) => getBrandSlug(b) === brandSlug || toSlug(b.brandName) === brandSlug);

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
      baseUrl={`/brand-products/${categorySlug}/${brandSlug}`}
    />
  );
}
