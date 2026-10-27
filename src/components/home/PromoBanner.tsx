import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { bannersListQuery } from "@/queries";
import { useIsMobile } from "@/hooks/use-mobile";
import { parseBannerTitle, type BannerPlacement } from "@/lib/banner-utils";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  placement: BannerPlacement;
  className?: string;
  imageClassName?: string;
}

export function PromoBanner({ placement, className, imageClassName }: PromoBannerProps) {
  const { data } = useQuery(bannersListQuery());
  const isMobile = useIsMobile();

  const allBanners: any[] = Array.isArray(data) ? data : (data as any)?.content || [];

  const matchedBanners = useMemo(() => {
    if (!allBanners.length) return [];
    const target = isMobile ? "MOBILE" : "DESKTOP";

    // Filter banners matching this specific placement
    const slotBanners = allBanners.filter((b) => {
      if (!b.isActive) return false;
      return parseBannerTitle(b.title).placement === placement;
    });

    if (!slotBanners.length) return [];

    // Filter by device
    const deviceSpecific = slotBanners.filter(
      (b) => parseBannerTitle(b.title).deviceType === target
    );
    const universal = slotBanners.filter(
      (b) => parseBannerTitle(b.title).deviceType === "ALL"
    );

    const result = [...deviceSpecific, ...universal].sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    return result.length > 0 ? result : slotBanners;
  }, [allBanners, isMobile, placement]);

  if (!matchedBanners.length) {
    return null;
  }

  // Display the top priority active banner for this slot
  const banner = matchedBanners[0];
  const { cleanTitle } = parseBannerTitle(banner.title);
  const link = banner.linkUrl?.trim();
  const isExternal = link && (link.startsWith("http://") || link.startsWith("https://"));

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl sm:rounded-2xl border bg-muted/20 shadow-xs hover:shadow-md transition-all duration-300",
        className
      )}
    >
      <img
        src={banner.imageUrl}
        alt={cleanTitle || "Promotional Banner"}
        className={cn(
          "w-full h-auto max-h-[140px] sm:max-h-[220px] md:max-h-[300px] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]",
          imageClassName
        )}
        loading="lazy"
      />
    </div>
  );

  if (!link) {
    return content;
  }

  if (isExternal) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl sm:rounded-2xl"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={link as any}
      className="block cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl sm:rounded-2xl"
    >
      {content}
    </Link>
  );
}
