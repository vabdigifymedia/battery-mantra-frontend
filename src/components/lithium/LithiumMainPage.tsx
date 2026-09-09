import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { productFilterQuery } from "@/queries";
import { ProductCard } from "@/components/products/ProductCard";
import { ShieldCheck, Award, Truck, BadgeIndianRupee, Battery, BatteryCharging, Sun, ArrowRight } from "lucide-react";
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
      <div className="bg-slate-900 text-white pb-24 pt-12">
        <Container size="xl">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="text-emerald-400 font-bold tracking-widest text-sm uppercase mb-3">
              Smart Power Solutions
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
              Choose Your <span className="text-emerald-400">Lithium Power Solution</span>
            </h1>
            <p className="text-lg text-slate-300 font-medium mb-10 max-w-2xl">
              Advanced. Reliable. Future Ready. Experience the next generation of power backup for your home and office.
            </p>

            <div className="flex items-center gap-6 text-sm font-semibold text-slate-200">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <BatteryCharging className="w-6 h-6 text-emerald-400" />
                </div>
                <span>Longer Backup</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <BadgeIndianRupee className="w-6 h-6 text-emerald-400" />
                </div>
                <span>Lower Running Cost</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-emerald-400" />
                </div>
                <span>Cleaner & Greener</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Options Cards */}
      <Container size="xl" className="-mt-16 relative z-10 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Lithium Battery for Inverter */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col group border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-6 bg-[#ebf4ff] flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white font-bold flex items-center justify-center shrink-0">1</div>
                <h3 className="text-xl font-bold text-[#1e40af] leading-tight">Lithium Battery<br/>for Inverter</h3>
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
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Battery className="w-4 h-4 text-[#2563eb]" /></div>Longer<br/>Life</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><BatteryCharging className="w-4 h-4 text-[#2563eb]" /></div>Fast<br/>Charging</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><ShieldCheck className="w-4 h-4 text-[#2563eb]" /></div>Zero<br/>Maintenance</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Leaf className="w-4 h-4 text-[#2563eb]" /></div>Lightweight<br/>& Compact</div>
               </div>
               <Link 
                 to="/shop-by-category/$categorySlug" 
                 params={{ categorySlug: "lithium-battery-for-inverter" }}
                 className="w-full mt-auto py-3 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
               >
                 Shop Lithium Batteries <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>

          {/* Card 2: Lithium Integrated Inverter Battery */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col group border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-6 bg-[#ecfdf5] flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#065f46] text-white font-bold flex items-center justify-center shrink-0">2</div>
                <h3 className="text-xl font-bold text-[#065f46] leading-tight">Lithium Integrated<br/>Inverter Battery</h3>
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
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Zap className="w-4 h-4 text-[#059669]" /></div>Plug & Play<br/>Installation</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><ShieldCheck className="w-4 h-4 text-[#059669]" /></div>Smart BMS<br/>Protection</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Battery className="w-4 h-4 text-[#059669]" /></div>Compact<br/>Design</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Award className="w-4 h-4 text-[#059669]" /></div>Ideal for<br/>Homes</div>
               </div>
               <Link 
                 to="/shop-by-category/$categorySlug" 
                 params={{ categorySlug: "lithium-integrated-inverter-battery" }}
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
                <h3 className="text-xl font-bold text-[#9a3412] leading-tight">Lithium Inbuilt<br/>Solar Inverter</h3>
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
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Sun className="w-4 h-4 text-[#ea580c]" /></div>Inbuilt Solar<br/>Controller</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Sun className="w-4 h-4 text-[#ea580c]" /></div>Solar<br/>Charging</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><ShieldCheck className="w-4 h-4 text-[#ea580c]" /></div>Zero<br/>Maintenance</div>
                 <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1"><Leaf className="w-4 h-4 text-[#ea580c]" /></div>Clean<br/>Energy</div>
               </div>
               <Link 
                 to="/shop-by-category/$categorySlug" 
                 params={{ categorySlug: "lithium-inbuilt-solar-inverter-battery" }}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-slate-100">
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
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Featured Lithium Solutions</h2>
            <p className="text-slate-500 font-medium">Top picks for a smarter, uninterrupted tomorrow.</p>
          </div>
          <Link to={`/shop/c/${category.categorySlug || toSlug(category.categoryName)}`} className="hidden md:flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <div className="bg-emerald-900 py-12 text-white">
         <Container size="xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-800 flex items-center justify-center">
                     <Sun className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                     <div className="text-2xl font-black mb-1">Switch to Lithium.</div>
                     <div className="text-emerald-400 font-medium">Power a Cleaner Tomorrow.</div>
                  </div>
               </div>
               
               <div className="flex gap-8 opacity-60">
                 <div className="text-center"><div className="font-bold text-lg">🏠</div><div className="text-xs mt-1">For Home</div></div>
                 <div className="text-center"><div className="font-bold text-lg">🏢</div><div className="text-xs mt-1">For Office</div></div>
                 <div className="text-center"><div className="font-bold text-lg">🏪</div><div className="text-xs mt-1">For Shops</div></div>
               </div>
               
               <Link 
                 to={`/shop/c/${category.categorySlug || toSlug(category.categoryName)}`} 
                 className="px-6 py-3 bg-white text-emerald-900 font-bold rounded-full hover:bg-emerald-50 transition-colors"
               >
                 Explore All Lithium Solutions →
               </Link>
            </div>
         </Container>
      </div>

    </div>
  );
}
