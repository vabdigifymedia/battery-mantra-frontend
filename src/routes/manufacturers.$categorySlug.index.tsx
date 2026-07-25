import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { rootCategoriesQuery, manufacturersListQuery } from "@/queries";
import { ChevronRight, Car, Bike, Zap } from "lucide-react";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
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
      title: `Shop by ${categoryName} Manufacturer | Battery Mantra`,
      description: `Select your ${categoryName} manufacturer to find compatible batteries at best prices with free installation.`,
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
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Load manufacturers for this categoryId
  const { data: manufacturers, isLoading } = useQuery({
    ...manufacturersListQuery(category?.categoryId),
    enabled: true,
  });

  const sorted = manufacturers
    ? [...manufacturers].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    : [];

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
          <span className="text-foreground font-medium">Manufacturers</span>
        </nav>

        {/* Header Banner */}
        <div className="mb-10 border-2 border-dashed border-gray-200 rounded-3xl overflow-hidden py-8 px-8 relative bg-white shadow-sm text-center">
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <Zap className="h-3.5 w-3.5" /> Find by Manufacturer
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Shop by {categoryName} Manufacturer
            </h1>
            <p className="text-muted-foreground text-base mt-2 max-w-xl">
              Select your vehicle manufacturer below to find 100% compatible batteries with free doorstep installation.
            </p>
          </div>
        </div>

        {/* Manufacturers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border bg-card p-4 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sorted.map((m) => (
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
            {sorted.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                No manufacturers found for {categoryName}.
              </div>
            )}
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
