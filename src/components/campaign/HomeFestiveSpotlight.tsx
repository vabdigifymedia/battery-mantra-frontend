import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Flame, Copy, Check, Tag } from "lucide-react";
import { activeCampaignsQuery, campaignBySlugQuery } from "@/queries";
import { getCampaignThemeStyles, formatCampaignDiscountLabel } from "@/lib/campaign-utils";
import { CampaignCountdown } from "./CampaignCountdown";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function HomeFestiveSpotlight() {
  const { data: campaigns } = useQuery(activeCampaignsQuery());
  const [copied, setCopied] = useState(false);

  // Find highest priority campaign designated for home showcase
  const homeCampaign = campaigns
    ?.filter((c) => c.showOnHome && c.isActive)
    ?.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

  // Also query the campaign's participating products (first 4 items for showcase)
  const { data: campaignDetail } = useQuery({
    ...campaignBySlugQuery(homeCampaign?.slug || "", { page: 0, size: 4 }),
    enabled: !!homeCampaign?.slug,
  });

  if (!homeCampaign) return null;

  const styles = getCampaignThemeStyles(homeCampaign.badgeTheme);
  const discountLabel = formatCampaignDiscountLabel(homeCampaign);
  const products = campaignDetail?.products?.content || [];

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!homeCampaign.couponCode) return;
    navigator.clipboard.writeText(homeCampaign.couponCode);
    setCopied(true);
    toast.success(`Coupon code "${homeCampaign.couponCode}" copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="relative w-full py-6 sm:py-12 overflow-hidden">
      <Container size="xl">
        <div
          className={cn(
            "relative rounded-2xl sm:rounded-3xl overflow-hidden border shadow-xl p-3.5 sm:p-6 lg:p-10 transition-all",
            styles.barBg
          )}
        >
          {/* Subtle Ambient Glow Behind */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

          {/* If campaign has uploaded banner: Display clean responsive <picture> banner + docked action bar */}
          {homeCampaign.desktopBannerUrl || homeCampaign.mobileBannerUrl ? (
            <div className="space-y-4">
              {/* Responsive High-Resolution Banner Graphic (100% Crisp, No Filters) */}
              <Link
                to="/offers/$slug"
                params={{ slug: homeCampaign.slug }}
                className="block group overflow-hidden rounded-2xl sm:rounded-3xl border border-border/50 bg-neutral-950 shadow-md hover:shadow-xl transition-all"
              >
                <picture className="w-full block">
                  {homeCampaign.mobileBannerUrl && (
                    <source media="(max-width: 640px)" srcSet={homeCampaign.mobileBannerUrl} />
                  )}
                  <img
                    src={homeCampaign.desktopBannerUrl || homeCampaign.mobileBannerUrl!}
                    alt={homeCampaign.name}
                    className="w-full h-auto max-h-[480px] object-contain mx-auto block group-hover:scale-[1.006] transition-transform duration-300"
                    loading="lazy"
                  />
                </picture>
              </Link>

              {/* Docked Action Bar: Details, Coupon & Countdown */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                {/* Left: Badges, Title, Discount & Coupon */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md",
                      styles.badgeBg
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {homeCampaign.badgeText || "Special Offer"}
                  </span>

                  <span className="text-white font-bold text-base sm:text-lg">
                    {homeCampaign.name}
                  </span>

                  <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", styles.pillBg)}>
                    <Flame className="w-3 h-3 inline mr-1 text-amber-400" />
                    {discountLabel}
                  </span>

                  {(homeCampaign.tagline || homeCampaign.description) && (
                    <span className="hidden xl:inline text-xs text-white/80 font-medium truncate max-w-sm" title={homeCampaign.description || homeCampaign.tagline || ""}>
                      {homeCampaign.tagline || homeCampaign.description}
                    </span>
                  )}

                  {homeCampaign.couponCode && (
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold backdrop-blur-md transition-all active:scale-95"
                      title="Click to copy coupon"
                    >
                      <Tag className="w-3.5 h-3.5 text-amber-300" />
                      <span>CODE: {homeCampaign.couponCode}</span>
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-70" />
                      )}
                    </button>
                  )}
                </div>

                {/* Right: Countdown & CTA Button */}
                <div className="flex items-center gap-3 shrink-0">
                  {homeCampaign.showCountdown && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/15">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider hidden sm:inline">
                        Ends in:
                      </span>
                      <CampaignCountdown endDate={homeCampaign.endDate} variant="compact" />
                    </div>
                  )}

                  <Button asChild size="default" className={cn("rounded-full font-bold shadow-lg", styles.buttonVariant)}>
                    <Link to="/offers/$slug" params={{ slug: homeCampaign.slug }}>
                      Shop Deals <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback Text-Based Festive Card (When no graphic banner is uploaded) */
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Left Content Column */}
              <div className="max-w-xl space-y-4">
                {/* Badge */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md",
                      styles.badgeBg
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {homeCampaign.badgeText || "Festive Offer"}
                  </span>

                  <span className={cn("px-3 py-0.5 rounded-full text-xs font-bold border", styles.pillBg)}>
                    <Flame className="w-3 h-3 inline mr-1 text-amber-400" />
                    {discountLabel}
                  </span>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {homeCampaign.name}
                  </h2>
                  {homeCampaign.tagline && (
                    <p className="mt-2 text-sm sm:text-base text-white/80 font-medium">
                      {homeCampaign.tagline}
                    </p>
                  )}
                  {homeCampaign.description && (
                    <p className="mt-1 text-xs sm:text-sm text-white/60 line-clamp-2">
                      {homeCampaign.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons & Optional Coupon */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button asChild size="lg" className={cn("rounded-full font-bold shadow-lg", styles.buttonVariant)}>
                    <Link to="/offers/$slug" params={{ slug: homeCampaign.slug }}>
                      Shop Deals Now <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>

                  {homeCampaign.couponCode && (
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-sm font-bold backdrop-blur-md transition-all active:scale-95"
                      title="Click to copy coupon"
                    >
                      <Tag className="w-4 h-4 text-amber-300" />
                      <span>CODE: {homeCampaign.couponCode}</span>
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-70" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Countdown Clock (Hero Size) */}
              {homeCampaign.showCountdown && (
                <div className="flex flex-col items-start lg:items-end justify-center gap-2 p-5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Offer Ends In</span>
                  </div>
                  <CampaignCountdown endDate={homeCampaign.endDate} variant="hero" />
                </div>
              )}
            </div>
          )}

          {/* Participating Products Spotlight (if loaded) */}
          {products.length > 0 && (
            <div className="relative z-10 mt-6 sm:mt-8 pt-5 sm:pt-8 border-t border-white/15">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 sm:gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Handpicked Offers for You
                </h3>
                <Link
                  to="/offers/$slug"
                  params={{ slug: homeCampaign.slug }}
                  className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white flex items-center gap-1 underline underline-offset-4"
                >
                  View All ({campaignDetail?.products?.totalElements || products.length}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                {products.slice(0, 4).map((p) => (
                  <div key={p.productId} className="h-full">
                    <ProductCard product={p} className="h-full bg-white/95" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
