import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  categoriesQuery,
  productListQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { Container } from "@/components/layout/Container";
import { ChevronRight, Car, Zap, BatteryCharging, Tag, Sparkles } from "lucide-react";

export const Route = createFileRoute("/brand/$brandSlug")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(categoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());
    void context.queryClient.prefetchQuery(productListQuery());
    
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
      { brand_name: brand?.brandName || brandName, delivery_time: "2-4 Hours" },
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

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes("car")) return Car;
  if (name.includes("inverter battery") || name.includes("solar")) return BatteryCharging;
  if (name.includes("inverter")) return Zap;
  return Tag;
};

function BrandProductsPage() {
  const { brandSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });

  const { data: brands, isLoading: isBrandsLoading } = useQuery(brandsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: allProducts = [] } = useQuery(productListQuery());

  const matchingBrand = brands?.find(b => toSlug(b.brandName) === brandSlug);
  const brandName = matchingBrand?.brandName || brandSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Compute categories that actually have products for this brand
  const brandCategories = useMemo(() => {
    if (!allProducts.length || !matchingBrand || !categories.length) return [];
    const bName = matchingBrand.brandName.toLowerCase();
    const brandProducts = allProducts.filter(p => p.brandName?.toLowerCase() === bName);

    // Count products per category
    const counts: Record<string, number> = {};
    for (const p of brandProducts) {
      const cat = p.productCategory;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }

    // Match categories with products
    return categories
      .filter(c => (counts[c.categoryName] || 0) > 0)
      .map(c => ({
        ...c,
        productCount: counts[c.categoryName],
      }))
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
  }, [allProducts, matchingBrand, categories]);

  if (isBrandsLoading) {
    return <FullPageLoader />;
  }

  // We inject the brand slug into the search context
  const activeSearch = {
    ...search,
    brand: brandSlug,
  };

  return (
    <div className="flex flex-col">
      <Container size="xl" className="pt-4 pb-2">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-muted-foreground">Brands</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{brandName}</span>
        </nav>

        {/* Compact Categories Selector */}
        {brandCategories.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Select Category for {brandName}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {brandCategories.map((c) => {
                const IconComponent = getCategoryIcon(c.categoryName);
                const catSlug = toSlug(c.categoryName);
                return (
                  <Link
                    key={c.categoryId}
                    to="/brand-products/$categorySlug/$brandSlug"
                    params={{ categorySlug: catSlug, brandSlug }}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-semibold text-foreground hover:text-primary shadow-xs"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 group-hover:scale-110 transition-transform">
                      {c.iconUrl ? (
                        <img
                          src={c.iconUrl}
                          alt={c.categoryName}
                          className="h-3.5 w-3.5 object-contain mix-blend-multiply"
                        />
                      ) : (
                        <IconComponent className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span>{c.categoryName}</span>
                    {c.productCount ? (
                      <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-full">
                        {c.productCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Container>

      {/* Products Section with Dynamic Banner as Primary Header */}
      <ProductsPageLayout 
        search={activeSearch}
        hidePageHeader={true}
        onSearchChange={(newSearch) => {
          if (
            (newSearch.brand && newSearch.brand.split(',').length > 0 && !newSearch.brand.split(',').includes(brandSlug)) ||
            (newSearch.category && newSearch.category.length > 0)
          ) {
            navigate({ 
              to: "/products", 
              search: { ...activeSearch, ...newSearch, page: newSearch.page ?? activeSearch.page } 
            });
          } else {
            const { brand, ...cleanSearch } = newSearch;
            navigate({ search: { ...search, ...cleanSearch, page: newSearch.page ?? search.page } });
          }
        }}
      />
    </div>
  );
}
