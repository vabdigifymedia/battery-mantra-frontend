import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BatteryCharging, Zap } from "lucide-react";
import { HeroSection } from "@/components/layout/HeroSection";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button } from "@/components/ui/button";
import { VehicleFinderWidget } from "@/components/home/VehicleFinderWidget";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ManufacturerGrid } from "@/components/home/ManufacturerGrid";
import { HomeCategoryPills } from "@/components/home/HomeCategoryPills";
import { BrandStrip } from "@/components/home/BrandStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { GlobalFaqSection } from "@/components/seo/GlobalFaqSection";

import { CallbackBanner } from "@/components/home/CallbackBanner";
import {
  productListQuery,
  rootCategoriesQuery,
  featuredBrandsQuery,
  vehiclesListQuery,
  bannersListQuery,
  pageSeoQuery,
} from "@/queries";
import { APP } from "@/constants/app";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(productListQuery());
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(featuredBrandsQuery());
    void context.queryClient.prefetchQuery(vehiclesListQuery());
    void context.queryClient.prefetchQuery(bannersListQuery());
    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: `${APP.name} — ${APP.tagline}`,
      description:
        "Shop premium automotive, inverter and industrial batteries with free installation, exchange offers and India-wide delivery.",
    }),
  component: HomePage,
});

