import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { locationService } from "@/services/location.service";
import { Container } from "@/components/layout/Container";
import { rootCategoriesQuery, manufacturersListQuery, brandsQuery } from "@/queries";
import { ChevronRight, Car, Tag } from "lucide-react";
import { GradientBlobCard } from "@/components/ui/gradient-blob-card";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
import { DynamicSearchBanner } from "@/components/products/DynamicSearchBanner";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";
import { applySeoTemplate } from "@/lib/utils";
import { useLocationStore } from "@/store/useLocationStore";

const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

export function CategoryManufacturersPage({ categorySlug, citySlug }: { categorySlug: string, citySlug: string }) {
  const { city, pincode, setLocation } = useLocationStore();

  useEffect(() => {
    if (citySlug) {
      const currentCitySlug = city?.cityName?.toLowerCase().replace(/\s+/g, '-');
      if (currentCitySlug !== citySlug.toLowerCase()) {
        locationService.getPublicCities().then(cities => {
          const matchedCity = cities.find(c => c.cityName?.toLowerCase().replace(/\s+/g, '-') === citySlug.toLowerCase());
          if (matchedCity) {
            setLocation(pincode || "", true, matchedCity);
          }
        }).catch(console.error);
      }
    }
  }, [citySlug, city?.cityName, pincode, setLocation]);

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

  const categoryName =
    category?.categoryName ||
    categorySlug
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const { data: categoryMfrs, isLoading: isLoadingCatMfrs } = useQuery({
    ...manufacturersListQuery(category?.categoryId),
    enabled: !!category?.categoryId,
  });

  const hasSpecificMfrs = categoryMfrs && categoryMfrs.length > 0;

  const { data: brands = [], isLoading: isLoadingBrands } = useQuery({
    ...brandsQuery(category?.categoryId),
    enabled: !!category?.categoryId || !hasSpecificMfrs,
  });

  const isLoading = isLoadingCatMfrs || isLoadingBrands;
  const FallbackIcon = Car;

  return (
    <div className="flex flex-col gap-12">
      <Container size="xl" className="py-8 min-h-screen">
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

        <DynamicSearchBanner search={{ categoryId: category?.categoryId }} />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border bg-card p-4 animate-pulse" />
            ))}
          </div>
        ) : hasSpecificMfrs ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...categoryMfrs]
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {brands.filter((b) => b.productCount === undefined || b.productCount > 0).map((b) => (
              <Link
                key={b.brandId}
                to="/shop/$categorySlug/$brandSlug"
                params={{ categorySlug, brandSlug: toSlug(b.brandName) }}
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

        <SeoCityLinks productName={categoryName} baseUrl={`/manufacturers/${categorySlug}`} />
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
