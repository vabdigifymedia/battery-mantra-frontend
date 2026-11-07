import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { productListQuery, vehiclesListQuery } from "@/queries";
import { ProductCard } from "@/components/products/ProductCard";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSmartRecommendations,
  type ScoredProduct,
} from "@/lib/recommendations";
import type { ProductDetailResponse } from "@/types/dto";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Car,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRecommendationSectionProps {
  currentProduct: ProductDetailResponse;
  className?: string;
}

export function ProductRecommendationSection({
  currentProduct,
  className,
}: ProductRecommendationSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"all" | "alternatives" | "brand" | "vehicles">("all");

  const { data: allProducts, isLoading: isLoadingProducts } = useQuery(productListQuery());
  const { data: vehicles } = useQuery(vehiclesListQuery());

  const buckets = useMemo(() => {
    return getSmartRecommendations(allProducts, currentProduct, vehicles);
  }, [allProducts, currentProduct, vehicles]);

  const {
    directAlternatives,
    sameBrandOptions,
    compatibleFitments,
    allRecommended,
    currentCapacityLabel,
  } = buckets;

  // Decide active items based on tab
  const activeItems: ScoredProduct[] = useMemo(() => {
    switch (activeTab) {
      case "alternatives":
        return directAlternatives.length > 0 ? directAlternatives : allRecommended;
      case "brand":
        return sameBrandOptions.length > 0 ? sameBrandOptions : allRecommended;
      case "vehicles":
        return compatibleFitments.length > 0 ? compatibleFitments : allRecommended;
      case "all":
      default:
        return allRecommended;
    }
  }, [activeTab, directAlternatives, sameBrandOptions, compatibleFitments, allRecommended]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // If loading or no relevant items in the same category exist, render nothing (Strict Zero Cross-Category Pollution)
  if (!isLoadingProducts && allRecommended.length === 0) {
    return null;
  }

  const hasTabs =
    (directAlternatives.length > 0 ? 1 : 0) +
    (sameBrandOptions.length > 0 ? 1 : 0) +
    (compatibleFitments.length > 0 ? 1 : 0) >= 1;

  return (
    <Container size="xl" className={cn("mt-12 sm:mt-16 border-t pt-8 sm:pt-12", className)}>
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Handpicked Matches
            </span>
            {currentProduct.categoryName && (
              <Badge variant="outline" className="text-[11px] font-medium py-0 h-5">
                {currentProduct.categoryName}
              </Badge>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {activeTab === "alternatives" && currentCapacityLabel
              ? `Direct ${currentCapacityLabel} Alternatives`
              : activeTab === "brand" && currentProduct.brandName
              ? `More Options from ${currentProduct.brandName}`
              : activeTab === "vehicles"
              ? "Verified Car Compatible Batteries"
              : "Recommended for You"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Verified direct fitments and top-rated options with doorstep delivery &amp; free installation.
          </p>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shadow-sm hover:bg-muted"
            onClick={() => scroll("left")}
            aria-label="Scroll recommendations left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shadow-sm hover:bg-muted"
            onClick={() => scroll("right")}
            aria-label="Scroll recommendations right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs if multiple intent buckets exist */}
      {hasTabs && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide pb-3 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
              activeTab === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-surface hover:bg-muted text-muted-foreground hover:text-foreground border-border"
            )}
          >
            All Matches ({allRecommended.length})
          </button>

          {directAlternatives.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("alternatives")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
                activeTab === "alternatives"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-surface hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              )}
            >
              <Layers className="h-3 w-3" />
              Direct Alternatives {currentCapacityLabel ? `(${currentCapacityLabel})` : ""} ({directAlternatives.length})
            </button>
          )}

          {sameBrandOptions.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("brand")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
                activeTab === "brand"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-surface hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              )}
            >
              <ShieldCheck className="h-3 w-3" />
              {currentProduct.brandName || "Brand"} Variants ({sameBrandOptions.length})
            </button>
          )}

          {compatibleFitments.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("vehicles")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
                activeTab === "vehicles"
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-surface hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              )}
            >
              <Car className="h-3 w-3" />
              Car Fitments ({compatibleFitments.length})
            </button>
          )}
        </div>
      )}

      {/* Recommendations Carousel */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
      >
        {activeItems.map(({ product, badge, badgeVariant }) => (
          <div
            key={product.productId}
            className="min-w-[220px] w-[220px] sm:min-w-[260px] sm:w-[260px] shrink-0 snap-start flex flex-col relative group"
          >
            {/* Contextual Match Pill */}
            {badge && (
              <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-sm border backdrop-blur-md",
                    badgeVariant === "emerald"
                      ? "bg-emerald-500/90 text-white border-emerald-400"
                      : badgeVariant === "blue"
                      ? "bg-blue-500/90 text-white border-blue-400"
                      : badgeVariant === "purple"
                      ? "bg-purple-500/90 text-white border-purple-400"
                      : "bg-background/95 text-foreground border-border"
                  )}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {badge}
                </span>
              </div>
            )}
            <ProductCard product={product} className="h-full" />
          </div>
        ))}
      </div>
    </Container>
  );
}

