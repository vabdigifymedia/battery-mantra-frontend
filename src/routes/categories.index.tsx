import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { rootCategoriesQuery } from "@/queries";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/categories/")({
  component: CategoriesPage,
});

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

function CategoriesPage() {
  const { data: categories, isLoading } = useQuery(rootCategoriesQuery());
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title="All Categories"
        description="Browse our complete range of batteries and inverters"
      />
      <Container size="xl" className="py-6 px-4">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted rounded-xl h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
            {(categories || [])
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((c) => {
                const name = c.categoryName.toLowerCase();
                const isCar = name.includes("car");
                const isBike = name.includes("bike") || name.includes("two wheeler") || name.includes("2 wheeler");
                const rawSlug = c.categorySlug || toSlug(c.categoryName);

                let linkTo = "/products";
                let linkParams: any = { categoryId: c.categoryId };
                let linkSearch: any = {};

                if (c.subCategories && c.subCategories.length > 0) {
                  linkTo = "/categories/$categorySlug";
                  linkParams = { categorySlug: rawSlug };
                  linkSearch = undefined;
                } else if (isCar || isBike) {
                  linkTo = "/manufacturers/$categorySlug";
                  linkParams = { 
                    categorySlug: isCar 
                      ? (rawSlug.includes("car") ? rawSlug : "car-batteries") 
                      : (rawSlug.includes("bike") || rawSlug.includes("two-wheeler") ? rawSlug : "two-wheeler-batteries") 
                  };
                  linkSearch = undefined;
                } else {
                  linkSearch = { categoryId: c.categoryId };
                  linkParams = undefined;
                }

                return (
                  <Link
                    key={c.categoryId}
                    to={linkTo}
                    params={linkParams}
                    search={linkSearch}
                    className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 sm:p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-product"
                  >
                    <span className="grid h-12 w-12 sm:h-16 sm:w-16 place-items-center text-primary transition-transform group-hover:scale-110">
                      {c.iconUrl ? (
                        <img src={c.iconUrl} alt={c.categoryName} className="h-full w-full object-contain mix-blend-multiply" />
                      ) : (
                        <Layers className="h-6 w-6 sm:h-8 sm:w-8" />
                      )}
                    </span>
                    <span className="text-[11px] sm:text-sm font-medium text-foreground line-clamp-2 leading-tight">
                      {c.categoryName}
                    </span>
                  </Link>
                );
              })}
          </div>
        )}
      </Container>
    </div>
  );
}
