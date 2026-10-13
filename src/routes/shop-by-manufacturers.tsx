import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { rootCategoriesQuery, manufacturersListQuery, brandsQuery } from "@/queries";
import { ChevronRight, Car, Tag } from "lucide-react";
import { GradientBlobCard } from "@/components/ui/gradient-blob-card";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
import { DynamicSearchBanner } from "@/components/products/DynamicSearchBanner";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";
import { applySeoTemplate } from "@/lib/utils";
import { useLocationStore } from "@/store/useLocationStore";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

export const Route = createFileRoute("/shop-by-manufacturers")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());

    const [categories, templates] = await Promise.all([
      context.queryClient.ensureQueryData(rootCategoriesQuery()),
      context.queryClient.ensureQueryData(seoTemplatesQuery()),
    ]);
    return { categories, templates };
  },
  head: ({ loaderData }) => {
    const categoryName = "Car Batteries";
    const category = loaderData?.categories?.find((c: any) =>
      /(^|-)car(-|$)/.test(toSlug(c.categoryName)) || /(^|\s)car(\s|$)/i.test(c.categoryName)
    );

    const seo = resolveTemplateSeo(
      "CATEGORY",
      loaderData?.templates,
      { category_name: category?.categoryName || categoryName, delivery_time: "2-4 Hours" },
      (category as any)?.seo,
      {
        title: `Shop by Car Battery Manufacturers | Battery Mantra`,
        description: `Select your car manufacturer to find 100% compatible batteries at guaranteed best prices with free express delivery and installation.`,
      }
    );

    return buildPageHead(seo);
  },
  component: ShopByManufacturersPage,
});

function ShopByManufacturersPage() {
  const categorySlug = "car-batteries";
  const { city } = useLocationStore();

  // Load root categories to find categoryId for car batteries
  const { data: categories } = useQuery(rootCategoriesQuery());
  const findCategory = (cats: any[]): any => {
    for (const c of cats) {
      if (
        c.categorySlug === categorySlug ||
        toSlug(c.categoryName) === categorySlug ||
        (/(^|-)car(-|$)/.test(categorySlug) && /(^|\s)car(\s|$)/i.test(c.categoryName))
      ) {
        return c;
      }
      if (c.subCategories && c.subCategories.length > 0) {
        const found = findCategory(c.subCategories);
        if (found) return found;
      }
    }
    return undefined;
  };
  const category = categories ? findCategory(categories) : undefined;
  const categoryName = category?.categoryName || "Car Batteries";

  // Load manufacturers for car batteries
  const { data: categoryMfrs, isLoading: isLoadingCatMfrs } = useQuery({
    ...manufacturersListQuery(category?.categoryId),
    enabled: !!category?.categoryId,
  });

  const hasSpecificMfrs = categoryMfrs && categoryMfrs.length > 0;

  // Load brands for car batteries
  const { data: brands = [], isLoading: isLoadingBrands } = useQuery({
    ...brandsQuery(category?.categoryId),
    enabled: !!category?.categoryId,
  });

  const isLoading = isLoadingCatMfrs || isLoadingBrands;
  const FallbackIcon = Car;

  return (
    <div className="flex flex-col gap-12">
      <Container size="xl" className="py-8 min-h-screen">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="capitalize">{categoryName}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Manufacturers</span>
        </nav>

        {/* Header Banner */}
        <DynamicSearchBanner search={{ categoryId: category?.categoryId }} />

        {/* Manufacturers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border bg-card p-4 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...(categoryMfrs || [])]
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((m) => (
                <Link
                  key={m.id}
                  to="/manufacturers/$categorySlug/$slug"
                  params={{ categorySlug, slug: toSlug(m.name) }}
                  className="snap-start"
                >
                  <GradientBlobCard className="flex flex-col items-center justify-center gap-3 p-5 text-center h-full">
                    <span className="grid h-16 w-16 place-items-center text-primary transition-transform group-hover:scale-110">
                      {m.logoUrl ? (
                        <img
                          src={m.logoUrl}
                          alt={m.name}
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <FallbackIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </span>
                    <span className="text-sm font-semibold text-foreground line-clamp-2">
                      {m.name}
                    </span>
                  </GradientBlobCard>
                </Link>
              ))}
          </div>
        )}

        {/* Shop by Brand Section */}
        {brands.filter((b) => b.productCount === undefined || b.productCount > 0).length > 0 && (
          <div className="mt-14 space-y-6">
            <div className="border-b pb-3">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Shop by Brand
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Prefer to choose by battery brand? Explore leading car battery brands
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands
                .filter((b) => b.productCount === undefined || b.productCount > 0)
                .map((b) => (
                  <Link
                    key={b.brandId}
                    to="/shop/$categorySlug/$brandSlug"
                    params={{ categorySlug, brandSlug: toSlug(b.brandName) }}
                    className="snap-start group"
                  >
                    <GradientBlobCard className="flex flex-col items-center justify-center gap-3 p-5 text-center h-full hover:shadow-md transition-all">
                      <span className="grid h-16 w-16 place-items-center text-primary transition-transform group-hover:scale-110">
                        {b.brandLogo ? (
                          <img
                            src={b.brandLogo}
                            alt={b.brandName}
                            className="h-full w-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <Tag className="h-8 w-8 text-muted-foreground" />
                        )}
                      </span>
                      <span className="text-sm font-semibold text-foreground line-clamp-2">
                        {b.brandName}
                      </span>
                    </GradientBlobCard>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {category?.categoryDescription && (
          <div
            className="prose prose-sm md:prose-base max-w-none mt-12 mb-8 text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: applySeoTemplate(category.categoryDescription, {
                city: city?.cityName || "Delhi / NCR",
                city_name: city?.cityName || "Delhi / NCR",
                category: categoryName,
                category_name: categoryName,
              }),
            }}
          />
        )}

        <SeoCityLinks productName={categoryName} baseUrl={`/shop-by-manufacturers`} />
      </Container>

      <GlobalFaqSection
        pageType="MANUFACTURER"
        context={{
          category_name: categoryName,
        }}
      />
    </div>
  );
}