function HomePage() {
  const { data: categories } = useQuery(rootCategoriesQuery());

  const carCategory = categories?.find((c) =>
    c.categoryName.toLowerCase().includes("car")
  );
  const bikeCategory = categories?.find((c) => {
    const name = c.categoryName.toLowerCase();
    return name.includes("bike") || name.includes("two wheeler");
  });
  const inverterCategory = categories?.find((c) =>
    c.categoryName.toLowerCase().includes("inverter batter")
  ) || categories?.find((c) =>
    c.categoryName.toLowerCase().includes("inverter")
  );

  const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col">
      <div className="order-1">
        <HomeCategoryPills />
      </div>

      <div className="order-3 lg:order-1">
        <HeroSection
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3 w-3" /> Genuine batteries · Free fitment
            </span>
          }
          title={
            <>
              India&apos;s most trusted
              <br />
              <span className="text-primary">battery store</span>
            </>
          }
          description="Find the right battery for any car, bike, inverter or commercial vehicle — delivered and installed at your doorstep."
          primaryAction={
            <Button asChild variant="brand" size="lg">
              <Link to="/products">
                Shop batteries <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
          secondaryAction={
            <Button asChild variant="brand-outline" size="lg">
              <Link to="/vehicle-finder">
                <BatteryCharging className="h-4 w-4" /> Find by vehicle
              </Link>
            </Button>
          }
          media={<VehicleFinderWidget />}
        />
      </div>

      <div className="order-1 lg:order-2">
        <BannerCarousel />
      </div>

      <div className="order-2 lg:order-3 w-full bg-background pt-6 lg:pt-12">
        <Container size="xl">
          <section aria-labelledby="categories" className="hidden sm:block">
            <SectionHeading
              eyebrow="Browse"
              title={<span id="categories">Shop by category</span>}
              description="Pick from a curated catalogue of leading battery categories."
            />
            <div className="mt-6">
              <CategoryGrid />
            </div>
          </section>

          {carCategory && (
            <section aria-labelledby="car-manufacturers" className="mt-12">
              <SectionHeading
                eyebrow="Find by Make"
                title={<span id="car-manufacturers">Shop by car manufacturer</span>}
                description="Select your car manufacturer to find the perfect battery match."
                action={
                  <Button asChild variant="ghost-brand" size="sm">
                    <Link to="/manufacturers/$categorySlug" params={{ categorySlug: carCategory.categorySlug || "car-batteries" }}>
                      View all <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                }
              />
              <div className="mt-6">
                <ManufacturerGrid categoryId={carCategory.categoryId} categorySlug={carCategory.categorySlug || "car-batteries"} limit={6} />
              </div>
            </section>
          )}

          {bikeCategory && (
            <section aria-labelledby="bike-manufacturers" className="mt-12">
              <SectionHeading
                eyebrow="Find by Make"
                title={<span id="bike-manufacturers">Shop by bike manufacturer</span>}
                description="Select your bike manufacturer to find the perfect battery match."
                action={
                  <Button asChild variant="ghost-brand" size="sm">
                    <Link to="/manufacturers/$categorySlug" params={{ categorySlug: bikeCategory.categorySlug || "two-wheeler-batteries" }}>
                      View all <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                }
              />
              <div className="mt-6">
                <ManufacturerGrid categoryId={bikeCategory.categoryId} categorySlug={bikeCategory.categorySlug || "two-wheeler-batteries"} limit={6} />
              </div>
            </section>
          )}
        </Container>
      </div>

      <div className="order-4 w-full">
        <Container size="xl" className="space-y-16 py-12 sm:py-16">
          <section aria-labelledby="brands">
            <SectionHeading
              eyebrow="Trusted brands"
              title={<span id="brands">Top battery brands</span>}
            />
            <div className="mt-6">
              <BrandStrip />
            </div>
          </section>

          <section aria-labelledby="featured">
            <SectionHeading
              eyebrow="Best of"
              title={<span id="featured">Featured automotive batteries</span>}
              action={
                carCategory && (
                  <Button asChild variant="ghost-brand">
                    <Link to="/shop/c/$categorySlug" params={{ categorySlug: toSlug(carCategory.categoryName) }}>
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )
              }
            />
            <div className="mt-6">
              <FeaturedProducts 
                limit={8} 
                filterFn={(p) => {
                  const cat = p.productCategory?.toLowerCase() || "";
                  const name = p.productName.toLowerCase();
                  return !cat.includes("inverter") && !name.includes("inverter");
                }}
              />
            </div>
          </section>

          <section aria-labelledby="inverter" className="mt-16">
            <SectionHeading
              eyebrow="Power Backup"
              title={<span id="inverter">Inverter Batteries</span>}
              description="Reliable inverter batteries for uninterrupted power."
              action={
                inverterCategory && (
                  <Button asChild variant="ghost-brand">
                    <Link to="/shop/c/$categorySlug" params={{ categorySlug: toSlug(inverterCategory.categoryName) }}>
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )
              }
            />
            <div className="mt-6">
              <FeaturedProducts 
                limit={8} 
                filterFn={(p) => {
                  const cat = p.productCategory?.toLowerCase() || "";
                  const name = p.productName.toLowerCase();
                  // It must be an inverter battery, not a machine.
                  // If category or name implies it's an inverter, ensure it also implies it's a battery
                  return (cat.includes("inverter") || name.includes("inverter")) && (cat.includes("batter") || name.includes("batter"));
                }}
              />
            </div>
          </section>

          <section aria-labelledby="deals" className="mt-16">
            <SectionHeading
              eyebrow="Mega Savings"
              title={<span id="deals">Best Scrap Exchange Deals</span>}
              description="Exchange your old scrap battery and get maximum discount instantly."
              action={
                <Button asChild variant="ghost-brand">
                  <Link to="/products">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-6">
              <FeaturedProducts 
                limit={8} 
                filterFn={(p) => Boolean(p.exchangeDiscount && p.exchangeDiscount > 0)}
                sortFn={(a, b) => (b.exchangeDiscount || 0) - (a.exchangeDiscount || 0)}
              />
            </div>
          </section>

          <section aria-labelledby="why">
            <SectionHeading
              eyebrow="Why BatteryMantra"
              title={<span id="why">Built for confidence</span>}
              align="center"
            />
            <div className="mt-8">
              <WhyChooseUs />
            </div>
          </section>
        </Container>
      </div>

      <div className="order-6 w-full">
        <GlobalFaqSection />
      </div>

      <div className="order-5 w-full">
        <CallbackBanner />
      </div>
    </div>
  );
}
