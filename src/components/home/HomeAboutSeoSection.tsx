"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cmsService } from "@/services/cms.service";
import { useLocationStore } from "@/store/useLocationStore";
import {
  ShieldCheck,
  Truck,
  Wrench,
  CreditCard,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HIGHLIGHT_CARDS = [
  {
    icon: Award,
    title: "One-Stop Battery Store",
    desc: "Complete range of car batteries, home inverter batteries, lithium packs, and solar solutions under one roof.",
  },
  {
    icon: ShieldCheck,
    title: "100% Genuine Top Brands",
    desc: "Authorized dealer for Exide, Amaron, Luminous, Livguard, SF Sonic, and Microtek with brand warranty.",
  },
  {
    icon: Clock,
    title: "Fast 60-Min Delivery & Fitment",
    desc: "Lightning-fast doorstep delivery and professional installation with zero hidden charges.",
  },
  {
    icon: CreditCard,
    title: "Convenient Payment Options",
    desc: "Pay securely after installation via Cash on Delivery, UPI, Debit/Credit Card, Net Banking, or EMI.",
  },
  {
    icon: Wrench,
    title: "Experienced & Certified Experts",
    desc: "Dedicated technicians ensure safe terminal setup, electrical checks, and optimal battery health.",
  },
  {
    icon: Zap,
    title: "Maximum Scrap Battery Value",
    desc: "Exchange your old dead battery to get instant cash discount and government-compliant green recycling.",
  },
];

export function HomeAboutSeoSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentCity = useLocationStore((state) => state.city?.cityName);

  const { data: cmsPage } = useQuery({
    queryKey: ["cms-page", "home-about"],
    queryFn: async () => {
      try {
        const page = await cmsService.getPageBySlug("home-about");
        return page && page.isActive !== false ? page : null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
  });

  const cityLabel = currentCity ? ` in ${currentCity}` : " in India";
  const defaultBannerImage = "/images/home_about_banner.jpg";
  const bannerImage = cmsPage?.image1 || defaultBannerImage;

  return (
    <section aria-labelledby="about-battery-mantra" className="mt-16 md:mt-24">
      {/* Top Split Section: Visual Graphic + Welcome Lead */}
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 sm:p-8 lg:p-10 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Visual Promo Banner Card */}
          <div className="lg:col-span-5 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg aspect-4/3 w-full bg-slate-950">
              <img
                src={bannerImage}
                alt="Battery Mantra multi-brand battery store"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

              {/* Floating badges on image */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-900 shadow-md backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-primary" /> Multi-Brand Store
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-md">
                  <Clock className="h-3 w-3" /> 60-Min Fitment
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
                  India's Trusted Power Partner
                </p>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                  Battery Mantra
                </h3>
                <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                  Doorstep installation for Inverters, Cars, Bikes, Commercial & Solar batteries.
                </p>

                {/* Brand mini pills */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-white/20 text-[10px] font-medium text-slate-200">
                  <span className="bg-white/15 px-2 py-0.5 rounded">Exide</span>
                  <span className="bg-white/15 px-2 py-0.5 rounded">Amaron</span>
                  <span className="bg-white/15 px-2 py-0.5 rounded">Luminous</span>
                  <span className="bg-white/15 px-2 py-0.5 rounded">Livguard</span>
                  <span className="bg-white/15 px-2 py-0.5 rounded">SF Sonic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Welcome & Editorial Story */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider w-fit mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Welcome to Battery Mantra
            </div>

            <h2
              id="about-battery-mantra"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-snug"
            >
              {cmsPage?.title || (
                <>
                  Best & Affordable Car & Inverter Batteries
                  <span className="text-primary">{cityLabel}</span>
                </>
              )}
            </h2>

            {cmsPage?.subTitle && (
              <p className="text-sm font-semibold text-muted-foreground mt-2">
                {cmsPage.subTitle}
              </p>
            )}

            {/* CMS Content vs Fallback Content */}
            {cmsPage?.content ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed mt-4"
                dangerouslySetInnerHTML={{ __html: cmsPage.content }}
              />
            ) : (
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed mt-4 space-y-3">
                <p>
                  Are you looking for a robust, reliable power backup solution for your home, office, or vehicle?
                  At <strong className="text-foreground font-semibold">Battery Mantra</strong>, we offer a comprehensive range of genuine automotive and inverter batteries at guaranteed pocket-friendly prices.
                </p>
                <p>
                  Right after placing your order online or via phone, your battery is dispatched directly to your doorstep with <strong className="text-foreground font-semibold">free delivery & professional fitment within 60 minutes</strong>{cityLabel}. Every product comes with an authentic manufacturer warranty and instant scrap exchange discounts.
                </p>
              </div>
            )}

            {/* Key Quick Points Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>100% Factory-Fresh Stock with Brand Warranty</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero Installation or Delivery Charges</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Old Battery Scrap Exchange Discount</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Multiple Convenient Payment Modes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Why Battery Mantra is the Best Option For You
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              Serving thousands of satisfied residential, commercial, and automotive customers every month.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HIGHLIGHT_CARDS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/70 bg-background/70 hover:bg-muted/40 p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm flex flex-col gap-2.5"
                >
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rich SEO Expandable Accordion */}
        <div className="mt-10 pt-6 border-t border-border">
          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-in-out relative",
              isExpanded ? "max-h-[3000px] opacity-100" : "max-h-36 opacity-90"
            )}
          >
            {cmsPage?.content2 ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: cmsPage.content2 }}
              />
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground space-y-4 leading-relaxed">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                    Enjoy Uninterrupted Battery Services During Power Cuts{cityLabel}
                  </h4>
                  <p>
                    Being a premier online battery and power backup store, Battery Mantra ensures inverter and car battery prices remain transparent and accessible to everyone. We source directly from certified manufacturers including Luminous, Exide, Amaron, Livguard, Microtek, and SF Sonic. Whether you require a heavy-duty tall tubular battery for extended home power cuts or a maintenance-free AGM battery for your car, our store guarantees best-in-market rates with comprehensive warranty support.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                    How We Help You Choose the Ideal Battery Solution
                  </h4>
                  <p>
                    Navigating electrical loads and AH capacity ratings can be daunting. Our seasoned battery specialists help assess your household wattage requirements—from ceiling fans and refrigerators to computers and lights—ensuring you select the exact inverter-battery combination that delivers maximum backup hours without overloading your system.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                    Eco-Friendly Old Battery Scrap Disposal
                  </h4>
                  <p>
                    Lead-acid batteries pose environmental hazards if disposed of carelessly. Battery Mantra is committed to eco-friendly recycling protocols. When you exchange your old battery with us, you receive an upfront cash discount applied immediately at checkout, while your old unit is handed over to government-authorized smelters for safe lead recovery.
                  </p>
                </div>
              </div>
            )}

            {/* Gradient overlay when collapsed */}
            {!isExpanded && (
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Toggle Button */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-2xs cursor-pointer"
            >
              <span>{isExpanded ? "Show Less Overview" : "Read Full Battery Guide & Overview"}</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
