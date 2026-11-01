import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { useQuery } from "@tanstack/react-query";
import { rootCategoriesQuery } from "@/queries";
import {
  Search,
  X,
  ArrowRight,
  ArrowUpRight,
  Car,
  Zap,
  Sun,
  BatteryCharging,
  ShieldCheck,
  Truck,
  PhoneCall,
  Layers,
  SearchX,
  Wrench,
  Sparkles,
  Cpu,
  CheckCircle2,
  ChevronRight,
  Home,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryListResponse } from "@/types/dto";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "All Battery Categories | BatteryMantra" },
      {
        name: "description",
        content:
          "Browse complete battery catalogue: Car batteries, Inverter batteries, Solar systems, Lithium power solutions and more with free installation across India.",
      },
    ],
  }),
  component: CategoriesPage,
});

// Helper to format string to slug
const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

// Smart category classification & styling
function getCategoryMeta(name: string) {
  const n = name.toLowerCase();

  if (n.includes("car")) {
    return {
      group: "AUTOMOTIVE",
      tag: "Automotive",
      tagColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
      description: "Cars, Sedans, SUVs & Hatchbacks",
      fallbackIcon: Car,
    };
  }
  if (n.includes("lithium")) {
    return {
      group: "SOLAR_LITHIUM",
      tag: "Next-Gen Energy",
      tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
      description: "LiFePO4 high efficiency & long life",
      fallbackIcon: BatteryCharging,
    };
  }
  if (n.includes("solar")) {
    return {
      group: "SOLAR_LITHIUM",
      tag: "Clean Energy",
      tagColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
      description: "Panels, Solar UPS & Storage",
      fallbackIcon: Sun,
    };
  }
  if (n.includes("inverter") && n.includes("combo")) {
    return {
      group: "INVERTER_BACKUP",
      tag: "Complete Set",
      tagColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300",
      description: "Inverter Machine + Tubular Battery",
      fallbackIcon: Zap,
    };
  }
  if (n.includes("inverter") && (n.includes("batter") || n.includes("home"))) {
    return {
      group: "INVERTER_BACKUP",
      tag: "Power Backup",
      tagColor: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300",
      description: "Short & Tall Tubular Power Backup",
      fallbackIcon: Zap,
    };
  }
  if (n.includes("stabiliz")) {
    return {
      group: "INVERTER_BACKUP",
      tag: "Voltage Guard",
      tagColor: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300",
      description: "AC & Mainline Voltage Regulators",
      fallbackIcon: Zap,
    };
  }
  if (n.includes("ups") || n.includes("computer")) {
    return {
      group: "COMMERCIAL_UPS",
      tag: "IT & Commercial",
      tagColor: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300",
      description: "Workstations, Servers & Systems",
      fallbackIcon: Cpu,
    };
  }
  if (n.includes("generator")) {
    return {
      group: "COMMERCIAL_UPS",
      tag: "Heavy Backup",
      tagColor: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300",
      description: "DG Sets & Commercial Generators",
      fallbackIcon: Zap,
    };
  }
  if (n.includes("truck") || n.includes("bus") || n.includes("tractor")) {
    return {
      group: "AUTOMOTIVE",
      tag: "Heavy Commercial",
      tagColor: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300",
      description: "Heavy Duty High-Cranking Batteries",
      fallbackIcon: Truck,
    };
  }
  if (n.includes("golf")) {
    return {
      group: "AUTOMOTIVE",
      tag: "Electric Mobility",
      tagColor: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300",
      description: "Deep Cycle Buggy & Cart Batteries",
      fallbackIcon: Car,
    };
  }
  if (n.includes("accessor") || n.includes("part")) {
    return {
      group: "INVERTER_BACKUP",
      tag: "Accessories",
      tagColor: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
      description: "Cables, Trolleys, Terminals & Spares",
      fallbackIcon: Wrench,
    };
  }

  return {
    group: "OTHER",
    tag: "Genuine Power",
    tagColor: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    description: "Verified Quality & Doorstep Service",
    fallbackIcon: Layers,
  };
}

