import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Ticket, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Percent, 
  Info,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { couponsService } from "@/services/coupons.service";
import { isProductEligibleForCoupon, formatCouponDiscountLabel } from "@/lib/coupon-rules";
import type { CouponResponse, ProductDetailResponse, ProductListResponse } from "@/types/dto";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AvailableCouponsCardProps {
  product: ProductDetailResponse | ProductListResponse;
  className?: string;
  onApplyCode?: (code: string) => void;
}

export const AvailableCouponsCard: React.FC<AvailableCouponsCardProps> = ({
  product,
  className,
  onApplyCode,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Fetch active public coupons
  const { data: coupons = [], isLoading } = useQuery<CouponResponse[]>({
    queryKey: ["public-active-coupons"],
    queryFn: () => couponsService.getActivePublicCoupons(),
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchOnWindowFocus: false,
  });

  // Filter coupons matching this product and enabled for PDP display
  const eligibleCoupons = useMemo(() => {
    if (!coupons || coupons.length === 0) return [];
    return coupons.filter((coupon) => {
      if (coupon.displayOnPdp === false) return false;
      return isProductEligibleForCoupon(coupon, product);
    });
  }, [coupons, product]);

  const handleCopyCode = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedCode(code);
      try {
        sessionStorage.setItem("bm_copied_coupon", code);
      } catch {
        // Ignore
      }
      toast.success(`Coupon code "${code}" copied! Apply it at checkout.`);
      if (onApplyCode) {
        onApplyCode(code);
      }
      setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 2500);
    } catch {
      toast.error("Failed to copy code. Please copy manually.");
    }
  };

  // Don't render anything if loading or no coupons match
  if (isLoading || eligibleCoupons.length === 0) {
    return null;
  }

  // Display top 1 or 2 by default, allow expanding if more
  const displayedCoupons = isExpanded ? eligibleCoupons : eligibleCoupons.slice(0, 2);
  const hasMore = eligibleCoupons.length > 2;

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 via-amber-500/3 to-transparent dark:from-amber-500/10 dark:via-background dark:to-background p-3.5 sm:p-4.5 shadow-xs relative overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-sm",
        className
      )}
    >
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-2xs">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
              <span>Available Offers & Coupons</span>
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20" />
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium">
              Save extra with verified discount codes on this item
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0"
        >
          {eligibleCoupons.length} {eligibleCoupons.length === 1 ? "Offer" : "Offers"}
        </Badge>
      </div>

      {/* Coupons List */}
      <div className="space-y-2.5 relative z-10">
        {displayedCoupons.map((coupon) => {
          const isCopied = copiedCode === coupon.code;
          const discountLabel = formatCouponDiscountLabel(coupon);
          const hasMinOrder = typeof coupon.minOrderValue === "number" && coupon.minOrderValue > 0;
          const expiryDateFormatted = coupon.expiryDate
            ? new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })
            : null;

          return (
            <div
              key={coupon.couponId || coupon.code}
              className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-background/80 dark:bg-muted/40 border border-border/80 hover:border-amber-500/40 hover:bg-background transition-all shadow-2xs"
            >
              {/* Left Column: Coupon Code & Details */}
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {/* Coupon Code Pill with dashed border effect */}
                <div className="shrink-0 flex items-center">
                  <div className="font-mono text-xs sm:text-sm font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-dashed border-amber-500/40 shadow-2xs flex items-center gap-1.5">
                    <Percent className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{coupon.code}</span>
                  </div>
                </div>

                {/* Offer Description */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-foreground leading-snug">
                      {discountLabel}
                    </span>
                    {coupon.pdpHighlightText && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded tracking-tight">
                        {coupon.pdpHighlightText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap font-medium">
                    {hasMinOrder && (
                      <span className="inline-flex items-center gap-1">
                        <Info className="w-3 h-3 text-muted-foreground/70" />
                        Min. order ₹{coupon.minOrderValue?.toLocaleString("en-IN")}
                      </span>
                    )}
                    {expiryDateFormatted && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground/70" />
                        Valid till {expiryDateFormatted}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Copy Button */}
              <div className="sm:self-center shrink-0 flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleCopyCode(coupon.code, e)}
                  className={cn(
                    "h-8 px-3 text-xs font-bold transition-all rounded-lg gap-1.5 shadow-2xs",
                    isCopied
                      ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                      : "bg-background hover:bg-amber-500/10 hover:text-amber-800 dark:hover:text-amber-200 border-amber-500/30 text-amber-700 dark:text-amber-300"
                  )}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse toggle if more than 2 coupons */}
      {hasMore && (
        <div className="mt-2.5 pt-2 border-t border-amber-500/15 flex justify-center relative z-10">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 flex items-center gap-1 py-0.5 px-2 rounded-md transition-colors"
          >
            <span>
              {isExpanded
                ? "Show fewer offers"
                : `+ View ${eligibleCoupons.length - 2} more ${eligibleCoupons.length - 2 === 1 ? "offer" : "offers"}`}
            </span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  );
};
