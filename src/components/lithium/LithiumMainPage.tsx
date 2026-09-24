import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { productFilterQuery } from "@/queries";
import { ProductCard } from "@/components/products/ProductCard";
import { ShieldCheck, Award, Truck, BadgeIndianRupee, Battery, BatteryCharging, Sun, ArrowRight, Leaf, Zap, Home, Building2, Store } from "lucide-react";
import { CategoryListResponse } from "@/types/dto";

const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

export function LithiumMainPage({
  category,
  subcategories
}: {
  category: CategoryListResponse;
  subcategories: CategoryListResponse[];
}) {
  const { data } = useQuery(productFilterQuery({ categoryId: [category.categoryId], size: 4 }));
  const products = data?.content || [];

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen">

      {/* Hero Banner Area */}
      <div className="relative pb-16 sm:pb-24 pt-10 sm:pt-16 overflow-hidden min-h-[450px] flex items-center">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/lithium/lithium-main-page-banner.webp" 
            alt="Lithium Power Banner" 
            className="w-full h-full object-cover object-[70%_center] md:object-center" 
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent"></div>
          <div className="absolute inset-0 bg-white/40 md:bg-white/20 backdrop-blur-[2px] md:backdrop-blur-none"></div>
        </div>
        
        <Container size="xl" className="relative z-10 w-full py-8">
          
          <div className="w-full text-center mb-6 md:mb-10">
            <span 
              className="text-3xl md:text-4xl text-emerald-950 font-bold drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)] leading-tight block"
              style={{ fontFamily: '"Dancing Script", cursive' }}
            >
              Same Trust<br />More Possibilities
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            
            {/* Left Side: Text */}
            <div className="flex-1 text-center md:text-left">
              <span className="text-emerald-700 font-extrabold tracking-[0.2em] text-xs uppercase mb-4 block">
                SMART POWER SOLUTIONS
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight text-slate-900">
                Choose Your <br/>
                <span className="text-emerald-600">Lithium Power Solution</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium max-w-xl mx-auto md:mx-0">
                Advanced. Reliable. Future Ready. Experience the next generation of power backup for your home and office.
              </p>
            </div>

            {/* Right Side: Features */}
            <div className="flex-1 flex flex-col items-center md:items-end justify-end w-full gap-8 md:pr-4 mt-4 md:mt-0">
              
              <div className="flex flex-row md:flex-col gap-4 md:gap-6 text-white bg-white/10 backdrop-blur-2xl p-4 md:p-6 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/30 w-full md:w-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x md:overflow-visible relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-50 before:pointer-events-none after:absolute after:inset-0 after:shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]">
                
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-2 md:gap-4 relative z-10 w-full shrink-0 snap-center min-w-[100px] md:min-w-0 group">
                  <span className="text-center md:text-right text-xs md:text-sm font-semibold tracking-wide drop-shadow-md order-2 md:order-1">Longer<br className="hidden md:block"/> Backup</span>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform order-1 md:order-2">
                    <BatteryCharging className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-2 md:gap-4 relative z-10 w-full shrink-0 snap-center min-w-[100px] md:min-w-0 group">
                  <span className="text-center md:text-right text-xs md:text-sm font-semibold tracking-wide drop-shadow-md order-2 md:order-1">Lower<br className="hidden md:block"/> Cost</span>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform order-1 md:order-2">
                    <BadgeIndianRupee className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-2 md:gap-4 relative z-10 w-full shrink-0 snap-center min-w-[100px] md:min-w-0 group">
                  <span className="text-center md:text-right text-xs md:text-sm font-semibold tracking-wide drop-shadow-md order-2 md:order-1">Cleaner<br className="hidden md:block"/> Greener</span>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform order-1 md:order-2">
                    <Leaf className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </Container>
      </div>

      {/* Options Cards */}
      <Container size="xl" className="-mt-10 sm:-mt-16 relative z-10 mb-10 sm:mb-16 md:px-4">
        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-4 sm:gap-6 pb-6 md:pb-0 px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {/* Card 1: Lithium Battery for Inverter */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col group border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300 w-[85vw] sm:w-[45vw] md:w-auto shrink-0 snap-center">
            <div className="p-6 bg-[#ebf4ff] flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white font-bold flex items-center justify-center shrink-0">1</div>
                <h3 className="text-xl font-bold text-[#1e40af] leading-tight">Lithium Battery<br />for Inverter</h3>
              </div>
              <p className="text-sm text-[#1e3a8a] h-12 leading-snug">
                Upgrade your existing inverter with lithium. Enjoy longer backup, faster charging and zero maintenance.
              </p>
            </div>
            <div className="w-full bg-white relative border-y border-white">
              <img src="/images/lithium/inverter-battery.png" alt="Lithium Battery for Inverter" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5 bg-[#ebf4ff] flex-1 flex flex-col">
              <div className="grid grid-cols-4 gap-2 mb-5 text-center text-[10px] sm:text-xs font-semibold text-[#1e3a8a]">
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Battery className="w-4 h-4 text-[#2563eb]" /></div>Longer<br />Life</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><BatteryCharging className="w-4 h-4 text-[#2563eb]" /></div>Fast<br />Charging</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><ShieldCheck className="w-4 h-4 text-[#2563eb]" /></div>Zero<br />Maintenance</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Leaf className="w-4 h-4 text-[#2563eb]" /></div>Lightweight<br />& Compact</div>
              </div>
              <Link
                to="/shop-by-category/$"
                params={{ 
                  _splat: subcategories.find(c => 
                    (c.categoryName.toLowerCase().includes("battery for inverter") || c.categoryName.toLowerCase().includes("inverter battery")) && 
                    !c.categoryName.toLowerCase().includes("integrated") && 
                    !c.categoryName.toLowerCase().includes("solar")
                  )?.categorySlug || "lithium-battery-for-inverter" 
                }}
                className="w-full mt-auto py-3 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                Shop Lithium Batteries <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Lithium Integrated Inverter Battery */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col group border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300 w-[85vw] sm:w-[45vw] md:w-auto shrink-0 snap-center">
            <div className="p-6 bg-[#ecfdf5] flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#065f46] text-white font-bold flex items-center justify-center shrink-0">2</div>
                <h3 className="text-xl font-bold text-[#065f46] leading-tight">Lithium Integrated<br />Inverter Battery</h3>
              </div>
              <p className="text-sm text-[#064e3b] h-12 leading-snug">
                Inverter + Lithium Battery + BMS All-in-One Smart Solution for your home and office.
              </p>
            </div>
            <div className="w-full bg-white relative border-y border-white">
              <img src="/images/lithium/integrated-battery.png" alt="Lithium Integrated Inverter Battery" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5 bg-[#ecfdf5] flex-1 flex flex-col">
              <div className="grid grid-cols-4 gap-2 mb-5 text-center text-[10px] sm:text-xs font-semibold text-[#064e3b]">
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Zap className="w-4 h-4 text-[#059669]" /></div>Plug & Play<br />Installation</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><ShieldCheck className="w-4 h-4 text-[#059669]" /></div>Smart BMS<br />Protection</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Battery className="w-4 h-4 text-[#059669]" /></div>Compact<br />Design</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Award className="w-4 h-4 text-[#059669]" /></div>Ideal for<br />Homes</div>
              </div>
              <Link
                to="/shop-by-category/$"
                params={{ 
                  _splat: subcategories.find(c => c.categoryName.toLowerCase().includes("integrated"))?.categorySlug || "lithium-integrated-inverter-battery"
                }}
                className="w-full mt-auto py-3 px-4 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                Shop Integrated Inverters <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Lithium Inbuilt Solar Inverter Battery */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col group border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-6 bg-[#fff7ed] flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#9a3412] text-white font-bold flex items-center justify-center shrink-0">3</div>
                <h3 className="text-xl font-bold text-[#9a3412] leading-tight">Lithium Inbuilt<br />Solar Inverter</h3>
              </div>
              <p className="text-sm text-[#7c2d12] h-12 leading-snug">
                Solar Inverter + Lithium Battery + Solar Charge Controller. Harness the power of the sun.
              </p>
            </div>
            <div className="w-full bg-white relative border-y border-white">
              <img src="/images/lithium/solar-battery.png" alt="Lithium Inbuilt Solar Inverter Battery" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5 bg-[#fff7ed] flex-1 flex flex-col">
              <div className="grid grid-cols-4 gap-2 mb-5 text-center text-[10px] sm:text-xs font-semibold text-[#7c2d12]">
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Sun className="w-4 h-4 text-[#ea580c]" /></div>Inbuilt Solar<br />Controller</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Sun className="w-4 h-4 text-[#ea580c]" /></div>Solar<br />Charging</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><ShieldCheck className="w-4 h-4 text-[#ea580c]" /></div>Zero<br />Maintenance</div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Leaf className="w-4 h-4 text-[#ea580c]" /></div>Clean<br />Energy</div>
              </div>
              <Link
                to="/shop-by-category/$"
                params={{ 
                  _splat: subcategories.find(c => c.categoryName.toLowerCase().includes("solar"))?.categorySlug || "lithium-inbuilt-solar-inverter-battery"
                }}
                className="w-full mt-auto py-3 px-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                Shop Solar Inverters <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </Container>

      {/* Trust Strip */}
      <Container size="xl" className="mb-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:divide-x divide-slate-100">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">100% Genuine</div>
                <div className="text-xs text-slate-500">Authorized Dealers</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">Fast Delivery</div>
                <div className="text-xs text-slate-500">In 60 Minutes</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">Expert Installation</div>
                <div className="text-xs text-slate-500">By Professionals</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Battery className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">Dedicated Support</div>
                <div className="text-xs text-slate-500">Before & After</div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Featured Products */}
      <Container size="xl" className="mb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Featured Lithium Solutions</h2>
            <p className="text-slate-500 font-medium">Top picks for a smarter, uninterrupted tomorrow.</p>
          </div>
          <Link to="/shop/c/$categorySlug" params={{ categorySlug: category.categorySlug || toSlug(category.categoryName) }} className="hidden md:flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
            No products found in this category.
          </div>
        )}
      </Container>

      {/* Promotional Footer */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 py-16 text-white border-t border-emerald-800/50 mt-auto">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        <Container size="xl" className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-800/50 border border-emerald-700/50 backdrop-blur-sm flex items-center justify-center shadow-inner shrink-0">
                <Sun className="w-8 h-8 text-emerald-300" />
              </div>
              <div>
                <div className="text-3xl font-black mb-1 tracking-tight">Switch to Lithium.</div>
                <div className="text-emerald-400/90 font-medium text-lg">Power a Cleaner Tomorrow.</div>
              </div>
            </div>

            <div className="flex gap-6 sm:gap-10">
              <div className="flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-emerald-800/40 flex items-center justify-center border border-emerald-700/30">
                  <Home className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="text-xs font-semibold text-emerald-50 tracking-wide uppercase">For Home</div>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-emerald-800/40 flex items-center justify-center border border-emerald-700/30">
                  <Building2 className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="text-xs font-semibold text-emerald-50 tracking-wide uppercase">For Office</div>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-emerald-800/40 flex items-center justify-center border border-emerald-700/30">
                  <Store className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="text-xs font-semibold text-emerald-50 tracking-wide uppercase">For Shops</div>
              </div>
            </div>

            <Link
              to="/shop/c/$categorySlug"
              params={{ categorySlug: category.categorySlug || toSlug(category.categoryName) }}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2 group shrink-0"
            >
              Explore All Solutions <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Container>
      </div>

    </div>
  );
}
