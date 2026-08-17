import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Filter, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
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
import { useLocationStore } from "@/store/useLocationStore";
import { applySeoTemplate } from "@/lib/utils";

import { productSearchSchema, type ProductSearchState } from "@/lib/schemas/productSearchSchema";

export interface ProductsPageLayoutProps {
  search: ProductSearchState;
  onSearchChange: (newSearch: Partial<ProductSearchState>) => void;
  vehicleIdOverride?: string;
}

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
];

export function ProductsPageLayout({ search, onSearchChange, vehicleIdOverride }: ProductsPageLayoutProps) {

  const filters: ProductFilterState = {
    categoryId: search.categoryId,
    brandId: search.brandId,
    capacity: search.capacity,
    warranty: search.warranty,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
  };

  const params: ProductFilterParams = {
    ...filters,
    keyword: search.q,
    vehicleId: vehicleIdOverride ?? search.vehicleId,
    page: search.page,
    size: search.size,
    ...sortToApi(search.sort),
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery(productFilterQuery(params));

  const { data: brands } = useQuery(brandsQuery());
  const { data: categories } = useQuery(categoriesQuery());
  const { data: vehicles } = useQuery(vehiclesListQuery());
  
  const brand = (search.brandId && search.brandId.length > 0) ? brands?.find((b: any) => b.brandId === search.brandId?.[0]) : null;
  const category = (search.categoryId && search.categoryId.length > 0) ? categories?.find((c: any) => c.categoryId === search.categoryId?.[0]) : null;
  const activeVehicleId = vehicleIdOverride ?? search.vehicleId;
  const vehicle = activeVehicleId ? vehicles?.find((v: any) => v.vehicleId === activeVehicleId) : null;

  const { city } = useLocationStore();

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
          <ProductFilters state={filters} onChange={(newFilters) => onSearchChange({ ...newFilters, page: 0 })} products={products} />
        </aside>

        <div className="min-w-0">
          <DynamicSearchBanner search={search} />
          <div className="mb-4 flex items-center justify-between gap-3">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="h-4 w-4" /> Filters
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-white rounded-t-[24px] max-h-[85vh] outline-none">
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>
                <div className="mt-4 overflow-y-auto px-4 pb-8">
                  <ProductFilters state={filters} onChange={(newFilters) => onSearchChange({ ...newFilters, page: 0 })} products={products} />
                </div>
              </DrawerContent>
            </Drawer>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
              <Select value={search.sort} onValueChange={(v) => onSearchChange({ sort: v as ProductSort, page: 0 })}>
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
              <ActiveFilterBadges 
                filters={filters} 
                onRemove={(key, value) => {
                  if (key === 'minPrice' || key === 'maxPrice') {
                    onSearchChange({ [key]: undefined, page: 0 });
                  } else {
                    const current = (filters[key as keyof ProductFilterState] as string[]) || [];
                    onSearchChange({ [key]: current.filter(v => v !== value), page: 0 });
                  }
                }}
                onClearAll={() => onSearchChange({
                  categoryId: [],
                  brandId: [],
                  capacity: [],
                  warranty: [],
                  minPrice: undefined,
                  maxPrice: undefined,
                  page: 0
                })}
                brands={brands || []}
                categories={categories || []}
              />
              <ProductGrid products={products} loading={isLoading || isFetching} />

              {totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page <= 0}
                    onClick={() => onSearchChange({ page: search.page - 1 })}
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
                    onClick={() => onSearchChange({ page: search.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          )}
          
          {products.length > 0 && (
            <>
              {brand?.description && pageType === "BRAND" && (
                <div 
                  className="prose prose-sm md:prose-base max-w-none my-8 text-muted-foreground border-t pt-8"
                  dangerouslySetInnerHTML={{ 
                    __html: applySeoTemplate(brand.description, {
                      city: city?.cityName || "Delhi / NCR",
                      city_name: city?.cityName || "Delhi / NCR",
                      brand: brand.brandName || "",
                      brand_name: brand.brandName || "",
                      category: category?.categoryName || "Battery",
                      category_name: category?.categoryName || "Battery",
                    }) 
                  }}
                />
              )}
              
              {pageType === "BRAND_MODEL" && (
                <div className="prose prose-sm md:prose-base max-w-none my-8 text-muted-foreground border-t pt-8">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                    Battery For {context.brand_name} {context.model_name} in {city?.cityName || "Gurgaon"}
                  </h2>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Battery Solution For {context.brand_name} {context.model_name}
                  </h3>
                  <p className="mb-4">
                    The <strong>{context.brand_name} {context.model_name}</strong> is a stylish and powerful vehicle that requires the best automotive battery for a smooth and hassle-free journey. A healthy battery is crucial to keep your vehicle running efficiently for a long time.
                  </p>
                  <p className="mb-6">
                    You can find the finest batteries from top brands like Exide, Amaron, SF Sonic, and Livguard right here at Battery Mantra. A high-quality battery for your {context.brand_name} {context.model_name} in {city?.cityName || "Gurgaon"} ensures that the vehicle runs perfectly even in harsh weather conditions. It is impossible to drive your {context.brand_name} {context.model_name} safely without a healthy battery.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Buying {context.brand_name} {context.model_name} Battery Online
                  </h3>
                  <p className="mb-4">
                    It is easy to find <strong>{context.brand_name} {context.model_name}</strong> batteries near you through online authorized dealers like Battery Mantra. This platform is perfect for purchasing affordable, premium-quality batteries in {city?.cityName || "Delhi NCR"}. We provide the best offers and discounts for all {context.brand_name} models.
                  </p>
                  <p>
                    Battery Mantra provides home battery delivery within 1-2 Hours of your order. You get benefits like free installation, multiple payment options (cash on delivery, UPI, credit cards), and genuine manufacturer warranties. We provide the best battery replacement services so you do not have to go anywhere to buy a car battery.
                  </p>
                </div>
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

function ActiveFilterBadges({ 
  filters, 
  onRemove,
  onClearAll,
  brands, 
  categories 
}: { 
  filters: ProductFilterState; 
  onRemove: (key: string, value: any) => void;
  onClearAll: () => void;
  brands: any[];
  categories: any[];
}) {
  const findCatName = (cats: any[], id: string): string | undefined => {
    for (const c of cats) {
      if (c.categoryId === id) return c.categoryName;
      if (c.subCategories?.length) {
        const found = findCatName(c.subCategories, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeFilters: { key: string; value: any; label: string }[] = [];

  filters.categoryId?.forEach(id => {
    activeFilters.push({ key: 'categoryId', value: id, label: findCatName(categories, id) || id });
  });

  filters.brandId?.forEach(id => {
    const brand = brands.find(b => b.brandId === id);
    activeFilters.push({ key: 'brandId', value: id, label: brand?.brandName || id });
  });

  filters.capacity?.forEach(val => {
    activeFilters.push({ key: 'capacity', value: val, label: val });
  });

  filters.warranty?.forEach(val => {
    activeFilters.push({ key: 'warranty', value: val, label: val });
  });

  if (filters.minPrice != null || filters.maxPrice != null) {
    const min = filters.minPrice || 0;
    const max = filters.maxPrice || 50000;
    activeFilters.push({ key: 'price', value: null, label: `₹${min} - ₹${max}` });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {activeFilters.map((af, i) => (
        <Badge key={i} variant="secondary" className="flex items-center gap-1.5 px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20">
          {af.label}
          <button 
            type="button" 
            onClick={() => {
              if (af.key === 'price') {
                onRemove('minPrice', null);
                onRemove('maxPrice', null);
              } else {
                onRemove(af.key, af.value);
              }
            }} 
            className="hover:text-foreground p-0.5 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearAll}
        className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        Clear All
      </Button>
    </div>
  );
}
