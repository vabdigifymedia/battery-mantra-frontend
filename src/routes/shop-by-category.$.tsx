import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers, ChevronRight, Tag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { rootCategoriesQuery, pageSeoQuery, brandsQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";
import { GradientBlobCard } from "@/components/ui/gradient-blob-card";
import { DynamicSearchBanner } from "@/components/products/DynamicSearchBanner";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";
import { ErrorState } from "@/components/feedback/ErrorState";
import { applySeoTemplate } from "@/lib/utils";
import { useLocationStore } from "@/store/useLocationStore";
import { LithiumMainPage } from "@/components/lithium/LithiumMainPage";
import { LithiumSubCategoryPage } from "@/components/lithium/LithiumSubCategoryPage";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";

const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/-batteries$/, "-battery")
    .replace(/\s+/g, "-");
}

function matchesCategory(c: any, targetSlug: string): boolean {
  if (!c) return false;
  const normTarget = normalizeSlug(targetSlug);
  const cSlug = c.categorySlug ? normalizeSlug(c.categorySlug) : "";
  const cNameSlug = normalizeSlug(toSlug(c.categoryName || ""));

  if (cSlug === normTarget || cNameSlug === normTarget) return true;
  if (c.categorySlug === targetSlug || toSlug(c.categoryName || "") === targetSlug) return true;

  const simplifiedTarget = normTarget.replace(/-battery$/, "");
  const simplifiedName = cNameSlug.replace(/-battery$/, "");
  if (simplifiedTarget.length > 3 && simplifiedTarget === simplifiedName) return true;

  return false;
}

export const Route = createFileRoute("/shop-by-category/$")({
  loader: async ({ context, params }) => {
    const splat = (params as any)._splat || "";
    const [categorySlug, citySlug] = splat.split("/");
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());

    const [categories, templates] = await Promise.all([
      context.queryClient.ensureQueryData(rootCategoriesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => undefined),
    ]);

    let pageSeo = null;
    try {
      pageSeo = await context.queryClient.fetchQuery(pageSeoQuery(`/categories/${categorySlug}`));
    } catch {
      // ignore
    }

    return { pageSeo, categories, templates, categorySlug, citySlug };
  },
  head: ({ loaderData }) => {
    const { categorySlug = "category", categories = [], templates, pageSeo } = loaderData || {};

    let foundCategory: any = undefined;
    const findInTree = (cats: any[]): boolean => {
      for (const c of cats) {
        if (matchesCategory(c, categorySlug)) {
          foundCategory = c;
          return true;
        }
        if (c.subCategories && findInTree(c.subCategories)) return true;
      }
      return false;
    };
    findInTree(categories);

    const categoryName = foundCategory?.categoryName || categorySlug
      .replace(/-/g, " ")
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const seo = resolveTemplateSeo(
      "CATEGORY",
      templates ?? undefined,
      { category_name: foundCategory?.categoryName || categoryName, delivery_time: "2-4 Hours" },
      pageSeo?.seo || (foundCategory as any)?.seo,
      {
        title: `Shop ${categoryName} — BatteryMantra`,
        description: `Browse premium ${categoryName} from trusted brands with free doorstep delivery and installation.`,
      }
    );

    return buildPageHead(seo);
  },
  component: SubcategoriesPage,
});

