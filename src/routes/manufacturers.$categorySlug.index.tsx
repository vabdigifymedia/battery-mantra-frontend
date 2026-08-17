import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { rootCategoriesQuery, manufacturersListQuery, brandsQuery } from "@/queries";
import { ChevronRight, Car, Bike, Zap, Tag } from "lucide-react";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
import { DynamicSearchBanner } from "@/components/products/DynamicSearchBanner";
import { buildPageHead } from "@/lib/seo";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

export const Route = createFileRoute("/manufacturers/$categorySlug/")({
  head: ({ params }) => {
    const categoryName = params.categorySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return buildPageHead(null, {
      title: `Shop by ${categoryName} | Battery Mantra`,
      description: `Select your ${categoryName} manufacturer or brand to find compatible batteries at best prices with free installation.`,
    });
  },
  component: CategoryManufacturersPage,
});

function CategoryManufacturersPage() {
  const { categorySlug } = Route.useParams();

  // Load root categories to find categoryId by slug
  const { data: categories } = useQuery(rootCategoriesQuery());
  const category = categories?.find(
    (c) =>
      c.categorySlug === categorySlug ||
      toSlug(c.categoryName) === categorySlug ||
      (categorySlug.includes("car") && c.categoryName.toLowerCase().includes("car")) ||
      ((categorySlug.includes("bike") || categorySlug.includes("two-wheeler")) &&
        (c.categoryName.toLowerCase().includes("bike") || c.categoryName.toLowerCase().includes("two wheeler")))
  );

  const categoryName =
    category?.categoryName ||
    categorySlug
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Load manufacturers for this categoryId
  const { data: categoryMfrs, isLoading: isLoadingCatMfrs } = useQuery({
    ...manufacturersListQuery(category?.categoryId),
    enabled: !!category?.categoryId,
  });

  // Load brands as fallback/alternative for non-vehicle categories
  const { data: brands = [], isLoading: isLoadingBrands } = useQuery(brandsQuery());

  const hasSpecificMfrs = categoryMfrs && categoryMfrs.length > 0;
  const isLoading = isLoadingCatMfrs || isLoadingBrands;

  const isBike =
    categorySlug.includes("bike") ||
    categorySlug.includes("two-wheeler") ||
    categoryName.toLowerCase().includes("two wheeler");
  const FallbackIcon = isBike ? Bike : Car;

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
          <span className="text-foreground font-medium">
            {hasSpecificMfrs ? "Manufacturers" : "Brands"}
          </span>
        </nav>

        {/* Header Banner */}
        <DynamicSearchBanner search={{ categoryId: category?.categoryId }} />

        {/* Manufacturers or Brands Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border bg-card p-4 animate-pulse" />
            ))}
          </div>
        ) : hasSpecificMfrs ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...categoryMfrs]
              .filter((m) => (m.vehicleCount ?? 0) > 0)
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((m) => (
                <Link
                  key={m.id}
                  to="/manufacturers/$categorySlug/$makeSlug"
                  params={{ categorySlug, makeSlug: toSlug(m.name) }}
                  className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-product"
                >
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
                </Link>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {brands.filter((b) => (b.productCount ?? 0) > 0).map((b) => (
              <Link
                key={b.brandId}
                to="/shop/$categorySlug/$brandSlug"
                params={{ categorySlug, brandSlug: toSlug(b.brandName) }}
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-product"
              >
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
              </Link>
            ))}
          </div>
        )}
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
