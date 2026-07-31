import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Filter } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGrid } from "@/components/products/ProductGrid";
import {
  ProductFilters,
  sortToApi,
  type ProductFilterState,
  type ProductSort,
} from "@/components/products/ProductFilters";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  productListQuery,
  productFilterQuery,
  rootCategoriesQuery,
  brandsQuery,
  pageSeoQuery,
  categoriesQuery,
  vehiclesListQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import type { ProductFilterParams } from "@/types/dto";
import { DynamicSearchBanner } from "@/components/products/DynamicSearchBanner";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
import { SeoPriceTable } from "@/components/products/SeoPriceTable";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";

const searchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  vehicleId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(1).max(60).optional().default(20),
  sort: z.enum(["relevance", "price-asc", "price-desc", "name-asc", "name-desc"]).optional().default("relevance"),
});

export const Route = createFileRoute("/products/")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());

    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/products"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: "Shop batteries — BatteryMantra",
      description: "Browse premium automotive, inverter and industrial batteries from trusted brands.",
    }),
  validateSearch: searchSchema,
  component: ProductsPage,
});

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
];

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });

  const filters: ProductFilterState = {
    categoryId: search.categoryId,
    brandId: search.brandId,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
  };

  const params: ProductFilterParams = {
    ...filters,
    vehicleId: search.vehicleId,
    keyword: search.q,
    page: search.page,
    size: search.size,
    ...sortToApi(search.sort),
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery(productFilterQuery(params));

  const { data: brands } = useQuery(brandsQuery());
  const { data: categories } = useQuery(categoriesQuery());
  const { data: vehicles } = useQuery(vehiclesListQuery());
  
  const brand = search.brandId ? brands?.find((b: any) => b.brandId === search.brandId) : null;
  const category = search.categoryId ? categories?.find((c: any) => c.categoryId === search.categoryId) : null;
  const vehicle = search.vehicleId ? vehicles?.find((v: any) => v.vehicleId === search.vehicleId) : null;

  let pageType: "UNIVERSAL" | "CATEGORY" | "BRAND" | "BRAND_MODEL" = "UNIVERSAL";
  let context: Record<string, string> = {};

  if (vehicle) {
    pageType = "BRAND_MODEL";
    context = { model_name: vehicle.model, brand_name: vehicle.make, category_name: category?.categoryName || "Battery" };
  } else if (brand) {
    pageType = "BRAND";
    context = { brand_name: brand.brandName, category_name: category?.categoryName || "Battery" };
  } else if (category) {
    pageType = "CATEGORY";
    context = { category_name: category.categoryName };
  }

  type SearchState = typeof search;
  const setFilters = (next: ProductFilterState) => {
    navigate({
      search: (prev: SearchState) => ({
        ...prev,
        categoryId: next.categoryId,
        brandId: next.brandId,
        minPrice: next.minPrice,
        maxPrice: next.maxPrice,
        page: 0,
      }),
    });
  };

  const setSort = (s: ProductSort) =>
    navigate({ search: (prev: SearchState) => ({ ...prev, sort: s, page: 0 }) });
  const setPage = (p: number) =>
    navigate({ search: (prev: SearchState) => ({ ...prev, page: p }) });

  const products = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div>
      <PageHeader
        title="Shop batteries"
        description={
          isLoading
            ? "Loading the catalogue…"
            : `${total} product${total === 1 ? "" : "s"}${search.q ? ` for "${search.q}"` : ""}`
        }
      />
      <Container size="xl" className="grid gap-8 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <ProductFilters state={filters} onChange={setFilters} />
        </aside>

        <div className="min-w-0">
          <DynamicSearchBanner search={search} />
          <div className="mb-4 flex items-center justify-between gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <ProductFilters state={filters} onChange={setFilters} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
              <Select value={search.sort} onValueChange={(v) => setSort(v as ProductSort)}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isError ? (
            <ErrorState
              title="Couldn't load products"
              description="Please try again in a moment."
              onRetry={() => void refetch()}
            />
          ) : (
            <>
              <ProductGrid products={products} loading={isLoading || isFetching} />

              {totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page <= 0}
                    onClick={() => setPage(Math.max(0, search.page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {search.page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page >= totalPages - 1}
                    onClick={() => setPage(search.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          )}
          
          {products.length > 0 && (
            <>
              {brand?.description && (
                <div 
                  className="prose prose-sm md:prose-base max-w-none my-8 text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: brand.description }}
                />
              )}
              <SeoPriceTable 
                products={products} 
                title={`Price List, Capacity, Warranty Details for Best ${
                  pageType === "BRAND_MODEL" 
                    ? `${context.brand_name} ${context.model_name}` 
                    : pageType === "BRAND" 
                    ? context.brand_name 
                    : ""
                } ${context.category_name || "Batteries"} offered`} 
              />
              
              <SeoCityLinks 
                productName={`${
                  pageType === "BRAND_MODEL" 
                    ? `${context.brand_name} ${context.model_name}` 
                    : pageType === "BRAND" 
                    ? context.brand_name 
                    : ""
                } ${context.category_name || "Batteries"}`.trim()} 
              />
            </>
          )}
        </div>
      </Container>
      
      <GlobalFaqSection pageType={pageType} context={context} />
    </div>
  );
}
