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
    <section className="relative w-full py-8 sm:py-12 overflow-hidden">
      <Container size="xl">
        <div
          className={cn(
            "relative rounded-3xl overflow-hidden border shadow-xl p-6 sm:p-10 transition-all",
            styles.barBg
          )}
        >
          {/* Subtle Ambient Glow Behind */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

          {/* Optional Desktop Banner as subtle background overlay if uploaded */}
          {homeCampaign.desktopBannerUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: `url(${homeCampaign.desktopBannerUrl})` }}
            />
          )}

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

          {/* Participating Products Spotlight (if loaded) */}
          {products.length > 0 && (
            <div className="relative z-10 mt-8 pt-8 border-t border-white/15">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
