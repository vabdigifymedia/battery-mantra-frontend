import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Sparkles, Tag, ArrowLeft, ArrowRight, Copy, Check, Clock, ShieldCheck, Flame, ShoppingBag } from "lucide-react";
import { campaignBySlugQuery } from "@/queries";
import { useActiveCityId, useCityPricedProducts } from "@/hooks/useCityProductPricing";
import { getCampaignThemeStyles, formatCampaignDiscountLabel, safeFormatDate } from "@/lib/campaign-utils";
import { CampaignCountdown } from "@/components/campaign/CampaignCountdown";
import { ProductCard } from "@/components/products/ProductCard";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { toast } from "sonner";
import { buildPageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

const offersSearchSchema = z.object({
  page: z.coerce.number().default(0),
  size: z.coerce.number().default(24),
  category: z.string().optional(),
  brand: z.string().optional(),
  sort: z.string().optional(),
});

export const Route = createFileRoute("/offers/$slug")({
  validateSearch: offersSearchSchema,
  loader: async ({ params, context }) => {
    try {
      const data = await context.queryClient.fetchQuery(
        campaignBySlugQuery(params.slug, { page: 0, size: 24 })
      );
      return { campaign: data?.campaign };
    } catch {
      return { campaign: null };
    }
  },
  head: ({ loaderData, params }) => {
    const c = loaderData?.campaign;
    const title = c ? `${c.name} — BatteryMantra Offers` : "Special Offer — BatteryMantra";
    const description = c?.tagline || c?.description || "Explore exclusive festive battery discounts and doorstep fitment offers.";
    return buildPageHead(null, {
      title,
      description,
      image: c?.desktopBannerUrl || undefined,
    });
  },
  component: CampaignOfferPage,
});

function CampaignOfferPage() {
  const { slug } = useParams({ from: "/offers/$slug" });
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [copied, setCopied] = useState(false);
  const cityId = useActiveCityId();

  const { data, isLoading, isError } = useQuery(
    campaignBySlugQuery(
      slug,
      {
        page: search.page,
        size: search.size,
        category: search.category,
        brand: search.brand,
        sort: search.sort,
      },
      cityId
    )
  );

  const campaign = data?.campaign;
  const productsPage = data?.products;
  const products = useCityPricedProducts(productsPage?.content, cityId);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <Container size="md" className="py-20 text-center">
        <EmptyState
          title="Offer Not Found"
          description="This campaign may have expired or is no longer active."
          action={
            <Button asChild variant="brand">
              <Link to="/products">Browse All Batteries</Link>
            </Button>
          }
        />
      </Container>
    );
  }

  const styles = getCampaignThemeStyles(campaign.badgeTheme);
  const discountLabel = formatCampaignDiscountLabel(campaign);

  const handleCopyCoupon = () => {
    if (!campaign.couponCode) return;
    navigator.clipboard.writeText(campaign.couponCode);
    setCopied(true);
    toast.success(`Coupon code ${campaign.couponCode} copied!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="border-b bg-muted/40">
        <Container size="xl" className="py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">Offers</Link>
          <span>/</span>
          <span className="font-semibold text-foreground truncate">{campaign.name}</span>
        </Container>
      </div>

      {/* Banner / Hero Section */}
      {campaign.desktopBannerUrl || campaign.mobileBannerUrl ? (
        <div>
          {/* Responsive High-Resolution Banner Graphic (100% Crisp, No Filters) */}
          <div className="w-full bg-neutral-950 flex items-center justify-center overflow-hidden border-b">
            <picture className="w-full max-w-[1920px] mx-auto block">
              {campaign.mobileBannerUrl && (
                <source media="(max-width: 640px)" srcSet={campaign.mobileBannerUrl} />
              )}
              <img
                src={campaign.desktopBannerUrl || campaign.mobileBannerUrl!}
                alt={campaign.name}
                className="w-full h-auto max-h-[500px] object-contain mx-auto block"
              />
            </picture>
          </div>

          {/* Docked Offer Details & Live Countdown Strip */}
          <div className={cn("border-b py-3.5 sm:py-4 shadow-xs", styles.barBg)}>
            <Container size="xl" className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              {/* Left: Badges, Hooks, Coupon */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm",
                    styles.badgeBg
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {campaign.badgeText || "SPECIAL OFFER"}
                </span>

                <span className={cn("px-3 py-0.5 rounded-full text-xs font-bold border", styles.pillBg)}>
                  <Flame className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                  {discountLabel}
                </span>

                {campaign.tagline && (
                  <span className="text-xs sm:text-sm font-semibold text-white/90">
                    {campaign.tagline}
                  </span>
                )}

                {campaign.couponCode && (
                  <button
                    type="button"
                    onClick={handleCopyCoupon}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-white font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                    title="Click to copy coupon code"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-300" />
                    <span>CODE: {campaign.couponCode}</span>
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </button>
                )}
              </div>

              {/* Right: Countdown Clock */}
              {campaign.showCountdown && (
                <div className="flex items-center gap-2.5 bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 shrink-0 self-start md:self-auto">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-pulse" /> Ends In
                    </div>
                    <div className="text-[10px] text-white/60">
                      Till {safeFormatDate(campaign.endDate, "dd MMM yyyy")}
                    </div>
                  </div>
                  <CampaignCountdown endDate={campaign.endDate} variant="compact" className="text-xs sm:text-sm font-mono text-white" />
                </div>
              )}
            </Container>
          </div>
        </div>
      ) : (
        /* Fallback when NO banner image is uploaded */
        <section className={cn("relative overflow-hidden border-b py-10 sm:py-16", styles.barBg)}>
          <Container size="xl" className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm",
                      styles.badgeBg
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {campaign.badgeText || "Special Offer"}
                  </span>

                  <span className={cn("px-3 py-0.5 rounded-full text-xs font-bold border", styles.pillBg)}>
                    <Flame className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                    {discountLabel}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  {campaign.name}
                </h1>

                {campaign.tagline && (
                  <p className="text-base sm:text-lg text-white/90 font-medium">
                    {campaign.tagline}
                  </p>
                )}

                {campaign.description && (
                  <p className="text-xs sm:text-sm text-white/80 font-normal leading-relaxed whitespace-pre-line max-w-xl">
                    {campaign.description}
                  </p>
                )}

                {campaign.couponCode && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="inline-flex items-center gap-3 p-2.5 px-4 rounded-xl bg-black/40 border border-white/20 text-white shadow-lg cursor-pointer"
                    >
                      <Tag className="w-5 h-5 text-amber-300 shrink-0" />
                      <div className="text-left">
                        <div className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Coupon Code</div>
                        <div className="font-mono text-base font-extrabold tracking-wider">{campaign.couponCode}</div>
                      </div>
                      <span className={cn("ml-2 px-2.5 py-1 rounded text-xs font-bold", styles.buttonVariant)}>
                        {copied ? "Copied!" : "Copy"}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {campaign.showCountdown && (
                <div className="flex flex-col items-start lg:items-end gap-2 p-6 rounded-2xl bg-black/35 backdrop-blur-md border border-white/15 shadow-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>Offer Ends In</span>
                  </div>
                  <CampaignCountdown endDate={campaign.endDate} variant="hero" />
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* Offer Terms Bar */}
      <div className="border-b bg-card/60 py-3">
        <Container size="xl" className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Genuine Batteries · Free Professional Doorstep Installation</span>
          </div>
          {campaign.minOrderValue && campaign.minOrderValue > 0 && (
            <div className="font-medium text-foreground">
              *Min. order value: ₹{Number(campaign.minOrderValue).toLocaleString()}
            </div>
          )}
        </Container>
      </div>

      {/* Products Section */}
      <Container size="xl" className="py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-600" />
              Participating Products ({productsPage?.totalElements || products.length})
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Discounts applied automatically or using coupon code during checkout
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="No items currently match this offer. Please check back soon!"
            action={
              <Button asChild variant="brand">
                <Link to="/products">Explore Catalogue</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => (
                <div key={p.productId} className="h-full">
                  <ProductCard product={p} campaign={campaign} className="h-full shadow-sm hover:shadow-md" />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {productsPage && productsPage.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={search.page <= 0}
                  onClick={() => navigate({ search: { ...search, page: search.page - 1 } })}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-xs font-medium text-muted-foreground">
                  Page {search.page + 1} of {productsPage.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={search.page >= productsPage.totalPages - 1}
                  onClick={() => navigate({ search: { ...search, page: search.page + 1 } })}
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Offer Description (Bottom of Page) */}
        {campaign.description && (
          <div className="mt-12 sm:mt-16 border-t pt-8">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3">
              About {campaign.name}
            </h2>
            {/<[a-z][\s\S]*>/i.test(campaign.description) ? (
              <div
                className="prose prose-sm md:prose-base max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: campaign.description }}
              />
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                {campaign.description}
              </p>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
