import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight, X, Copy, Check } from "lucide-react";
import { activeCampaignsQuery } from "@/queries";
import { getCampaignThemeStyles, formatCampaignDiscountLabel } from "@/lib/campaign-utils";
import { CampaignCountdown } from "./CampaignCountdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CampaignAnnouncementBar() {
  const { data: campaigns } = useQuery(activeCampaignsQuery());
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_campaign_id");
      if (stored) {
        setDismissedId(stored);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  // Get top active campaign that wants to be shown in announcement
  const activeCampaign = campaigns
    ?.filter((c) => c.showInAnnouncement && c.isActive)
    ?.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

  if (!activeCampaign) return null;
  if (dismissedId === activeCampaign.id) return null;

  const styles = getCampaignThemeStyles(activeCampaign.badgeTheme);
  const discountLabel = formatCampaignDiscountLabel(activeCampaign);

  const handleDismiss = () => {
    setDismissedId(activeCampaign.id);
    try {
      sessionStorage.setItem("dismissed_campaign_id", activeCampaign.id);
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
        "relative z-50 w-full text-xs sm:text-sm font-medium border-b shadow-xs transition-all select-none",
        styles.barBg
      )}
    >
      {/* MOBILE VIEW (Strictly 1 Line, No Wrapping) */}
      <div className="flex sm:hidden items-center justify-between h-9 px-2.5 w-full gap-2 overflow-hidden">
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

        <div className="flex items-center gap-1 shrink-0">
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

      {/* DESKTOP VIEW (>= sm screens) */}
      <div className="hidden sm:flex container mx-auto items-center justify-between px-4 py-2 gap-3 text-center">
        <div className="flex-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {/* Festive Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-sm",
              styles.badgeBg
            )}
          >
            <Sparkles className="w-3 h-3 animate-spin-slow" />
            {activeCampaign.badgeText || "Special Offer"}
          </span>

          {/* Campaign Name & Tagline */}
          <span className="font-semibold text-white/95 inline-flex items-center gap-1.5">
            <span className="font-bold">{activeCampaign.name}:</span>
            <span className={styles.accentText}>{activeCampaign.tagline || discountLabel}</span>
          </span>

          {/* Optional Coupon Code Chip */}
          {activeCampaign.couponCode && (
            <button
              type="button"
              onClick={handleCopyCoupon}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/20 bg-white/10 hover:bg-white/20 font-mono text-[11px] font-bold text-white transition-colors cursor-pointer"
              title="Click to copy coupon code"
            >
              Use Code: <span className="underline decoration-dotted">{activeCampaign.couponCode}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-70" />}
            </button>
          )}

          {/* Live Countdown Timer if enabled */}
          {activeCampaign.showCountdown && (
            <div className="hidden md:inline-flex items-center pl-1">
              <CampaignCountdown endDate={activeCampaign.endDate} variant="compact" />
            </div>
          )}

          {/* CTA Link to Offer Landing Page */}
          <Link
            to="/offers/$slug"
            params={{ slug: activeCampaign.slug }}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xs whitespace-nowrap",
              styles.buttonVariant
            )}
          >
            Explore Deals <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss offer banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
