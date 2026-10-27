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
  const rawLink = banner.linkUrl?.trim() || "";

  const isExternal =
    rawLink.startsWith("http://") ||
    rawLink.startsWith("https://") ||
    rawLink.startsWith("//") ||
    rawLink.startsWith("tel:") ||
    rawLink.startsWith("mailto:");

  const normalizedInternalLink = !isExternal && rawLink && !rawLink.startsWith("/")
    ? `/${rawLink}`
    : rawLink;

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/60 bg-muted/20 shadow-xs hover:shadow-md transition-all duration-300",
        rawLink && "cursor-pointer",
        className
      )}
    >
      <img
        src={banner.imageUrl}
        alt={cleanTitle || "Promotional Banner"}
        className={cn(
          "w-full h-auto max-h-[160px] sm:max-h-[240px] md:max-h-[320px] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]",
          imageClassName
        )}
        loading="lazy"
      />
    </div>
  );

  if (!rawLink) {
    return content;
  }

  if (isExternal) {
    return (
      <a
        href={rawLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={cleanTitle || "Promotional Banner"}
        className="block rounded-xl sm:rounded-2xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-transform"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={normalizedInternalLink as any}
      aria-label={cleanTitle || "Promotional Banner"}
      className="block rounded-xl sm:rounded-2xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-transform"
    >
      {content}
    </Link>
  );
}
