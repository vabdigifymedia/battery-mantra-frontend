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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col group">
            <div className="p-6 bg-blue-50/50 border-b border-blue-100/50">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-4">1</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Lithium Battery for Inverter</h3>
              <p className="text-sm text-slate-600 h-16">
                Upgrade your existing inverter with lithium. Enjoy longer backup, faster charging and zero maintenance.
              </p>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-white relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl"></div>
               <img src="/images/lithium/inverter-battery.png" alt="Lithium Battery for Inverter" className="w-full max-w-[200px] h-auto object-contain drop-shadow-xl z-10 hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-6 bg-white border-t border-slate-100">
               <div className="grid grid-cols-3 gap-2 mb-6 text-center text-xs font-semibold text-slate-700">
                 <div className="flex flex-col items-center"><Battery className="w-5 h-5 mb-1 text-blue-600" />Longer Life</div>
                 <div className="flex flex-col items-center"><BatteryCharging className="w-5 h-5 mb-1 text-blue-600" />Fast Charging</div>
                 <div className="flex flex-col items-center"><ShieldCheck className="w-5 h-5 mb-1 text-blue-600" />Zero Maint.</div>
               </div>
               <Link 
                 to="/shop-by-category/$categorySlug" 
                 params={{ categorySlug: "lithium-battery-for-inverter" }}
                 className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
               >
                 Shop Lithium Batteries <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>

          {/* Card 2: Lithium Integrated Inverter Battery */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col group">
            <div className="p-6 bg-emerald-50/50 border-b border-emerald-100/50">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-4">2</div>
              <h3 className="text-xl font-bold text-emerald-900 mb-2">Lithium Integrated Inverter Battery</h3>
              <p className="text-sm text-slate-600 h-16">
                Inverter + Lithium Battery + BMS All-in-One Smart Solution for your home and office.
              </p>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-white relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl"></div>
               <img src="/images/lithium/integrated-battery.png" alt="Lithium Integrated Inverter Battery" className="w-full max-w-[200px] h-auto object-contain drop-shadow-xl z-10 hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-6 bg-white border-t border-slate-100">
               <div className="grid grid-cols-3 gap-2 mb-6 text-center text-xs font-semibold text-slate-700">
                 <div className="flex flex-col items-center"><Battery className="w-5 h-5 mb-1 text-emerald-600" />Plug & Play</div>
                 <div className="flex flex-col items-center"><ShieldCheck className="w-5 h-5 mb-1 text-emerald-600" />Smart BMS</div>
                 <div className="flex flex-col items-center"><Sun className="w-5 h-5 mb-1 text-emerald-600" />Compact</div>
               </div>
               <Link 
                 to="/shop-by-category/$categorySlug" 
                 params={{ categorySlug: "lithium-integrated-inverter-battery" }}
                 className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
               >
                 Shop Integrated Inverters <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>

          {/* Card 3: Lithium Inbuilt Solar Inverter Battery */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col group">
            <div className="p-6 bg-orange-50/50 border-b border-orange-100/50">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4">3</div>
              <h3 className="text-xl font-bold text-orange-900 mb-2">Lithium Inbuilt Solar Inverter Battery</h3>
              <p className="text-sm text-slate-600 h-16">
                Solar Inverter + Lithium Battery + Solar Charge Controller. Harness the power of the sun.
              </p>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-white relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl"></div>
               <img src="/images/lithium/solar-battery.png" alt="Lithium Inbuilt Solar Inverter Battery" className="w-full max-w-[200px] h-auto object-contain drop-shadow-xl z-10 hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-6 bg-white border-t border-slate-100">
               <div className="grid grid-cols-3 gap-2 mb-6 text-center text-xs font-semibold text-slate-700">
                 <div className="flex flex-col items-center"><Sun className="w-5 h-5 mb-1 text-orange-500" />Solar Ready</div>
                 <div className="flex flex-col items-center"><BatteryCharging className="w-5 h-5 mb-1 text-orange-500" />Free Energy</div>
                 <div className="flex flex-col items-center"><ShieldCheck className="w-5 h-5 mb-1 text-orange-500" />Clean Power</div>
               </div>
               <Link 
                 to="/shop-by-category/$categorySlug" 
                 params={{ categorySlug: "lithium-inbuilt-solar-inverter-battery" }}
                 className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
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
