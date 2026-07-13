import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bannersListQuery } from "@/queries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function BannerCarousel() {
  const { data: banners, isLoading } = useQuery(bannersListQuery());

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    
    // Simple autoplay since we don't have embla-carousel-autoplay installed
    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 5000);
    
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      clearInterval(interval);
    };
  }, [emblaApi, onSelect]);

  if (isLoading || !banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-12 mb-4 group">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex touch-pan-y touch-pinch-zoom">
          {banners.map((banner) => (
            <div key={banner.bannerId} className="flex-[0_0_100%] min-w-0 relative">
              {banner.linkUrl ? (
                <Link to={banner.linkUrl as any} className="block w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px]">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || "Promotional Banner"}
                    className="w-full h-full object-cover"
                  />
                </Link>
              ) : (
                <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px]">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || "Promotional Banner"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === selectedIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                )}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
