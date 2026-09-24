import { Link } from "@tanstack/react-router";
import { ArrowRight, Battery, BatteryCharging, Leaf, ShieldCheck, Sun, Zap } from "lucide-react";

export function LithiumCategoriesWidget() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 w-full">
      {/* Card 1: Lithium Battery for Inverter */}
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/60 overflow-hidden flex flex-col group relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="p-5 relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              Lithium Battery<br />
              <span className="text-blue-600">for Inverter</span>
            </h3>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">1</div>
          </div>
          <p className="text-xs text-slate-500 mb-4 h-8">
            Upgrade your existing inverter with lithium for zero maintenance.
          </p>
          
          <div className="flex justify-center mb-5 relative group-hover:scale-105 transition-transform duration-500">
            <img src="/images/lithium/inverter-battery.png" alt="Lithium Battery for Inverter" className="h-28 object-contain drop-shadow-xl" />
          </div>

          <div className="mt-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-medium text-slate-600"><Battery className="w-3 h-3 text-blue-500"/> Longer Life</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-medium text-slate-600"><BatteryCharging className="w-3 h-3 text-blue-500"/> Fast Charging</span>
            </div>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-battery-for-inverter" }}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl flex items-center justify-between transition-colors shadow-sm"
            >
              Shop Inverter Batteries <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Card 2: Lithium Integrated Inverter Battery */}
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/60 overflow-hidden flex flex-col group relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="p-5 relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              Integrated<br />
              <span className="text-emerald-600">Inverter Battery</span>
            </h3>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">2</div>
          </div>
          <p className="text-xs text-slate-500 mb-4 h-8">
            Inverter + Battery + BMS All-in-One Smart Solution.
          </p>
          
          <div className="flex justify-center mb-5 relative group-hover:scale-105 transition-transform duration-500">
            <img src="/images/lithium/integrated-battery.png" alt="Lithium Integrated Battery" className="h-28 object-contain drop-shadow-xl" />
          </div>

          <div className="mt-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-medium text-slate-600"><Zap className="w-3 h-3 text-emerald-500"/> Plug & Play</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-medium text-slate-600"><ShieldCheck className="w-3 h-3 text-emerald-500"/> Smart BMS</span>
            </div>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-integrated-inverter-battery" }}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center justify-between transition-colors shadow-sm"
            >
              Shop Integrated Systems <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Card 3: Lithium Inbuilt Solar Inverter */}
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/60 overflow-hidden flex flex-col group relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="p-5 relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              Inbuilt Solar<br />
              <span className="text-orange-600">Inverter</span>
            </h3>
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0">3</div>
          </div>
          <p className="text-xs text-slate-500 mb-4 h-8">
            Solar Inverter + Battery + Charge Controller.
          </p>
          
          <div className="flex justify-center mb-5 relative group-hover:scale-105 transition-transform duration-500">
            <img src="/images/lithium/solar-battery.png" alt="Lithium Solar Inverter" className="h-28 object-contain drop-shadow-xl" />
          </div>

          <div className="mt-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-medium text-slate-600"><Sun className="w-3 h-3 text-orange-500"/> Solar Charging</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-medium text-slate-600"><Leaf className="w-3 h-3 text-orange-500"/> Clean Energy</span>
            </div>
            <Link
              to="/shop-by-category/$"
              params={{ _splat: "lithium-inbuilt-solar-inverter-battery" }}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl flex items-center justify-between transition-colors shadow-sm"
            >
              Shop Solar Systems <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
