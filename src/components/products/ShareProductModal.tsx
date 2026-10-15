import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Check,
  Mail,
  Battery,
  ExternalLink,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShareProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    productId?: string;
    productName: string;
    productImage?: string | null;
    brandName?: string | null;
    productPrice?: number;
    exchangeDiscount?: number;
    categoryName?: string | null;
  };
  customUrl?: string;
}

export function ShareProductModal({
  open,
  onOpenChange,
  product,
  customUrl,
}: ShareProductModalProps) {
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setHasNativeShare(true);
    }
  }, []);

  const shareUrl = useMemo(() => {
    if (customUrl) return customUrl;
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  }, [customUrl, open]);

  const shareTitle = useMemo(() => {
    return `${product.productName} | BatteryMantra`;
  }, [product.productName]);

  const shareText = useMemo(() => {
    const priceText = product.productPrice
      ? ` at ₹${product.productPrice.toLocaleString()}`
      : "";
    return `Check out ${product.productName}${priceText} on BatteryMantra! 100% Genuine with fast delivery & installation.`;
  }, [product.productName, product.productPrice]);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link. Please copy manually.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          toast.error("Could not share via system.");
        }
      }
    }
  };

  const currentPrice = useMemo(() => {
    if (!product.productPrice) return null;
    if ((product.exchangeDiscount ?? 0) > 0) {
      return Math.max(0, product.productPrice - (product.exchangeDiscount || 0));
    }
    return product.productPrice;
  }, [product.productPrice, product.exchangeDiscount]);

  const socialLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    const encodedTitle = encodeURIComponent(shareTitle);

    return [
      {
        name: "WhatsApp",
        icon: (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        ),
        href: `https://api.whatsapp.com/send?text=${encodedText}`,
        bgClass: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      },
      {
        name: "Facebook",
        icon: (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        ),
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        bgClass: "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
      },
      {
        name: "X (Twitter)",
        icon: (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
        href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        bgClass: "bg-slate-100 text-slate-900 hover:bg-slate-200 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",
      },
      {
        name: "Telegram",
        icon: (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.08.5l-2.97-2.19-1.43 1.38c-.16.16-.29.29-.6.29l.21-3.04 5.53-5c.24-.21-.05-.33-.37-.12l-6.84 4.31-2.95-.92c-.64-.2-.65-.64.13-.95l11.53-4.44c.53-.2 1 .12.89.51z" />
          </svg>
        ),
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
        bgClass: "bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
      },
      {
        name: "Email",
        icon: <Mail className="w-4 h-4" />,
        href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${shareText}\n\nView here: ${shareUrl}`)}`,
        bgClass: "bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
      },
    ];
  }, [shareUrl, shareText, shareTitle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6 rounded-2xl gap-5">
        <DialogHeader className="text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
              Share Product
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Share this product with friends and family via social media or copy the direct link.
          </DialogDescription>
        </DialogHeader>

        {/* Compact Product Snapshot */}
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/40 border border-border/60">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-white border border-border/50 p-1 flex items-center justify-center shrink-0 overflow-hidden">
            {product.productImage ? (
              <img
                src={product.productImage}
                alt={product.productName}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            ) : (
              <Battery className="w-7 h-7 text-muted-foreground/40" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {product.brandName && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand truncate">
                {product.brandName}
              </p>
            )}
            <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 leading-snug">
              {product.productName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {currentPrice !== null && (
                <span className="text-xs sm:text-sm font-extrabold text-foreground">
                  ₹{currentPrice.toLocaleString()}
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-2.5 h-2.5" /> 100% Genuine
              </span>
            </div>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Share via</p>
          <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-2xs group",
                  item.bgClass
                )}
                title={`Share on ${item.name}`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                  {item.icon}
                </div>
                <span className="text-[10px] font-semibold truncate w-full text-center">
                  {item.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Native Web Share Button (if supported) */}
        {hasNativeShare && (
          <Button
            type="button"
            variant="outline"
            onClick={handleNativeShare}
            className="w-full h-10 text-xs sm:text-sm font-semibold rounded-xl border-dashed border-primary/40 hover:bg-primary/5 flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-brand" />
            <span>More sharing options on your device</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
          </Button>
        )}

        {/* Copy Link Section */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-muted-foreground">Page Link</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Input
                readOnly
                value={shareUrl}
                className="pr-4 h-10 text-xs font-mono bg-muted/30 select-all truncate rounded-xl"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <Button
              type="button"
              onClick={handleCopyLink}
              variant={copied ? "default" : "brand"}
              className={cn(
                "h-10 px-4 text-xs font-bold rounded-xl shrink-0 transition-all",
                copied && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
