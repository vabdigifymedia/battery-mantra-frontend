import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Sparkles, Tag, ArrowLeft, ArrowRight, Copy, Check, Clock, ShieldCheck, Flame, ShoppingBag } from "lucide-react";
import { campaignBySlugQuery } from "@/queries";
import { getCampaignThemeStyles, formatCampaignDiscountLabel } from "@/lib/campaign-utils";
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

  const { data, isLoading, isError } = useQuery(
    campaignBySlugQuery(slug, {
      page: search.page,
      size: search.size,
      category: search.category,
      brand: search.brand,
      sort: search.sort,
    })
  );

  const campaign = data?.campaign;
  const productsPage = data?.products;
  const products = productsPage?.content || [];

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

      {/* Hero Banner Section */}
      <section className={cn("relative overflow-hidden border-b", styles.barBg)}>
        {campaign.desktopBannerUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url(${campaign.desktopBannerUrl})` }}
          />
        )}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <Container size="xl" className="relative z-10 py-10 sm:py-16">
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
                <p className="text-sm text-white/70 max-w-xl">
                  {campaign.description}
                </p>
              )}

              {/* Coupon Code Pill */}
              {campaign.couponCode && (
                <div className="pt-2">
                  <div className="inline-flex items-center gap-3 p-2.5 px-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-lg">
                    <Tag className="w-5 h-5 text-amber-300 shrink-0" />
                    <div className="text-left">
                      <div className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Coupon Code</div>
                      <div className="font-mono text-base font-extrabold tracking-wider">{campaign.couponCode}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCopyCoupon}
                      className={cn("ml-2 rounded-lg text-xs font-bold", styles.buttonVariant)}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown Clock Box */}
            {campaign.showCountdown && (
              <div className="flex flex-col items-start lg:items-end gap-2 p-6 rounded-2xl bg-black/35 backdrop-blur-md border border-white/15 shadow-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Offer Ends In</span>
                </div>
                <CampaignCountdown endDate={campaign.endDate} variant="hero" />
                <span className="text-[11px] text-white/60">
                  Valid till {new Date(campaign.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        </Container>
      </section>

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
                  <ProductCard product={p} className="h-full shadow-sm hover:shadow-md" />
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
      </Container>
    </div>
  );
}
