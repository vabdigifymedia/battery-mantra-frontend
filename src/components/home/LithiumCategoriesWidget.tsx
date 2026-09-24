import { Link } from "@tanstack/react-router";
import { Battery, BatteryCharging, ShieldCheck, Leaf, Zap, Award, Sun, ArrowRight } from "lucide-react";

export function LithiumCategoriesWidget() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 w-full">
      {/* Card 1: Lithium Battery for Inverter */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md overflow-hidden flex flex-row md:flex-col group border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300">
        <div className="w-1/3 md:w-full bg-white relative flex items-center justify-center p-2 md:p-0 md:order-2 shrink-0 border-r md:border-r-0 md:border-y border-slate-100/50 md:border-white">
          <img src="/images/lithium/inverter-battery.png" alt="Lithium Battery for Inverter" className="w-full h-auto object-contain md:object-cover group-hover:scale-105 transition-transform duration-500 max-h-[100px] md:max-h-none" />
        </div>
        <div className="w-2/3 md:w-full flex-1 flex flex-col md:order-1 md:order-3">
          <div className="p-3 md:p-4 bg-[#ebf4ff] flex-col md:order-1 flex-1 md:flex-none">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <div className="hidden md:flex w-6 h-6 rounded-full bg-[#1e40af] text-white text-xs font-bold items-center justify-center shrink-0">1</div>
              <h3 className="text-sm md:text-lg font-bold text-[#1e40af] leading-tight">Lithium Battery<br className="hidden md:block" />for Inverter</h3>
            </div>
            <p className="text-[10px] md:text-xs text-[#1e3a8a] md:h-10 leading-snug line-clamp-2 md:line-clamp-none">
              Upgrade your existing inverter with lithium. Enjoy longer backup, faster charging and zero maintenance.
            </p>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-battery-for-inverter" }}
              className="md:hidden mt-2 py-1.5 px-3 bg-[#2563eb] text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 w-max"
            >
              Explore <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="hidden md:flex p-4 bg-[#ebf4ff] flex-1 flex-col justify-end md:order-3">
            <div className="grid grid-cols-4 gap-1 mb-4 text-center text-[10px] font-semibold text-[#1e3a8a]">
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><Battery className="w-3.5 h-3.5 text-[#2563eb]" /></div>Longer<br />Life</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><BatteryCharging className="w-3.5 h-3.5 text-[#2563eb]" /></div>Fast<br />Charging</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><ShieldCheck className="w-3.5 h-3.5 text-[#2563eb]" /></div>Zero<br />Maintenance</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><Leaf className="w-3.5 h-3.5 text-[#2563eb]" /></div>Lightweight<br />& Compact</div>
            </div>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-battery-for-inverter" }}
              className="w-full mt-auto py-2.5 px-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              Shop Lithium Batteries <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Card 2: Lithium Integrated Inverter Battery */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md overflow-hidden flex flex-row md:flex-col group border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300">
        <div className="w-1/3 md:w-full bg-white relative flex items-center justify-center p-2 md:p-0 md:order-2 shrink-0 border-r md:border-r-0 md:border-y border-slate-100/50 md:border-white">
          <img src="/images/lithium/integrated-battery.png" alt="Lithium Integrated Inverter Battery" className="w-full h-auto object-contain md:object-cover group-hover:scale-105 transition-transform duration-500 max-h-[100px] md:max-h-none" />
        </div>
        <div className="w-2/3 md:w-full flex-1 flex flex-col md:order-1 md:order-3">
          <div className="p-3 md:p-4 bg-[#ecfdf5] flex-col md:order-1 flex-1 md:flex-none">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <div className="hidden md:flex w-6 h-6 rounded-full bg-[#065f46] text-white text-xs font-bold items-center justify-center shrink-0">2</div>
              <h3 className="text-sm md:text-lg font-bold text-[#065f46] leading-tight">Lithium Integrated<br className="hidden md:block" />Inverter</h3>
            </div>
            <p className="text-[10px] md:text-xs text-[#064e3b] md:h-10 leading-snug line-clamp-2 md:line-clamp-none">
              Inverter + Lithium Battery + BMS All-in-One Smart Solution for your home and office.
            </p>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-integrated-inverter-battery" }}
              className="md:hidden mt-2 py-1.5 px-3 bg-[#059669] text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 w-max"
            >
              Explore <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="hidden md:flex p-4 bg-[#ecfdf5] flex-1 flex-col justify-end md:order-3">
            <div className="grid grid-cols-4 gap-1 mb-4 text-center text-[10px] font-semibold text-[#064e3b]">
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><Zap className="w-3.5 h-3.5 text-[#059669]" /></div>Plug & Play<br />Installation</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><ShieldCheck className="w-3.5 h-3.5 text-[#059669]" /></div>Smart BMS<br />Protection</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><Battery className="w-3.5 h-3.5 text-[#059669]" /></div>Compact<br />Design</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><Award className="w-3.5 h-3.5 text-[#059669]" /></div>Ideal for<br />Homes</div>
            </div>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-integrated-inverter-battery" }}
              className="w-full mt-auto py-2.5 px-3 bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              Shop Integrated Inverters <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Card 3: Lithium Inbuilt Solar Inverter Battery */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md overflow-hidden flex flex-row md:flex-col group border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300">
        <div className="w-1/3 md:w-full bg-white relative flex items-center justify-center p-2 md:p-0 md:order-2 shrink-0 border-r md:border-r-0 md:border-y border-slate-100/50 md:border-white">
          <img src="/images/lithium/solar-battery.png" alt="Lithium Inbuilt Solar Inverter Battery" className="w-full h-auto object-contain md:object-cover group-hover:scale-105 transition-transform duration-500 max-h-[100px] md:max-h-none" />
        </div>
        <div className="w-2/3 md:w-full flex-1 flex flex-col md:order-1 md:order-3">
          <div className="p-3 md:p-4 bg-[#fff7ed] flex-col md:order-1 flex-1 md:flex-none">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <div className="hidden md:flex w-6 h-6 rounded-full bg-[#9a3412] text-white text-xs font-bold items-center justify-center shrink-0">3</div>
              <h3 className="text-sm md:text-lg font-bold text-[#9a3412] leading-tight">Lithium Inbuilt<br className="hidden md:block" />Solar</h3>
            </div>
            <p className="text-[10px] md:text-xs text-[#7c2d12] md:h-10 leading-snug line-clamp-2 md:line-clamp-none">
              Solar Inverter + Lithium Battery + Solar Charge Controller. Harness the power of the sun.
            </p>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-inbuilt-solar-inverter-battery" }}
              className="md:hidden mt-2 py-1.5 px-3 bg-[#ea580c] text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 w-max"
            >
              Explore <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="hidden md:flex p-4 bg-[#fff7ed] flex-1 flex-col justify-end md:order-3">
            <div className="grid grid-cols-4 gap-1 mb-4 text-center text-[10px] font-semibold text-[#7c2d12]">
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><Sun className="w-3.5 h-3.5 text-[#ea580c]" /></div>Inbuilt Solar<br />Controller</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><Sun className="w-3.5 h-3.5 text-[#ea580c]" /></div>Solar<br />Charging</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><ShieldCheck className="w-3.5 h-3.5 text-[#ea580c]" /></div>Zero<br />Maintenance</div>
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm"><Leaf className="w-3.5 h-3.5 text-[#ea580c]" /></div>Clean<br />Energy</div>
            </div>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-inbuilt-solar-inverter-battery" }}
              className="w-full mt-auto py-2.5 px-3 bg-[#ea580c] hover:bg-[#c2410c] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              Shop Solar Inverters <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