function SubcategoriesPage() {
  const { categorySlug, citySlug } = Route.useLoaderData();
  const { data, isLoading, isError, refetch } = useQuery(rootCategoriesQuery());
  const navigate = useNavigate();
  const { city } = useLocationStore();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading Category..." />
        <Container size="xl" className="py-8">
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 lg:snap-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-28 min-w-[120px] lg:min-w-0 snap-start" />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load category"
        description="Please try again in a moment."
        onRetry={() => void refetch()}
      />
    );
  }

  let category: any = undefined;
  const searchCategory = (cats: any[]) => {
    for (const c of cats) {
      if (matchesCategory(c, categorySlug)) {
        category = c;
        return true;
      }
      if (c.subCategories && searchCategory(c.subCategories)) {
        return true;
      }
    }
    return false;
  };
  searchCategory(data);

  if (!category) {
    if (
      categorySlug === "lithium-integrated-inverter-battery" ||
      categorySlug === "lithium-inbuilt-solar-inverter-battery" ||
      categorySlug === "lithium-battery-for-inverter"
    ) {
      let actualCat: any = undefined;
      const findCatByKeywords = (cats: any[]) => {
        for (const c of cats) {
          const catName = c.categoryName.toLowerCase();
          if (categorySlug === "lithium-integrated-inverter-battery" && catName.includes("integrated") && (catName.includes("lithium") || catName.includes("inverter"))) {
            actualCat = c; return true;
          }
          if (categorySlug === "lithium-inbuilt-solar-inverter-battery" && catName.includes("solar") && (catName.includes("lithium") || catName.includes("inbuilt"))) {
            actualCat = c; return true;
          }
          if (categorySlug === "lithium-battery-for-inverter" && (catName.includes("battery for inverter") || catName.includes("inverter battery")) && !catName.includes("integrated") && !catName.includes("solar")) {
            actualCat = c; return true;
          }
          if (c.subCategories && findCatByKeywords(c.subCategories)) return true;
        }
        return false;
      };
      findCatByKeywords(data);

      if (actualCat) {
        category = actualCat;
      } else {
        const rootLithium = data.find((c: any) => c.categoryName.toLowerCase().includes("lithium power solutions") || (c.categorySlug || toSlug(c.categoryName)) === "lithium-power-solutions");
        if (rootLithium) {
          let name = "Lithium Battery for Inverter";
          if (categorySlug === "lithium-integrated-inverter-battery") name = "Lithium Integrated Inverter Battery";
          if (categorySlug === "lithium-inbuilt-solar-inverter-battery") name = "Lithium Inbuilt Solar Inverter Battery";

          category = {
            ...rootLithium,
            categoryName: name,
            categorySlug: categorySlug,
            subCategories: []
          };
        }
      }
    }
  }

  if (!category) {
    return (
      <ErrorState
        title="Category Not Found"
        description="The category you are looking for does not exist."
        onRetry={() => navigate({ to: "/" })}
      />
    );
  }

  const subCategories = category.subCategories || [];
  const sorted = [...subCategories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const isLithiumRoot = category.categoryName.toLowerCase().includes("lithium power solutions") || categorySlug === "lithium-power-solutions";
  if (isLithiumRoot) {
    return <LithiumMainPage category={category} subcategories={sorted} />;
  }

  const catName = category.categoryName.toLowerCase();
  const isLithiumIntegrated = catName.includes("integrated") && (catName.includes("lithium") || catName.includes("inverter"));
  const isLithiumSolar = catName.includes("solar") && (catName.includes("lithium") || catName.includes("inbuilt"));
  const isLithiumBattery = (catName.includes("battery for inverter") || catName.includes("inverter battery")) && !isLithiumIntegrated && !isLithiumSolar && !catName.includes("accessories") && !catName.includes("accessory");

  if (isLithiumIntegrated || isLithiumSolar || isLithiumBattery) {
    let type = "lithium-battery-for-inverter";
    if (isLithiumSolar) type = "lithium-inbuilt-solar-inverter-battery";
    if (isLithiumIntegrated) type = "lithium-integrated-inverter-battery";
    return <LithiumSubCategoryPage category={category} type={type} />;
  }

  // If this category has subcategories, display subcategory cards
  if (sorted.length > 0) {
    return (
      <div>
        <PageHeader
          title={category.categoryName}
          description="Select a subcategory to view products."
        />
        <Container size="xl" className="py-8">
          <div className="mb-8">
            <DynamicSearchBanner search={{ categoryId: category.categoryId }} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {sorted.map((c) => {
              const name = c.categoryName.toLowerCase();
              const isCar = /(^|\s)car(\s|$)/i.test(name);
              const rawSlug = c.categorySlug || toSlug(c.categoryName);

              const cardContent = (
                <>
                  <span className="grid h-16 w-16 place-items-center text-primary transition-transform group-hover:scale-110">
                    {c.iconUrl ? (
                      <img src={c.iconUrl} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                    ) : (
                      <Layers className="h-8 w-8" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-foreground line-clamp-2">
                    {c.categoryName}
                  </span>
                </>
              );

              const cardClassName = "flex flex-col h-full items-center justify-between gap-4 p-6 text-center";
              const linkClassName = "snap-start h-full";

              if (c.clickAction === 'SHOW_BRANDS') {
                return (
                  <Link key={c.categoryId} to="/shop-by-category/$" params={{ _splat: rawSlug }} className={linkClassName}>
                    <GradientBlobCard className={cardClassName}>
                      {cardContent}
                    </GradientBlobCard>
                  </Link>
                );
              }
              if (c.clickAction === 'SHOW_MANUFACTURERS') {
                return (
                  <Link key={c.categoryId} to="/shop-by-manufacturers" className={linkClassName}>
                    <GradientBlobCard className={cardClassName}>
                      {cardContent}
                    </GradientBlobCard>
                  </Link>
                );
              }
              if (c.clickAction === 'SHOW_PRODUCTS') {
                return (
                  <Link key={c.categoryId} to="/shop/c/$categorySlug" params={{ categorySlug: rawSlug }} className={linkClassName}>
                    <GradientBlobCard className={cardClassName}>
                      {cardContent}
                    </GradientBlobCard>
                  </Link>
                );
              }
              if (c.clickAction === 'SHOW_SUBCATEGORIES') {
                return (
                  <Link key={c.categoryId} to="/shop-by-category/$" params={{ _splat: rawSlug }} className={linkClassName}>
                    <GradientBlobCard className={cardClassName}>
                      {cardContent}
                    </GradientBlobCard>
                  </Link>
                );
              }

              // AUTO or undefined fallback
              if (c.subCategories && c.subCategories.length > 0) {
                return (
                  <Link key={c.categoryId} to="/shop-by-category/$" params={{ _splat: rawSlug }} className={linkClassName}>
                    <GradientBlobCard className={cardClassName}>
                      {cardContent}
                    </GradientBlobCard>
                  </Link>
                );
              }

              if (isCar) {
                return (
                  <Link
                    key={c.categoryId}
                    to="/shop-by-manufacturers"
                    className={linkClassName}
                  >
                    <GradientBlobCard className={cardClassName}>
                      {cardContent}
                    </GradientBlobCard>
                  </Link>
                );
              }

              return (
                <Link
                  key={c.categoryId}
                  to="/shop-by-category/$"
                  params={{ _splat: rawSlug }}
                  className={linkClassName}
                >
                  <GradientBlobCard className={cardClassName}>
                    {cardContent}
                  </GradientBlobCard>
                </Link>
              );
            })}
          </div>

          {category.categoryDescription && (
            <div
              className="prose prose-sm md:prose-base max-w-none mt-12 mb-8 text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: applySeoTemplate(category.categoryDescription, {
                  category_name: category.categoryName,
                  city_name: city?.cityName || "Delhi / NCR",
                })
              }}
            />
          )}

          <SeoCityLinks productName={category.categoryName} baseUrl={`/shop-by-category/${categorySlug}`} />
          <GlobalFaqSection pageType="CATEGORY" context={{ category_name: category.categoryName }} />
        </Container>
      </div>
    );
  }

  // When no subcategories exist (e.g. Inverter Battery, Generator Battery, etc.) -> Render Brands Grid!
  return <CategoryBrandsView category={category} categorySlug={categorySlug} citySlug={citySlug} />;
}

function CategoryBrandsView({
  category,
  categorySlug,
  citySlug,
}: {
  category: any;
  categorySlug: string;
  citySlug?: string;
}) {
  const { city } = useLocationStore();
  const categoryName = category.categoryName;
  const canonicalCatSlug = toSlug(categoryName);

  const { data: brands = [], isLoading } = useQuery({
    ...brandsQuery(category.categoryId),
    enabled: !!category.categoryId,
  });

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
        <DynamicSearchBanner search={{ categoryId: category.categoryId }} />

        {/* Brands Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border bg-card p-4 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {brands
              .filter((b: any) => b.productCount === undefined || b.productCount > 0)
              .map((b: any) => (
                <Link
                  key={b.brandId}
                  to="/shop/$categorySlug/$brandSlug"
                  params={{ categorySlug: canonicalCatSlug, brandSlug: toSlug(b.brandName) }}
                  className="snap-start"
                >
                  <GradientBlobCard className="flex flex-col items-center justify-center gap-3 p-5 text-center h-full">
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
        )}

        {category.categoryDescription && (
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

        <SeoCityLinks productName={categoryName} baseUrl={`/shop-by-category/${categorySlug}`} />
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