// Navigation target helper
function getCategoryTarget(c: CategoryListResponse) {
  const rawSlug = c.categorySlug || toSlug(c.categoryName);
  const name = c.categoryName.toLowerCase();

  const isCar = /(^|\s)car(\s|$)/i.test(c.categoryName);
  if (isCar || c.clickAction === "SHOW_MANUFACTURERS") {
    return { to: "/shop-by-manufacturers" as const, params: undefined };
  }

  const isCategoryBrands =
    rawSlug === "inverter-battery" ||
    rawSlug === "generator-battery" ||
    rawSlug === "generator-batteries" ||
    c.clickAction === "SHOW_BRANDS";

  if (isCategoryBrands) {
    const targetSlug = rawSlug === "generator-battery" ? "generator-batteries" : rawSlug;
    return {
      to: "/shop-by-category/$" as const,
      params: { _splat: targetSlug },
    };
  }

  if (c.clickAction === "SHOW_PRODUCTS") {
    return {
      to: "/shop/c/$categorySlug" as const,
      params: { categorySlug: rawSlug },
    };
  }

  if (c.clickAction === "SHOW_SUBCATEGORIES" || (c.subCategories && c.subCategories.length > 0)) {
    return {
      to: "/shop-by-category/$" as const,
      params: { _splat: rawSlug },
    };
  }

  const isVehicle =
    name.includes("commercial") ||
    name.includes("tractor") ||
    name.includes("three wheeler") ||
    name.includes("3 wheeler");

  if (isVehicle) {
    return {
      to: "/manufacturers/$categorySlug" as const,
      params: { categorySlug: rawSlug },
    };
  }

  return {
    to: "/shop-by-category/$" as const,
    params: { _splat: rawSlug },
  };
}

type FilterTab = "ALL" | "AUTOMOTIVE" | "INVERTER_BACKUP" | "SOLAR_LITHIUM" | "COMMERCIAL_UPS";

const TABS: { id: FilterTab; label: string; icon: any }[] = [
  { id: "ALL", label: "All Categories", icon: Layers },
  { id: "AUTOMOTIVE", label: "Automotive & Vehicles", icon: Car },
  { id: "INVERTER_BACKUP", label: "Inverters & Home UPS", icon: Zap },
  { id: "SOLAR_LITHIUM", label: "Solar & Lithium", icon: Sun },
  { id: "COMMERCIAL_UPS", label: "Commercial & UPS", icon: Cpu },
];

