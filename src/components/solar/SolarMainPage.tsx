import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { productFilterQuery } from "@/queries";
import { ProductCard } from "@/components/products/ProductCard";
import { CategoryListResponse } from "@/types/dto";
import { SeoCityLinks } from "@/components/products/SeoCityLinks";
import { callbacksService } from "@/services/catalog.service";
import { toast } from "sonner";
import { 
  Sun, 
  ShieldCheck, 
  Truck, 
  Award, 
  Zap, 
  Calculator, 
  IndianRupee, 
  FileCheck, 
  LayoutGrid, 
  ChevronRight, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  BadgeCheck, 
  Gauge, 
  Sparkles, 
  Check, 
  X, 
  Flame, 
  PhoneCall, 
  Phone, 
  ArrowRight,
  Shield,
  Star
} from "lucide-react";

const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

interface SolarMainPageProps {
  category: CategoryListResponse;
  subcategories: CategoryListResponse[];
}

export function SolarMainPage({ category, subcategories }: SolarMainPageProps) {
  // Fetch real products under this solar category
  const { data: productsData, isLoading: isProductsLoading } = useQuery(
    productFilterQuery({ categoryId: [category.categoryId], size: 8 })
  );
  const products = productsData?.content || [];

  // Lead capture state
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setIsSubmitting(true);
      await callbacksService.create({ mobileNumber: cleanPhone });
      toast.success("Callback request submitted! A certified solar engineer will call you shortly.");
      setPhone("");
    } catch {
      toast.error("Failed to submit request. Please try calling us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to find subcategory by matching keyword
  const findSubCategory = (keyword: string) => {
    return subcategories.find((c) =>
      c.categoryName.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const panelsCat = findSubCategory("panel");
  const invertersCat = findSubCategory("inverter");
  const batteriesCat = findSubCategory("tubular") || findSubCategory("battery");
  const accessoriesCat = findSubCategory("accessories") || findSubCategory("accessory");

  const getSubCatLink = (subCat?: CategoryListResponse, fallbackSlug: string = "") => {
    if (subCat) {
      return `/shop-by-category/${subCat.categorySlug || toSlug(subCat.categoryName)}`;
    }
    return `/shop-by-category/${fallbackSlug}`;
  };

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen text-slate-900 selection:bg-amber-100 selection:text-amber-900 pb-16">
      <Container size="xl" className="py-4 sm:py-6 space-y-12 sm:space-y-16">
        
        {/* BREADCRUMB */}
        <nav className="flex items-center text-xs sm:text-sm text-slate-500 font-medium space-x-2 pt-2">
          <Link to="/" className="hover:text-red-600 transition-colors flex items-center gap-1.5">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">Clean Energy</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold">{category.categoryName || "Solar Energy Solutions"}</span>
        </nav>

        {/* 1. HERO BANNER SECTION */}
        <section className="relative bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 p-6 sm:p-10 lg:p-12 items-center relative z-10">
            {/* Left: Copy & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold uppercase tracking-wider">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Govt. Subsidy Certified & Verified
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
                Power Your Home With The Sun —{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-red-600 to-amber-500">
                  Complete Solar Solutions
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Slash your electricity bills by up to <strong className="text-emerald-700 font-bold">90%</strong> with next-gen solar panels, smart inverters, and heavy-duty tubular batteries from India's most trusted power portal.
              </p>

              {/* Floating Micro Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">25 Years Warranty</p>
                    <p className="text-[11px] text-slate-500">Linear output safety</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Save ₹40,000/yr</p>
                    <p className="text-[11px] text-slate-500">Average household</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">PM Surya Ghar</p>
                    <p className="text-[11px] text-slate-500">Direct Subsidy Ready</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a 
                  href="#featured-products" 
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-base shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Explore Solar Range
                </a>
                <a 
                  href="#sizing-guide" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-xl text-base transition-colors shadow-xs"
                >
                  <Calculator className="w-4 h-4 text-amber-500" />
                  Calculate Solar Savings
                </a>
              </div>

              {/* Trust snippet */}
              <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 font-medium">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-amber-400 border border-white text-[10px] font-bold text-slate-900 flex items-center justify-center">L</div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border border-white text-[10px] font-bold text-white flex items-center justify-center">T</div>
                  <div className="w-6 h-6 rounded-full bg-red-500 border border-white text-[10px] font-bold text-white flex items-center justify-center">E</div>
                  <div className="w-6 h-6 rounded-full bg-blue-600 border border-white text-[10px] font-bold text-white flex items-center justify-center">M</div>
                </div>
                <span>Authorized dealer for <strong>Luminous, Tata Power, Exide & Microtek</strong></span>
              </div>
            </div>

            {/* Right: Modern Vector Visual with Live Stat Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-gradient-to-b from-sky-50 to-amber-50/40 p-4">
                
                {/* Rooftop Solar Illustration Container */}
                <div className="relative h-72 sm:h-80 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                  <svg viewBox="0 0 500 340" className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8"/>
                        <stop offset="40%" stopColor="#7dd3fc"/>
                        <stop offset="100%" stopColor="#fef08a"/>
                      </linearGradient>
                      <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0f172a"/>
                        <stop offset="50%" stopColor="#1e293b"/>
                        <stop offset="100%" stopColor="#0284c7"/>
                      </linearGradient>
                      <radialGradient id="sunGlow" cx="80%" cy="20%" r="50%">
                        <stop offset="0%" stopColor="#ffffff"/>
                        <stop offset="20%" stopColor="#fbbf24" stopOpacity="0.9"/>
                        <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
                      </radialGradient>
                    </defs>
                    <rect width="500" height="340" fill="url(#skyGrad)"/>
                    <circle cx="410" cy="70" r="90" fill="url(#sunGlow)"/>
                    <circle cx="410" cy="70" r="32" fill="#fffbeb"/>

                    <polygon points="40,240 250,150 460,240 460,340 40,340" fill="#f1f5f9"/>
                    <polygon points="250,150 460,240 480,250 250,165" fill="#cbd5e1"/>
                    <polygon points="40,240 250,150 250,165 20,250" fill="#94a3b8"/>
                    
                    <g transform="translate(60, 195) skewY(-22) scale(0.85)">
                      <rect x="0" y="0" width="70" height="45" rx="3" fill="url(#panelGrad)" stroke="#38bdf8" strokeWidth="1.5"/>
                      <line x1="23" y1="0" x2="23" y2="45" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                      <line x1="47" y1="0" x2="47" y2="45" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                      <line x1="0" y1="22" x2="70" y2="22" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>

                      <rect x="76" y="0" width="70" height="45" rx="3" fill="url(#panelGrad)" stroke="#38bdf8" strokeWidth="1.5"/>
                      <line x1="99" y1="0" x2="99" y2="45" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                      <line x1="123" y1="0" x2="123" y2="45" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                      <line x1="76" y1="22" x2="146" y2="22" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>

                      <rect x="0" y="52" width="70" height="45" rx="3" fill="url(#panelGrad)" stroke="#38bdf8" strokeWidth="1.5"/>
                      <line x1="23" y1="52" x2="23" y2="97" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                      <line x1="47" y1="52" x2="47" y2="97" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                      <line x1="0" y1="74" x2="70" y2="74" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>

                      <rect x="76" y="52" width="70" height="45" rx="3" fill="url(#panelGrad)" stroke="#38bdf8" strokeWidth="1.5"/>
                      <line x1="99" y1="52" x2="99" y2="97" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                      <line x1="123" y1="52" x2="123" y2="97" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                      <line x1="76" y1="74" x2="146" y2="74" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>
                    </g>

                    <path d="M380 90 L200 210" stroke="#fef08a" strokeWidth="2" strokeDasharray="4 4" opacity="0.7"/>
                    <path d="M400 110 L280 220" stroke="#fef08a" strokeWidth="2" strokeDasharray="4 4" opacity="0.7"/>
                  </svg>

                  {/* Live Generation Pill */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/60 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-semibold text-slate-800">Clean Power Gen: <strong>4.8 kW/h</strong></span>
                  </div>
                </div>

                {/* Floating Overlay Card 1: Subsidy */}
                <div className="absolute -bottom-3 -left-3 bg-white p-3.5 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-3 max-w-[210px]">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Solar Subsidy</p>
                    <p className="text-xs font-bold text-slate-900">Up to ₹78,000</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Under Direct DBT</p>
                  </div>
                </div>

                {/* Floating Overlay Card 2: Installations */}
                <div className="absolute -top-3 -right-3 bg-white p-3 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="text-left pr-1">
                    <p className="text-xs font-bold text-slate-900">10,000+ Homes</p>
                    <p className="text-[10px] text-slate-500">Energized in India</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 2. CORE SUB-CATEGORIES SHOWCASE (4-COLUMN INTERACTIVE GRID) */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                <LayoutGrid className="w-3.5 h-3.5" /> Product Range
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Explore Solar Power Categories
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Handpicked equipment engineered for high tropical temperatures and Indian grid reliability.
              </p>
            </div>
            <a 
              href="#featured-products" 
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              View All Solar Range <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Sub-cat 1: Solar Panels */}
            <Link 
              to={getSubCatLink(panelsCat, "solar-panel")} 
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    High Efficiency
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Top Models</span>
                </div>

                <div className="h-44 w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 mb-4 group-hover:bg-amber-50/30 transition-colors">
                  {panelsCat?.iconUrl ? (
                    <img 
                      src={panelsCat.iconUrl} 
                      alt={panelsCat.categoryName} 
                      className="w-32 h-32 object-contain"
                    />
                  ) : (
                    <svg viewBox="0 0 160 160" className="w-32 h-32 object-contain" xmlns="http://www.w3.org/2000/svg">
                      <rect x="15" y="15" width="130" height="130" rx="8" fill="#0f172a" stroke="#cbd5e1" strokeWidth="4"/>
                      <rect x="23" y="23" width="114" height="114" rx="4" fill="#0284c7" opacity="0.9"/>
                      <line x1="23" y1="61" x2="137" y2="61" stroke="#e0f2fe" strokeWidth="1.5"/>
                      <line x1="23" y1="99" x2="137" y2="99" stroke="#e0f2fe" strokeWidth="1.5"/>
                      <line x1="61" y1="23" x2="61" y2="137" stroke="#e0f2fe" strokeWidth="1.5"/>
                      <line x1="99" y1="23" x2="99" y2="137" stroke="#e0f2fe" strokeWidth="1.5"/>
                      <circle cx="42" cy="42" r="3" fill="#ffffff" opacity="0.7"/>
                      <circle cx="80" cy="42" r="3" fill="#ffffff" opacity="0.7"/>
                      <circle cx="118" cy="42" r="3" fill="#ffffff" opacity="0.7"/>
                    </svg>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {panelsCat?.categoryName || "Solar Panels"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mono-PERC, Half-Cut & Bifacial Modules with up to 22.8% cell efficiency.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Genuine Brands</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
                  Shop Panels <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Sub-cat 2: Solar Inverters */}
            <Link 
              to={getSubCatLink(invertersCat, "solar-inverter")} 
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                    Smart MPPT
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Sine Wave</span>
                </div>

                <div className="h-44 w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 mb-4 group-hover:bg-amber-50/30 transition-colors">
                  {invertersCat?.iconUrl ? (
                    <img 
                      src={invertersCat.iconUrl} 
                      alt={invertersCat.categoryName} 
                      className="w-32 h-32 object-contain"
                    />
                  ) : (
                    <svg viewBox="0 0 160 160" className="w-32 h-32 object-contain" xmlns="http://www.w3.org/2000/svg">
                      <rect x="30" y="20" width="100" height="120" rx="10" fill="#ffffff" stroke="#94a3b8" strokeWidth="3"/>
                      <rect x="42" y="32" width="76" height="40" rx="4" fill="#0f172a"/>
                      <text x="50" y="52" fill="#10b981" fontSize="10" fontFamily="monospace">GEN: 3.2 kW</text>
                      <text x="50" y="65" fill="#38bdf8" fontSize="9" fontFamily="monospace">GRID: 230V OK</text>
                      <circle cx="80" cy="95" r="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
                      <path d="M76 95 L84 95 M80 91 L80 99" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="45" y1="124" x2="115" y2="124" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="50" y1="129" x2="110" y2="129" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {invertersCat?.categoryName || "Solar Inverters"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  On-Grid, Off-Grid & Hybrid PCU Inverters with built-in solar prioritizing.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">High Efficiency</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
                  Shop Inverters <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Sub-cat 3: Solar Tubular Batteries */}
            <Link 
              to={getSubCatLink(batteriesCat, "solar-tubular-battery")} 
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    Deep Cycle C10
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Heavy Backup</span>
                </div>

                <div className="h-44 w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 mb-4 group-hover:bg-amber-50/30 transition-colors">
                  {batteriesCat?.iconUrl ? (
                    <img 
                      src={batteriesCat.iconUrl} 
                      alt={batteriesCat.categoryName} 
                      className="w-32 h-32 object-contain"
                    />
                  ) : (
                    <svg viewBox="0 0 160 160" className="w-32 h-32 object-contain" xmlns="http://www.w3.org/2000/svg">
                      <rect x="25" y="45" width="110" height="95" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="3"/>
                      <rect x="20" y="32" width="120" height="16" rx="4" fill="#dc2626"/>
                      <rect x="36" y="24" width="12" height="10" rx="2" fill="#ef4444"/>
                      <rect x="112" y="24" width="12" height="10" rx="2" fill="#3b82f6"/>
                      <circle cx="56" cy="40" r="3" fill="#ffffff"/>
                      <circle cx="72" cy="40" r="3" fill="#ffffff"/>
                      <circle cx="88" cy="40" r="3" fill="#ffffff"/>
                      <circle cx="104" cy="40" r="3" fill="#ffffff"/>
                      <rect x="35" y="60" width="90" height="40" rx="3" fill="#ffffff"/>
                      <text x="42" y="78" fill="#dc2626" fontSize="10" fontWeight="bold">SOLAR TUBULAR</text>
                      <text x="42" y="92" fill="#0f172a" fontSize="9" fontWeight="bold">150Ah - C10 RATING</text>
                    </svg>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {batteriesCat?.categoryName || "Solar Tubular Batteries"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Heavy-duty tall tubular backup batteries with 1500+ deep cycles and minimal water loss.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Long Life</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
                  Shop Batteries <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Sub-cat 4: Solar Accessories */}
            <Link 
              to={getSubCatLink(accessoriesCat, "solar-accessories")} 
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                    All-in-One Kits
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Installation</span>
                </div>

                <div className="h-44 w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 mb-4 group-hover:bg-amber-50/30 transition-colors">
                  {accessoriesCat?.iconUrl ? (
                    <img 
                      src={accessoriesCat.iconUrl} 
                      alt={accessoriesCat.categoryName} 
                      className="w-32 h-32 object-contain"
                    />
                  ) : (
                    <svg viewBox="0 0 160 160" className="w-32 h-32 object-contain" xmlns="http://www.w3.org/2000/svg">
                      <rect x="20" y="115" width="120" height="14" rx="2" fill="#94a3b8" stroke="#64748b" strokeWidth="2"/>
                      <polygon points="35,115 50,65 65,115" fill="#cbd5e1" stroke="#64748b" strokeWidth="2"/>
                      <rect x="60" y="30" width="40" height="16" rx="4" fill="#0f172a"/>
                      <rect x="52" y="34" width="8" height="8" rx="1" fill="#dc2626"/>
                      <rect x="100" y="34" width="8" height="8" rx="1" fill="#38bdf8"/>
                      <circle cx="110" cy="75" r="22" fill="none" stroke="#dc2626" strokeWidth="5"/>
                      <circle cx="110" cy="75" r="16" fill="none" stroke="#0f172a" strokeWidth="5"/>
                    </svg>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {accessoriesCat?.categoryName || "Solar Accessories"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  GI mounting structures, MC4 branch connectors, DC cables, and surge lightning arrestors.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Safety First</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
                  Shop Accessories <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 3. "WHY GO SOLAR WITH BATTERY MANTRA?" */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">The Battery Mantra Advantage</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Why Go Solar With Battery Mantra?</h2>
            <p className="text-sm text-slate-500 mt-2">Delivering certified solar hardware, authentic warranty, and guaranteed doorstep engineering since 2017.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                <Sun className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero / Lowest Electric Bills</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Generate clean power during peak daytime hours and offset DISCOM grid charges to drop monthly bills to the bare minimum.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <TrendingDown className="w-4 h-4" /> Up to 90% Savings
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">25-Year Long Life Warranty</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Only 100% genuine Tier-1 modules backed by manufacturer warranty cards, linear output guarantees, and full serial number registration.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Tier-1 Tested
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-red-300 hover:bg-red-50/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-5">
                <Truck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Installation in 24-48 Hrs</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Quick rooftop shadow-feasibility check, structural mounting, and certified electrical wiring carried out by experienced engineers.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock className="w-4 h-4 text-red-600" /> Express Service
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-5">
                <Award className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Top Trusted Brands</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Partnered directly with Luminous, Tata Power Solar, Microtek, Exide, Livguard, and Eastman for guaranteed original hardware.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-700">
                <BadgeCheck className="w-4 h-4" /> 100% Original
              </div>
            </div>
          </div>
        </section>

        {/* 4. SOLAR SYSTEM SIZING / CAPACITY SELECTOR GUIDE */}
        <section id="sizing-guide" className="space-y-6 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-xs font-semibold">
              <Gauge className="w-3.5 h-3.5 text-amber-500" /> Quick Sizing Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Find The Right Solar Capacity For Your Home
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select your household requirement to view ideal panel wattage, inverter rating, and estimated monthly electricity savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Tier 1: 1kW - 2kW */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compact Homes</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">1-2 BHK</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mt-2">1 kW – 2 kW System</h3>
                <p className="text-xs text-slate-500 mt-1">Ideal for small flats, independent single-floor homes, or rural backup.</p>

                <div className="mt-6 p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Estimated Monthly Savings</p>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">₹1,500 – ₹2,500<span className="text-xs font-normal text-emerald-600">/mo</span></p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Generates approx. 4–8 units/day</p>
                </div>

                <div className="mt-6 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">What It Can Power:</p>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>4-6 LED Lights + 3-4 Ceiling Fans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1 Smart TV + Wi-Fi Router + Laptops</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1 Energy Efficient Refrigerator</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400 line-through">
                      <X className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Air Conditioner (Requires 3kW+)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <a 
                  href="#consultation"
                  className="block text-center w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-red-600 text-slate-800 hover:text-red-600 font-semibold text-xs tracking-wide transition-colors"
                >
                  Configure 1kW–2kW Setup
                </a>
              </div>
            </div>

            {/* Tier 2: 3kW - 5kW (Most Popular Card) */}
            <div className="bg-white rounded-3xl border-2 border-amber-500 p-6 sm:p-7 flex flex-col justify-between shadow-md hover:shadow-lg transition-all relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold py-1 px-4 rounded-full shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 fill-white" /> Most Popular Choice
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Standard Indian Family</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold">3-4 BHK</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mt-2">3 kW – 5 kW System</h3>
                <p className="text-xs text-slate-500 mt-1">Perfect for 3-4 BHK independent homes with daytime air conditioning & washing machines.</p>

                <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">Estimated Monthly Savings</p>
                  <p className="text-2xl font-black text-amber-900 mt-0.5">₹4,500 – ₹7,500<span className="text-xs font-normal text-amber-700">/mo</span></p>
                  <p className="text-[11px] text-amber-800 mt-0.5">Generates approx. 12–20 units/day</p>
                </div>

                <div className="mt-6 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">What It Can Power:</p>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>1 to 2 Inverter ACs (1.5 Ton)</strong> during day</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Full house lights, fans & entertainment devices</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Washing Machine, Microwave, Double-door Fridge</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>0.5 HP – 1 HP Water Pump running</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <a 
                  href="#consultation"
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs tracking-wide shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Configure 3kW–5kW Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Tier 3: 5kW - 10kW+ */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Consumption</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">Villas / Commercial</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mt-2">5 kW – 10 kW+ System</h3>
                <p className="text-xs text-slate-500 mt-1">Engineered for large bungalows, duplexes, multi-floor buildings & small commercial shops.</p>

                <div className="mt-6 p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Estimated Monthly Savings</p>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">₹8,000 – ₹18,000+<span className="text-xs font-normal text-emerald-600">/mo</span></p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Generates 25–45+ units/day</p>
                </div>

                <div className="mt-6 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">What It Can Power:</p>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>3 to 4 Inverter ACs</strong> running concurrently</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Submersible water pumps (1.5 HP to 2 HP)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>EV 2-Wheeler / 4-Wheeler slow charging</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Zero electric bill with Net-Metering export</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <a 
                  href="#consultation"
                  className="block text-center w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-red-600 text-slate-800 hover:text-red-600 font-semibold text-xs tracking-wide transition-colors"
                >
                  Configure 5kW–10kW Setup
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FEATURED / BEST SELLING SOLAR PRODUCTS */}
        <section id="featured-products" className="space-y-6 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <Flame className="w-3.5 h-3.5 fill-red-600" /> Verified Best Sellers
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Top Rated Solar Products in India
              </h2>
              <p className="text-sm text-slate-500 mt-1">Directly dispatched with manufacturer seal, GST invoice & warranty support.</p>
            </div>

            {/* Quick Subcategory Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {panelsCat && (
                <Link
                  to={getSubCatLink(panelsCat)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shrink-0"
                >
                  Panels
                </Link>
              )}
              {invertersCat && (
                <Link
                  to={getSubCatLink(invertersCat)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shrink-0"
                >
                  Inverters
                </Link>
              )}
              {batteriesCat && (
                <Link
                  to={getSubCatLink(batteriesCat)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shrink-0"
                >
                  Batteries
                </Link>
              )}
              {accessoriesCat && (
                <Link
                  to={getSubCatLink(accessoriesCat)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shrink-0"
                >
                  Accessories
                </Link>
              )}
            </div>
          </div>

          {/* Real Products Grid if available from API */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          ) : isProductsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : (
            /* Curated Fallback Grid if no products tagged directly to root */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Product Card 1 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider">
                      Luminous Solar
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                    </span>
                  </div>

                  <div className="h-44 w-full bg-slate-50 rounded-xl flex items-center justify-center p-3 relative overflow-hidden group-hover:bg-amber-50/20 transition-colors">
                    <svg viewBox="0 0 140 140" className="w-28 h-28 object-contain" xmlns="http://www.w3.org/2000/svg">
                      <rect x="15" y="10" width="110" height="120" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="3"/>
                      <rect x="22" y="16" width="96" height="108" fill="#0284c7"/>
                      <line x1="22" y1="52" x2="118" y2="52" stroke="#e0f2fe" strokeWidth="1"/>
                      <line x1="22" y1="88" x2="118" y2="88" stroke="#e0f2fe" strokeWidth="1"/>
                      <line x1="54" y1="16" x2="54" y2="124" stroke="#e0f2fe" strokeWidth="1"/>
                      <line x1="86" y1="16" x2="86" y2="124" stroke="#e0f2fe" strokeWidth="1"/>
                    </svg>
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-white/90 text-[10px] font-semibold text-slate-700 shadow-xs">
                      545W Mono PERC
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                      ))}
                    </div>
                    <span className="text-slate-700 font-bold">4.9</span>
                    <span className="text-slate-400 text-[11px] font-normal">(184 reviews)</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    Luminous 545W 24V Half-Cut Mono PERC Solar Panel
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">High efficiency in low light conditions. 25-yr linear guarantee.</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-900">₹19,250</span>
                    <span className="text-xs text-slate-400 line-through">₹24,500</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">21% OFF</span>
                  </div>

                  <Link 
                    to={getSubCatLink(panelsCat, "solar-panel")}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    View Solar Panels
                  </Link>
                </div>
              </div>

              {/* Product Card 2 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider">
                      Microtek Solar
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                    </span>
                  </div>

                  <div className="h-44 w-full bg-slate-50 rounded-xl flex items-center justify-center p-3 relative overflow-hidden group-hover:bg-amber-50/20 transition-colors">
                    <svg viewBox="0 0 140 140" className="w-28 h-28 object-contain" xmlns="http://www.w3.org/2000/svg">
                      <rect x="25" y="15" width="90" height="110" rx="8" fill="#ffffff" stroke="#0f172a" strokeWidth="3"/>
                      <rect x="35" y="25" width="70" height="35" rx="3" fill="#0f172a"/>
                      <circle cx="50" cy="42" r="3" fill="#10b981"/>
                      <line x1="60" y1="42" x2="90" y2="42" stroke="#38bdf8" strokeWidth="2"/>
                      <rect x="45" y="72" width="50" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>
                      <text x="50" y="86" fill="#dc2626" fontSize="8" fontWeight="bold">MPPT 3.5kVA</text>
                    </svg>
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-white/90 text-[10px] font-semibold text-slate-700 shadow-xs">
                      Solar PCU
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                      ))}
                    </div>
                    <span className="text-slate-700 font-bold">4.8</span>
                    <span className="text-slate-400 text-[11px] font-normal">(92 reviews)</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    Microtek Solar PCU 3.5 kVA / 48V Pure Sine Wave Inverter
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">Dual solar prioritization, heavy transformer, runs home AC and water pumps.</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-900">₹32,900</span>
                    <span className="text-xs text-slate-400 line-through">₹41,000</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">20% OFF</span>
                  </div>

                  <Link 
                    to={getSubCatLink(invertersCat, "solar-inverter")}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    View Solar Inverters
                  </Link>
                </div>
              </div>

              {/* Product Card 3 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider">
                      Exide Solar
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                    </span>
                  </div>

                  <div className="h-44 w-full bg-slate-50 rounded-xl flex items-center justify-center p-3 relative overflow-hidden group-hover:bg-amber-50/20 transition-colors">
                    <svg viewBox="0 0 140 140" className="w-28 h-28 object-contain" xmlns="http://www.w3.org/2000/svg">
                      <rect x="25" y="40" width="90" height="85" rx="5" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5"/>
                      <rect x="20" y="28" width="100" height="14" rx="3" fill="#dc2626"/>
                      <rect x="35" y="20" width="10" height="8" rx="2" fill="#ef4444"/>
                      <rect x="95" y="20" width="10" height="8" rx="2" fill="#3b82f6"/>
                      <rect x="35" y="55" width="70" height="35" rx="2" fill="#ffffff"/>
                      <text x="40" y="70" fill="#dc2626" fontSize="8" fontWeight="bold">EXIDE TUBULAR</text>
                      <text x="40" y="82" fill="#0f172a" fontSize="7" fontWeight="bold">SOLATRON 150AH</text>
                    </svg>
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-white/90 text-[10px] font-semibold text-slate-700 shadow-xs">
                      60 Months Warranty
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                      ))}
                    </div>
                    <span className="text-slate-700 font-bold">4.7</span>
                    <span className="text-slate-400 text-[11px] font-normal">(210 reviews)</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    Exide Solatron 150Ah Tall Tubular Solar Battery (C10)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">Formulated with special antimony selenium alloy for maximum heat tolerance.</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-900">₹15,400</span>
                    <span className="text-xs text-slate-400 line-through">₹18,900</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">18% OFF</span>
                  </div>

                  <Link 
                    to={getSubCatLink(batteriesCat, "solar-tubular-battery")}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    View Solar Batteries
                  </Link>
                </div>
              </div>

              {/* Product Card 4 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider">
                      Tata Power Solar
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                    </span>
                  </div>

                  <div className="h-44 w-full bg-slate-50 rounded-xl flex items-center justify-center p-3 relative overflow-hidden group-hover:bg-amber-50/20 transition-colors">
                    <svg viewBox="0 0 140 140" className="w-28 h-28 object-contain" xmlns="http://www.w3.org/2000/svg">
                      <rect x="20" y="15" width="100" height="110" rx="4" fill="#0f172a" stroke="#0284c7" strokeWidth="2.5"/>
                      <rect x="26" y="21" width="88" height="98" fill="#1e3a8a"/>
                      <line x1="26" y1="54" x2="114" y2="54" stroke="#60a5fa" strokeWidth="1.2"/>
                      <line x1="26" y1="87" x2="114" y2="87" stroke="#60a5fa" strokeWidth="1.2"/>
                      <line x1="55" y1="21" x2="55" y2="119" stroke="#60a5fa" strokeWidth="1.2"/>
                      <line x1="85" y1="21" x2="85" y2="119" stroke="#60a5fa" strokeWidth="1.2"/>
                    </svg>
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-white/90 text-[10px] font-semibold text-slate-700 shadow-xs">
                      Bifacial Dual-Glass
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                      ))}
                    </div>
                    <span className="text-slate-700 font-bold">4.9</span>
                    <span className="text-slate-400 text-[11px] font-normal">(145 reviews)</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    Tata Power Solar 550W Bifacial Dual-Glass Solar Module
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">Absorbs sunlight from both front and rear albedo reflections for extra power.</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-900">₹21,800</span>
                    <span className="text-xs text-slate-400 line-through">₹27,000</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">19% OFF</span>
                  </div>

                  <Link 
                    to={getSubCatLink(panelsCat, "solar-panel")}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    View Solar Panels
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 6. EXPERT SOLAR CONSULTATION BANNER (LEAD CAPTURE) */}
        <section id="consultation" className="bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/70 rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xs relative overflow-hidden scroll-mt-20">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center relative z-10 space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <PhoneCall className="w-3.5 h-3.5" /> Free Solar Feasibility Check
            </span>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Confused about panel capacity or battery sizing for your home?
            </h2>

            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Book a <strong className="text-slate-900">Free 10-Minute Consultation</strong> with our Certified Solar Engineers. We analyze your electricity bill and recommend the optimum setup.
            </p>

            {/* Lead Capture Form */}
            <form onSubmit={handleCallbackSubmit} className="pt-4 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number (+91)" 
                    maxLength={10}
                    required 
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all shadow-xs"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-7 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow transition-all shrink-0 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? "Submitting..." : "Request Callback"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> No Spam Guarantee
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Free Bill Analysis
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Subsidy Guidance Included
              </div>
            </div>
          </div>
        </section>

        {/* 7. SEO CITY LINKS */}
        <div className="pt-6">
          <SeoCityLinks productName={category?.categoryName || "Solar Energy Products"} />
        </div>

      </Container>
    </div>
  );
}
