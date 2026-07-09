import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { featuredBrandsQuery, brandsQuery } from "@/queries";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";
import { Image } from "@/components/common/Image";
import { useRef, useEffect, useState, useCallback } from "react";

export function BrandStrip() {
  const featured = useQuery(featuredBrandsQuery());
  const all = useQuery(brandsQuery());

  const isLoading = featured.isLoading || (featured.isError && all.isLoading);
  const data =
    featured.data && featured.data.length > 0 ? featured.data : all.data ?? [];

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20 w-32 shrink-0" />
        ))}
      </div>
    );
  }
  if (data.length === 0) return null;

  return <InfiniteMarquee brands={data} />;
}

type Brand = { brandId: string; brandName: string; brandLogo?: string | null };

function InfiniteMarquee({ brands }: { brands: Brand[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const speedPx = 40; // pixels per second

  const animate = useCallback(
    (time: number) => {
      if (!trackRef.current) return;
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (!isPaused) {
        offsetRef.current -= speedPx * delta;

        // Get the width of one set of items (half the track since we duplicate)
        const halfWidth = trackRef.current.scrollWidth / 2;
        if (Math.abs(offsetRef.current) >= halfWidth) {
          offsetRef.current += halfWidth;
        }

        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [isPaused]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Reset lastTime when pausing/unpausing to prevent jumps
  useEffect(() => {
    lastTimeRef.current = 0;
  }, [isPaused]);

  return (
    <div
      className="relative flex w-full overflow-hidden py-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Edge Gradients for Premium Look */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />

      <div
        ref={trackRef}
        className="flex w-max gap-4 px-2 sm:gap-6 sm:px-3"
        style={{ willChange: "transform" }}
      >
        {/* Render brands twice for seamless loop */}
        {[...brands, ...brands].map((b, i) => (
          <Link
            key={`${b.brandId}-${i}`}
            to="/products"
            search={{ brandId: b.brandId }}
            className="group flex h-20 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-product sm:h-24 sm:w-40"
          >
            {b.brandLogo ? (
              <Image
                src={b.brandLogo}
                alt={b.brandName}
                aspect="auto"
                rounded={false}
                className="h-10 w-full bg-transparent sm:h-12"
              />
            ) : (
              <span className="font-display text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
                {b.brandName}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
