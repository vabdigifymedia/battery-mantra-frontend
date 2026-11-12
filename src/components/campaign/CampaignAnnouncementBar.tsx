import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight, X, Copy, Check } from "lucide-react";
import { activeCampaignsQuery } from "@/queries";
import { getCampaignThemeStyles, formatCampaignDiscountLabel, compareCampaignPriority } from "@/lib/campaign-utils";
import { CampaignCountdown } from "./CampaignCountdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CampaignAnnouncementBar({ className }: { className?: string } = {}) {
  const { data: campaigns } = useQuery(activeCampaignsQuery());
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Check session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_announcements");
      if (stored === "true") {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // All active campaigns enabled for announcement bar (Priority 1 first, Priority 2 next...)
  const announcementCampaigns = useMemo(() => {
    return (campaigns || [])
      .filter((c) => c.showInAnnouncement && c.isActive)
      .sort(compareCampaignPriority);
  }, [campaigns]);

  // Keep index within bounds
  const validIndex = activeIndex < announcementCampaigns.length ? activeIndex : 0;
  const activeCampaign = announcementCampaigns[validIndex];

  // Auto-rotate announcement every 3.5 seconds cleanly
  useEffect(() => {
    if (announcementCampaigns.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % announcementCampaigns.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [announcementCampaigns.length, validIndex]);

  if (!activeCampaign || announcementCampaigns.length === 0 || isDismissed) return null;

  const styles = getCampaignThemeStyles(activeCampaign.badgeTheme);
  const discountLabel = formatCampaignDiscountLabel(activeCampaign);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("dismissed_announcements", "true");
    } catch {
      // ignore
    }
  };

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeCampaign.couponCode) return;
    navigator.clipboard.writeText(activeCampaign.couponCode);
    setCopied(true);
    toast.success(`Coupon code ${activeCampaign.couponCode} copied!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={cn(
        "relative z-50 w-full h-8.5 sm:h-9 text-xs sm:text-sm font-medium border-b shadow-xs transition-colors duration-500 select-none overflow-hidden flex items-center justify-center px-3 sm:px-6",
        styles.barBg,
        className
      )}
    >
      {/* MOBILE VIEW (Strictly 1 Line, No Wrapping, Slim) */}
      <div className="flex sm:hidden items-center justify-between w-full gap-2 overflow-hidden">
        <div
          key={activeCampaign.id || activeCampaign.slug}
          className="flex items-center gap-1.5 min-w-0 flex-1 animate-in fade-in duration-300 overflow-hidden"
        >
          <Link
            to="/offers/$slug"
            params={{ slug: activeCampaign.slug }}
            className="flex items-center gap-1.5 min-w-0 flex-1"
          >
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight shrink-0 shadow-xs",
                styles.badgeBg
              )}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {activeCampaign.badgeText || "OFFER"}
            </span>
            <span className="truncate text-[11px] font-bold text-white">
              {activeCampaign.tagline || activeCampaign.name || discountLabel}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/offers/$slug"
            params={{ slug: activeCampaign.slug }}
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs whitespace-nowrap",
              styles.buttonVariant
            )}
          >
            Shop <ArrowRight className="w-2.5 h-2.5" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* DESKTOP VIEW (Strictly 1 Line, Centered, Slim) */}
      <div className="hidden sm:flex items-center justify-center w-full relative">
        <div
          key={activeCampaign.id || activeCampaign.slug}
          className="flex items-center justify-center gap-2.5 text-xs lg:text-sm animate-in fade-in duration-300 whitespace-nowrap overflow-hidden"
        >
          {/* Festive Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs shrink-0",
              styles.badgeBg
            )}
          >
            <Sparkles className="w-3 h-3" />
            {activeCampaign.badgeText || "Special Offer"}
          </span>

          {/* Campaign Name & Tagline */}
          <span className="font-semibold text-white/95 inline-flex items-center gap-1.5 truncate">
            <span className="font-bold text-white">{activeCampaign.name}:</span>
            <span className={styles.accentText}>{activeCampaign.tagline || discountLabel}</span>
          </span>

          {/* Optional Coupon Code Chip */}
          {activeCampaign.couponCode && (
            <button
              type="button"
              onClick={handleCopyCoupon}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/20 bg-white/10 hover:bg-white/20 font-mono text-[10px] font-bold text-white transition-colors cursor-pointer shrink-0"
              title="Click to copy coupon code"
            >
              Use Code: <span className="underline decoration-dotted">{activeCampaign.couponCode}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-70" />}
            </button>
          )}

          {/* Live Countdown Timer if enabled */}
          {activeCampaign.showCountdown && (
            <div className="hidden lg:inline-flex items-center shrink-0">
              <CampaignCountdown endDate={activeCampaign.endDate} variant="compact" />
            </div>
          )}

          {/* CTA Link to Offer Landing Page */}
          <Link
            to="/offers/$slug"
            params={{ slug: activeCampaign.slug }}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all hover:scale-105 active:scale-95 shadow-xs whitespace-nowrap shrink-0",
              styles.buttonVariant
            )}
          >
            Explore Deals <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Dismiss Button - Anchored to Right */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-0 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss offer banner"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
