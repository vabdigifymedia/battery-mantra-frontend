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
import { GradientBlobCard } from "@/components/ui/gradient-blob-card";
import { ChevronRight, ShieldCheck, Car, Zap, BatteryCharging, Tag, Sparkles } from "lucide-react";

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
    <div className="flex flex-col gap-6">
      <Container size="xl" className="pt-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-muted-foreground">Brands</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{brandName}</span>
        </nav>

        {/* Brand Header Banner */}
        <div className="rounded-2xl border bg-gradient-to-r from-card via-card/95 to-primary/5 p-6 md:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex h-20 w-32 md:h-24 md:w-40 shrink-0 items-center justify-center rounded-xl bg-background border p-3 shadow-inner">
            {matchingBrand?.brandLogo ? (
              <img
                src={matchingBrand.brandLogo}
                alt={brandName}
                className="h-full w-full object-contain mix-blend-multiply"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">{brandName}</span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {brandName} Batteries & Inverters
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% Genuine
              </span>
            </div>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Select your battery category below to find genuine {brandName} models with verified manufacturer warranty, fast express delivery, and professional installation.
            </p>
          </div>
        </div>

        {/* Categories Grid (Only categories where this brand has products) */}
        {brandCategories.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="border-b pb-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Select Category for {brandName}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Choose a category to browse specific models, capacities, and best prices
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {brandCategories.map((c) => {
                const IconComponent = getCategoryIcon(c.categoryName);
                const catSlug = toSlug(c.categoryName);
                return (
                  <Link
                    key={c.categoryId}
                    to="/shop/$categorySlug/$brandSlug"
                    params={{ categorySlug: catSlug, brandSlug }}
                    className="group snap-start"
                  >
                    <GradientBlobCard className="flex flex-col items-center justify-center gap-3 p-5 text-center h-full hover:shadow-md transition-all border hover:border-primary/40">
                      <span className="grid h-16 w-16 place-items-center text-primary transition-transform group-hover:scale-110">
                        {c.iconUrl ? (
                          <img
                            src={c.iconUrl}
                            alt={c.categoryName}
                            className="h-full w-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <IconComponent className="h-9 w-9 text-primary/80" />
                        )}
                      </span>
                      <div className="space-y-1">
                        <span className="text-sm md:text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {c.categoryName}
                        </span>
                        {c.productCount ? (
                          <p className="text-xs text-muted-foreground font-medium">
                            {c.productCount} {c.productCount === 1 ? "Product" : "Products"}
                          </p>
                        ) : null}
                      </div>
                    </GradientBlobCard>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Container>

      {/* Full Products Section */}
      <div className="border-t pt-8">
        <Container size="xl" className="mb-4">
          <div className="border-b pb-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              All {brandName} Products
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Browse and filter all available {brandName} batteries and inverters
            </p>
          </div>
        </Container>

        <ProductsPageLayout 
          search={activeSearch}
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
    </div>
  );
}
