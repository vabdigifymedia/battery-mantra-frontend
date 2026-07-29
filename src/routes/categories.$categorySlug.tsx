import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { rootCategoriesQuery, pageSeoQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { DynamicSearchBanner } from "@/components/products/DynamicSearchBanner";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";
import { ErrorState } from "@/components/feedback/ErrorState";

const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

export const Route = createFileRoute("/categories/$categorySlug")({
  loader: async ({ context, params }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery(`/categories/${params.categorySlug}`));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData, params }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: `Shop ${params.categorySlug.replace(/-/g, " ")} — BatteryMantra`,
      description: `Browse premium subcategories for ${params.categorySlug.replace(/-/g, " ")} from trusted brands.`,
    }),
  component: SubcategoriesPage,
});

function SubcategoriesPage() {
  const { categorySlug } = Route.useParams();
  const { data, isLoading, isError, refetch } = useQuery(rootCategoriesQuery());
  const navigate = useNavigate();

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

  const category = data.find((c) => (c.categorySlug || toSlug(c.categoryName)) === categorySlug);

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

  return (
    <div>
      <PageHeader
        title={category.categoryName}
        description={category.categoryDescription || `Select a subcategory to view products.`}
      />
      <Container size="xl" className="py-8">
        <div className="mb-8">
          <DynamicSearchBanner search={{ categoryId: category.categoryId }} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {sorted.map((c) => {
            const name = c.categoryName.toLowerCase();
            const isCar = name.includes("car");
            const isBike = name.includes("bike") || name.includes("two wheeler") || name.includes("2 wheeler");
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

            const cardClassName = "group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-product";

            if (isCar || isBike) {
              const catSlug = isCar
                ? (rawSlug.includes("car") ? rawSlug : "car-batteries")
                : (rawSlug.includes("bike") || rawSlug.includes("two-wheeler") ? rawSlug : "two-wheeler-batteries");

              return (
                <Link
                  key={c.categoryId}
                  to="/manufacturers/$categorySlug"
                  params={{ categorySlug: catSlug }}
                  className={cardClassName}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <Link
                key={c.categoryId}
                to="/products"
                search={{ categoryId: c.categoryId }}
                className={cardClassName}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
