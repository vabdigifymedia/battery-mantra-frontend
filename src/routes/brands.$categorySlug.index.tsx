import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { rootCategoriesQuery, manufacturersListQuery, brandsQuery } from "@/queries";
import { ChevronRight, Car, Bike, Zap, Tag } from "lucide-react";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
import { DynamicSearchBanner } from "@/components/products/DynamicSearchBanner";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";
import { applySeoTemplate } from "@/lib/utils";
import { useLocationStore } from "@/store/useLocationStore";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

export const Route = createFileRoute("/brands/$categorySlug/")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());

    const [categories, templates] = await Promise.all([
      context.queryClient.ensureQueryData(rootCategoriesQuery()),
      context.queryClient.ensureQueryData(seoTemplatesQuery()),
    ]);
    return { categories, templates };
  },
  head: ({ loaderData, params }) => {
    const categoryName = params.categorySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const category = loaderData?.categories?.find((c: any) => toSlug(c.categoryName) === params.categorySlug);

    const seo = resolveTemplateSeo(
      "CATEGORY",
      loaderData?.templates,
      { category_name: category?.categoryName || categoryName },
      (category as any)?.seo, // The category's own SEO
      {
        title: `Shop by ${categoryName} Brands | Battery Mantra`,
        description: `Select your ${categoryName} brand to find products at best prices with free installation.`,
      }
    );

    return buildPageHead(seo);
  },
  component: CategoryBrandsPage,
});

function CategoryBrandsPage() {
  const { categorySlug } = Route.useParams();
  const { city } = useLocationStore();

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

  // Load brands for this category
  const { data: brands = [], isLoading } = useQuery({
    ...brandsQuery(category?.categoryId),
    enabled: !!category?.categoryId,
  });

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
          <span className="text-foreground font-medium">Brands</span>
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {brands.filter((b) => b.productCount === undefined || b.productCount > 0).map((b) => (
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

        {category?.categoryDescription && (
          <div 
            className="prose prose-sm md:prose-base max-w-none mt-12 mb-8 text-muted-foreground"
            dangerouslySetInnerHTML={{ 
              __html: applySeoTemplate(category.categoryDescription, {
                city: city?.cityName || "Delhi / NCR",
                city_name: city?.cityName || "Delhi / NCR",
                category: categoryName,
                category_name: categoryName,
              }) 
            }}
          />
        )}

        <SeoCityLinks productName={categoryName} />
      </Container>

      <GlobalFaqSection
        pageType="BRAND"
        context={{
          category_name: categoryName,
        }}
      />
    </div>
  );
}