function CategoriesPage() {
  const { data: rawCategories, isLoading } = useQuery(rootCategoriesQuery());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  // Filter out any dummy allcat entries and sort
  const categories = useMemo(() => {
    if (!rawCategories) return [];
    return rawCategories
      .filter((c) => !c.categoryName.toLowerCase().replace(/\s+/g, "").includes("allcat"))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [rawCategories]);

  // Counts per tab
  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      ALL: categories.length,
      AUTOMOTIVE: 0,
      INVERTER_BACKUP: 0,
      SOLAR_LITHIUM: 0,
      COMMERCIAL_UPS: 0,
    };
    categories.forEach((c) => {
      const meta = getCategoryMeta(c.categoryName);
      if (meta.group in counts) {
        counts[meta.group as FilterTab] = (counts[meta.group as FilterTab] || 0) + 1;
      }
    });
    return counts;
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories.filter((c) => {
      const meta = getCategoryMeta(c.categoryName);

      // Tab filter
      if (activeTab !== "ALL" && meta.group !== activeTab) {
        return false;
      }

      // Search filter
      if (q) {
        const matchesName = c.categoryName.toLowerCase().includes(q);
        const matchesTag = meta.tag.toLowerCase().includes(q);
        const matchesDesc = meta.description.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [categories, searchQuery, activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-background">
      {/* ================= HERO HEADER ================= */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-white via-red-50/20 to-slate-50/50 dark:from-background dark:via-background dark:to-muted/30 pt-6 pb-10 sm:pt-10 sm:pb-14">
        {/* Subtle decorative mesh blur */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-gradient-to-r from-red-500/10 via-rose-500/10 to-primary/10 blur-3xl opacity-70" />

        <Container size="xl" className="relative z-10 px-4">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">Categories</span>
          </nav>

          {/* Title Area */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 dark:bg-red-950/50 border border-red-200/80 dark:border-red-800 text-primary text-xs font-bold tracking-wide uppercase mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                Comprehensive Energy Catalogue
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-foreground tracking-tight leading-tight">
                Browse All{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-600 to-rose-600 dark:from-red-400 dark:via-rose-400 dark:to-red-400">
                  Categories
                </span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-muted-foreground leading-relaxed">
                Find the exact battery match for any vehicle, home inverter or commercial setup. Genuine warranty, free
                doorstep installation, and certified technicians.
              </p>
            </div>

            {/* Quick Search Box */}
            <div className="w-full md:w-80 lg:w-96 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search category (e.g. car, solar, ups)..."
                  className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-border text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-muted text-slate-400 hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide pt-6 mt-2 pb-1 border-t border-slate-200/60 dark:border-border/40">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = tabCounts[tab.id] ?? 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-2xs select-none",
                    isActive
                      ? "bg-slate-900 text-white dark:bg-primary dark:text-primary-foreground shadow-md -translate-y-0.5"
                      : "bg-white dark:bg-card text-slate-700 dark:text-muted-foreground border border-slate-200/80 dark:border-border/60 hover:border-primary/40 hover:text-primary"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-slate-400")} />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-muted text-slate-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ================= CATEGORY GRID CONTAINER ================= */}
      <Container size="xl" className="py-8 sm:py-12 px-4 flex-1">
        {/* Results Counter / Filter Indicator */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filteredCategories.length}</span> categories
            {searchQuery && (
              <span>
                {" "}
                matching &ldquo;<span className="text-primary font-semibold">{searchQuery}</span>&rdquo;
              </span>
            )}
          </p>

          {(searchQuery || activeTab !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("ALL");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-border/60 p-4 sm:p-5 flex flex-col justify-between h-[230px] sm:h-[260px]"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-muted rounded-full" />
                  <div className="h-7 w-7 bg-slate-200 dark:bg-muted rounded-full" />
                </div>
                <div className="my-auto mx-auto h-24 w-24 bg-slate-100 dark:bg-muted/70 rounded-2xl" />
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-border/40">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 dark:bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          /* Empty Search State */
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-primary flex items-center justify-center mx-auto mb-4 border border-red-100">
              <SearchX className="h-8 w-8 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-foreground">No Categories Found</h3>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">
              We couldn&apos;t find any battery category matching &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("ALL");
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              View All Categories
            </button>
          </div>
        ) : (
          /* ================= GRID OF CATEGORIES ================= */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
            {filteredCategories.map((c) => {
              const meta = getCategoryMeta(c.categoryName);
              const target = getCategoryTarget(c);
              const FallbackIcon = meta.fallbackIcon;

              return (
                <Link
                  key={c.categoryId}
                  to={target.to}
                  params={target.params as any}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-border/60 p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-brand/50 hover:shadow-[0_16px_32px_-12px_rgba(220,38,38,0.18)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-pointer h-[235px] sm:h-[265px]"
                >
                  {/* Subtle red corner glow on hover */}
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-brand/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Top Bar: Badge & Arrow */}
                  <div className="flex items-center justify-between gap-2 z-10">
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border truncate max-w-[120px]",
                        meta.tagColor
                      )}
                    >
                      {meta.tag}
                    </span>
                    <span className="w-7 h-7 shrink-0 rounded-full bg-slate-100/90 dark:bg-muted flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-300 shadow-xs">
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>

                  {/* Center Icon Pod */}
                  <div className="relative my-auto py-2 h-24 sm:h-28 w-full flex items-center justify-center z-10">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2.5 group-hover:scale-108 group-hover:border-red-100 transition-all duration-300 overflow-hidden">
                      {c.iconUrl ? (
                        <img
                          src={c.iconUrl}
                          alt={c.categoryName}
                          className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <FallbackIcon className="h-8 w-8 sm:h-10 sm:w-10 text-brand stroke-[1.8] group-hover:scale-110 transition-transform duration-200" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Info: Title & Action */}
                  <div className="z-10 mt-auto pt-2.5 border-t border-slate-100 dark:border-border/40">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-foreground group-hover:text-brand transition-colors line-clamp-1">
                      {c.categoryName}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-muted-foreground line-clamp-1 mt-0.5">
                      {meta.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-50 dark:border-border/20">
                      <span className="text-[11px] font-semibold text-brand flex items-center gap-1 group-hover:underline">
                        Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                      {c.subCategories && c.subCategories.length > 0 ? (
                        <span className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium">
                          {c.subCategories.length} Types
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> In Stock
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ================= TRUST BADGES STRIP ================= */}
        <section className="mt-14 sm:mt-20 pt-8 sm:pt-10 border-t border-slate-200/80 dark:border-border/60">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-card border border-slate-200/70 dark:border-border/60 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-brand flex items-center justify-center shrink-0 border border-red-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-foreground">100% Genuine</h4>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Direct brand warranty cards with verified serial numbers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-card border border-slate-200/70 dark:border-border/60 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-foreground">Free Installation</h4>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Doorstep fitment by trained certified technicians.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-card border border-slate-200/70 dark:border-border/60 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-foreground">Scrap Exchange</h4>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Get instant cash discount for your old battery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-card border border-slate-200/70 dark:border-border/60 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-foreground">Express Delivery</h4>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Delivered & fitted within 2-4 hours across major cities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BOTTOM CTA BANNER ================= */}
        <section className="mt-10 sm:mt-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-6 sm:p-10 shadow-xl">
          {/* Background Ambient Glow */}
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand/20 blur-3xl" />
          <div className="pointer-events-none absolute left-10 -top-20 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold tracking-wide uppercase mb-3 border border-white/10">
                ⚡ Need Personalized Help?
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Not sure which battery fits your requirement?
              </h3>
              <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                Use our automated Vehicle Finder to find the exact battery model in 2 clicks, or speak directly to a battery
                specialist for instant doorstep booking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/vehicle-finder"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand hover:bg-brand/90 text-white text-sm font-bold shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Car className="h-4 w-4" />
                Find by Vehicle
              </Link>
              <a
                href="tel:09200920051"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                <PhoneCall className="h-4 w-4 text-emerald-400" />
                Call Expert: 09200920051
              </a>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
