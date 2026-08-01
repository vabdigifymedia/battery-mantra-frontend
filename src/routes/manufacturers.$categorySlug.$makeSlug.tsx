import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { vehiclesListQuery, vehiclesSearchQuery, manufacturersListQuery } from "@/queries";
import { ChevronRight } from "lucide-react";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";
import { useLocationStore } from "@/store/useLocationStore";
import { replaceSeoVariables } from "@/lib/seo-variables";

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/manufacturers/$categorySlug/$makeSlug")({
  head: ({ params }) => {
    const makeName = params.makeSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const categoryName = params.categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    return buildPageHead(null, {
      title: `Buy ${makeName} ${categoryName} Online at Best Price | Battery Mantra`,
      description: `Find 100% compatible batteries for all ${makeName} vehicle models at guaranteed lowest prices. Free doorstep installation & 24/7 service on Battery Mantra.`,
    });
  },
  component: ManufacturerPage,
});

function ManufacturerPage() {
  const { categorySlug, makeSlug } = Route.useParams();
  const { city } = useLocationStore();

  // Find the exact manufacturer object to get the logo
  const { data: manufacturers } = useQuery(manufacturersListQuery());
  const manufacturer = manufacturers?.find(m => toSlug(m.name) === makeSlug);
  
  // Find the exact make string from vehicles list in case it differs slightly
  const { data: allVehicles } = useQuery(vehiclesListQuery());
  const exactMake = manufacturer?.name || allVehicles?.find(v => toSlug(v.make) === makeSlug)?.make || makeSlug;

  const { data: models, isLoading } = useQuery({
    ...vehiclesSearchQuery({ make: exactMake }),
    enabled: !!exactMake,
  });

  const categoryName = categorySlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const isBike = categorySlug.includes("bike") || categorySlug.includes("two-wheeler");
  const isCar = categorySlug.includes("car");
  const targetVehicleType = isBike ? "BIKE" : isCar ? "CAR" : null;

  const filteredModels = models?.filter(model => {
    if (!targetVehicleType) return true;
    return model.vehicleType === targetVehicleType;
  });

  return (
    <div className="flex flex-col gap-12">
      <Container size="xl" className="py-8 min-h-screen">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="capitalize">{categoryName}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{manufacturer?.name || exactMake}</span>
        </nav>

        {/* SEO Banner */}
        <div className="mb-10 border-2 border-dashed border-gray-200 rounded-3xl overflow-hidden py-6 px-8 relative bg-white shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            {manufacturer?.logoUrl && (
              <div className="shrink-0 bg-white p-2 rounded border shadow-sm">
                <img 
                  src={manufacturer.logoUrl} 
                  alt={`${manufacturer.name} Logo`} 
                  className="h-16 object-contain"
                />
              </div>
            )}
            <div className="flex flex-col items-center">
              <h1 className="text-2xl md:text-3xl font-bold uppercase text-foreground">
                {manufacturer?.name || exactMake} {categoryName}
              </h1>
              <p className="text-brand font-medium text-lg mt-2">
                With Battery Mantra, get {manufacturer?.name || exactMake} {categoryName} at best price
              </p>
            </div>
          </div>
        </div>



        {/* Grid of Models */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredModels?.map(model => (
              <Link
                key={model.vehicleId}
                to="/products"
                search={{ vehicleId: model.vehicleId }}
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="h-24 w-full flex items-center justify-center p-2">
                  {model.imageUrl ? (
                    <img 
                      src={model.imageUrl} 
                      alt={model.model} 
                      className="h-full object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted/20 rounded flex items-center justify-center text-xs text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground line-clamp-2">
                  {model.make} {model.model}
                </span>
              </Link>
            ))}
            {filteredModels?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No models found for {manufacturer?.name || exactMake}.
              </div>
            )}
          </div>
        )}

        {manufacturer?.description ? (
          <div 
            className="prose prose-sm md:prose-base max-w-none mt-12 mb-10 text-muted-foreground"
            dangerouslySetInnerHTML={{ 
              __html: replaceSeoVariables(manufacturer.description, {
                city: city?.cityName || "Delhi / NCR",
                City: city?.cityName || "Delhi / NCR",
                manufacturer: manufacturer.name || exactMake,
                category: categoryName,
              }) 
            }}
          />
        ) : (
          <p className="text-muted-foreground mt-12 mb-8 text-center max-w-2xl mx-auto">
            You will get all types of {isBike ? "two wheeler" : "car"} batteries for your {manufacturer?.name || exactMake} in Delhi With Free Delivery & Installation.
          </p>
        )}

        <SeoCityLinks productName={`${manufacturer?.name || exactMake} ${categoryName}`} />
      </Container>
      
      <GlobalFaqSection 
        pageType="MANUFACTURER" 
        context={{
          manufacturer_name: manufacturer?.name || exactMake,
          category_name: categoryName
        }} 
      />
    </div>
  );
}
