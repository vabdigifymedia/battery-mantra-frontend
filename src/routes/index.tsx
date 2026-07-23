import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BatteryCharging, Zap } from "lucide-react";
import { HeroSection } from "@/components/layout/HeroSection";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button } from "@/components/ui/button";
import { VehicleFinderWidget } from "@/components/home/VehicleFinderWidget";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ManufacturerGrid } from "@/components/home/ManufacturerGrid";
import { BrandStrip } from "@/components/home/BrandStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { DynamicFaq } from "@/components/seo/DynamicFaq";
import { CallbackBanner } from "@/components/home/CallbackBanner";
import {
  productListQuery,
  rootCategoriesQuery,
  featuredBrandsQuery,
  vehiclesListQuery,
  bannersListQuery,
} from "@/queries";
import { APP } from "@/constants/app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP.name} — ${APP.tagline}` },
      {
        name: "description",
        content:
          "Shop premium automotive, inverter and industrial batteries with free installation, exchange offers and India-wide delivery.",
      },
      { property: "og:title", content: APP.name },
      {
        property: "og:description",
        content:
          "Premium batteries with free installation, exchange offers and India-wide delivery.",
      },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(productListQuery());
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(featuredBrandsQuery());
    void context.queryClient.prefetchQuery(vehiclesListQuery());
    void context.queryClient.prefetchQuery(bannersListQuery());
  },
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-col">
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
          <section aria-labelledby="categories">
            <SectionHeading
              eyebrow="Browse"
              title={<span id="categories">Shop by category</span>}
              description="Pick from a curated catalogue of leading battery categories."
            />
            <div className="mt-6">
              <CategoryGrid />
            </div>
          </section>

          <section aria-labelledby="manufacturers" className="mt-12">
            <SectionHeading
              eyebrow="Find by Make"
              title={<span id="manufacturers">Shop by manufacturer</span>}
              description="Select your car manufacturer to find the perfect battery match."
            />
            <div className="mt-6">
              <ManufacturerGrid />
            </div>
          </section>
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
            title={<span id="featured">Featured batteries</span>}
            action={
              <Button asChild variant="ghost-brand">
                <Link to="/products">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <div className="mt-6">
            <FeaturedProducts limit={8} />
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

        <section aria-labelledby="faq" className="w-full">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
            {/* FAQ Accordion side */}
            <div className="space-y-6 order-2">
              <SectionHeading
                eyebrow="FAQ"
                title={<span id="faq">Questions, answered</span>}
                align="left"
              />
              <DynamicFaq pageType="UNIVERSAL" context={{}} hideHeading />
            </div>

            {/* Image side */}
            <div className="hidden lg:flex justify-center order-1">
              <img 
                src="/images/FAQ%20Side%20Image.png" 
                alt="FAQ" 
                className="w-48 sm:w-64 lg:w-full max-w-md xl:max-w-lg h-auto object-contain drop-shadow-2xl lg:scale-105" 
              />
            </div>
          </div>
        </section>
        </Container>
      </div>

      <div className="order-5 w-full">
        <CallbackBanner />
      </div>
    </div>
  );
}
