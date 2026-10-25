"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLocationStore } from "@/store/useLocationStore";
import {
  ShieldCheck,
  CreditCard,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  Sparkles,
  Wrench,
  Truck,
  ArrowRight,
  PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HIGHLIGHT_CARDS = [
  {
    icon: Award,
    title: "One-Stop Solution",
    desc: "Order home UPS and automotive batteries online or via phone in simple steps. Battery Mantra is your single destination for complete power backup solutions.",
  },
  {
    icon: ShieldCheck,
    title: "100% Genuine Top Brands",
    desc: "Authorized partner for Exide, Amaron, Luminous, Livguard, Microtek, and SF Sonic with authentic brand replacement warranty.",
  },
  {
    icon: Clock,
    title: "FREE Delivery & 60-Min Fitment",
    desc: "Lightning-fast doorstep delivery and certified technician installation within 60 minutes with zero extra delivery or labour charges.",
  },
  {
    icon: CreditCard,
    title: "Convenient Payment Options",
    desc: "Pay securely after installation via Cash on Delivery (COD), UPI, Paytm, Debit/Credit Card, Net Banking, or flexible EMI options.",
  },
  {
    icon: Wrench,
    title: "Experienced & Skilled Experts",
    desc: "Proficient team of technicians ensuring safe terminal fitment, electrical load balancing, and battery health diagnostics.",
  },
  {
    icon: Zap,
    title: "Maximum Scrap Battery Value",
    desc: "Exchange your old dead battery to get instant cash discounts on your new purchase with certified eco-friendly green recycling.",
  },
];

export function HomeAboutSeoSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentCity = useLocationStore((state) => state.city?.cityName);

  const cityLabel = currentCity ? ` in ${currentCity}` : " in India";
  const cityDeliveryText = currentCity ? `in ${currentCity}` : "in Noida & across Delhi NCR";

  return (
    <section aria-labelledby="about-battery-mantra" className="mt-16 md:mt-24">
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 sm:p-8 lg:p-10 shadow-sm overflow-hidden">
        {/* Top Split Section: Visual Graphic + Welcome Lead */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Visual Promo Banner Card */}
          <div className="lg:col-span-5 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg aspect-4/3 w-full bg-slate-950">
              <img
                src="/images/home_about_banner.jpg"
                alt="Battery Mantra multi-brand car and inverter battery store"
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
                  <span className="bg-white/15 px-2 py-0.5 rounded">Microtek</span>
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
              Best & Affordable Car & Inverter Batteries
              <span className="text-primary">{cityLabel}</span>
            </h2>

            <p className="text-sm font-semibold text-muted-foreground mt-2">
              Doorstep Battery Delivery, Installation & Old Scrap Exchange
            </p>

            <div className="text-muted-foreground text-sm sm:text-base leading-relaxed mt-4 space-y-3">
              <p>
                Are you looking for a robust power backup solution as an{" "}
                <Link
                  to="/shop-by-category/$"
                  params={{ _splat: "inverter-and-battery-combo" }}
                  className="text-primary font-medium underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
                >
                  inverter and battery combo
                </Link>
                ? At <strong className="text-foreground font-semibold">Battery Mantra</strong>, a trusted online store, you can find the best inverter batteries and vehicle power packs at pocket-friendly rates. Our offered home UPS batteries are the perfect choice for your home & office to withstand regular power cuts.
              </p>
              <p>
                When you check the price of batteries on our website, you discover unbeatable rates compared to traditional suppliers. Right after ordering your{" "}
                <Link
                  to="/shop-by-category/$"
                  params={{ _splat: "inverter-battery" }}
                  className="text-primary font-medium underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
                >
                  inverter battery
                </Link>
                , it is delivered to your doorstep within 60 minutes {cityDeliveryText} with no extra delivery charges. You can order our high-performance tubular batteries either online or via phone.
              </p>
            </div>

            {/* Key Quick Points Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>100% Genuine Tubular & Car Batteries</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>FREE Doorstep Delivery & 60-Min Fitment</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Maximum Scrap Battery Exchange Value</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Flexible Payments: Cash, UPI, Cards & EMI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid: How Is Battery Mantra Best Option For You? */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              How Is Battery Mantra the Best Option For You?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              Facing regular power cuts or need a dependable car battery? Battery Mantra supports you with top-rated products at guaranteed discount prices.
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
            <div className="text-xs sm:text-sm text-muted-foreground space-y-5 leading-relaxed">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                  Enjoy Uninterrupted Battery Services During Power Cuts{cityLabel}
                </h4>
                <p>
                  Being a leading online battery store{cityLabel}, Battery Mantra has made home inverters and power backup solutions truly affordable so that anyone can easily buy them. Our rendered batteries are sourced directly from certified manufacturers, such as{" "}
                  <Link
                    to="/brand/$brandSlug"
                    params={{ brandSlug: "luminous" }}
                    className="text-primary font-medium underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                  >
                    Luminous inverter battery
                  </Link>
                  ,{" "}
                  <Link
                    to="/brand/$brandSlug"
                    params={{ brandSlug: "exide" }}
                    className="text-primary font-medium underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                  >
                    Exide battery
                  </Link>
                  ,{" "}
                  <Link
                    to="/brand/$brandSlug"
                    params={{ brandSlug: "amaron" }}
                    className="text-primary font-medium underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                  >
                    Amaron battery
                  </Link>
                  , Microtek, SF Sonic, Tata Green, Okaya, Livguard, and Livfast. This guarantees that you reap the advantages of extremely competitive prices while enjoying direct access to premium quality products during power outages.
                </p>
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                  Affordable Combos, GST-Inclusive Pricing & Transparent Billing
                </h4>
                <p>
                  The{" "}
                  <Link
                    to="/shop-by-category/$"
                    params={{ _splat: "inverter-and-battery-combo" }}
                    className="text-primary font-medium underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                  >
                    price of Luminous inverter with battery combos
                  </Link>{" "}
                  is accessible to everyone seeking high quality at low prices. We are one of India's fastest-growing stored energy suppliers, dedicated to providing complete guidance and amazing batteries at highly competitive price points. We are admired by our customers for supplying quality{" "}
                  <Link
                    to="/shop-by-manufacturers"
                    className="text-primary font-medium underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                  >
                    car batteries near me
                  </Link>{" "}
                  and fulfilling the heavy demands of residential and industrial clients. Our{" "}
                  <Link
                    to="/shop-by-category/$"
                    params={{ _splat: "inverter-battery" }}
                    className="text-primary font-medium underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                  >
                    inverter battery prices
                  </Link>{" "}
                  quoted on the web or by phone are thoroughly inclusive of GST.
                </p>
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                  Full Replacement Warranty & Reliable Customer Support
                </h4>
                <p>
                  We render every inverter for home and office with an excellent manufacturer replacement warranty so you can enjoy uninterrupted power services with peace of mind. Check our updated price catalogs to know the exact pricing of current models. Having served thousands of residential and commercial customers, our durable tubular battery solutions remain in high demand.
                </p>
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                  Eco-Friendly Old Battery Scrap Disposal
                </h4>
                <p>
                  Turn your spent or dead batteries into instant cash savings! When you select the scrap battery exchange option, our delivery technician securely collects your old battery and deducts the exchange value directly from your final bill. All scrap units are channeled to authorized smelters for responsible, eco-friendly green recycling.
                </p>
              </div>
            </div>

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
