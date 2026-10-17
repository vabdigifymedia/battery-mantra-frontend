import { Link } from "@tanstack/react-router";
import { Sun, Zap, ShieldCheck, BatteryCharging, Battery, Award, Leaf, Shield, ArrowRight } from "lucide-react";

export function SolarCategoriesWidget() {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
      {/* Card 1: Solar Panels */}
      <div className="w-[270px] sm:w-auto shrink-0 snap-start sm:shrink bg-white rounded-xl md:rounded-2xl shadow-md overflow-hidden flex flex-col group border border-slate-100 hover:-translate-y-1 transition-all duration-300">
        <div className="w-full bg-white relative flex items-center justify-center p-4 border-b border-slate-100 group-hover:bg-amber-50/20 transition-colors">
          <img 
            src="https://res.cloudinary.com/xtijkslp/image/upload/v1792237178/battery-mantra/categories/js6smpgl64kgnzxhwdmj.png" 
            alt="Solar Panels" 
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain group-hover:scale-105 transition-transform duration-500" 
            loading="lazy"
          />
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            Up to 22.8% Eff.
          </span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between bg-[#fffbeb] p-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-[#b45309] text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</div>
              <h3 className="text-base sm:text-lg font-bold text-[#92400e] leading-tight">Solar Panels</h3>
            </div>
            <p className="text-[11px] sm:text-xs text-[#78350f] leading-snug line-clamp-2 h-8">
              High-efficiency Mono-PERC & Bifacial modules with 25-year linear performance warranty.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60">
            <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] font-semibold text-[#78350f]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Sun className="w-3 h-3 text-amber-600" />
                </div>
                <span>Mono-PERC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                </div>
                <span>25-Yr Warranty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Zap className="w-3 h-3 text-amber-600" />
                </div>
                <span>Low-Light Gen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Leaf className="w-3 h-3 text-amber-600" />
                </div>
                <span>Zero Bills</span>
              </div>
            </div>

            <Link
              to="/shop-by-category/$"
              params={{ _splat: "solar-panel" }}
              className="w-full py-2.5 px-3 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-[0.98]"
            >
              Shop Solar Panels <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Card 2: Solar Inverters */}
      <div className="w-[270px] sm:w-auto shrink-0 snap-start sm:shrink bg-white rounded-xl md:rounded-2xl shadow-md overflow-hidden flex flex-col group border border-slate-100 hover:-translate-y-1 transition-all duration-300">
        <div className="w-full bg-white relative flex items-center justify-center p-4 border-b border-slate-100 group-hover:bg-emerald-50/20 transition-colors">
          <img 
            src="https://res.cloudinary.com/xtijkslp/image/upload/v1792237285/battery-mantra/categories/rj18rorvasbdg0o3ejxv.png" 
            alt="Solar Inverters" 
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain group-hover:scale-105 transition-transform duration-500" 
            loading="lazy"
          />
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Smart MPPT
          </span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between bg-[#ecfdf5] p-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-[#047857] text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</div>
              <h3 className="text-base sm:text-lg font-bold text-[#065f46] leading-tight">Solar Inverters</h3>
            </div>
            <p className="text-[11px] sm:text-xs text-[#064e3b] leading-snug line-clamp-2 h-8">
              On-Grid, Off-Grid & Hybrid PCU inverters with smart solar prioritization and MPPT tracking.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200/60">
            <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] font-semibold text-[#064e3b]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Zap className="w-3 h-3 text-emerald-600" />
                </div>
                <span>98% MPPT Eff.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Sun className="w-3 h-3 text-emerald-600" />
                </div>
                <span>Grid Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Award className="w-3 h-3 text-emerald-600" />
                </div>
                <span>Pure Sine Wave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                </div>
                <span>LCD Display</span>
              </div>
            </div>

            <Link
              to="/shop-by-category/$"
              params={{ _splat: "solar-inverter" }}
              className="w-full py-2.5 px-3 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-[0.98]"
            >
              Shop Inverters <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Card 3: Solar Tubular Batteries */}
      <div className="w-[270px] sm:w-auto shrink-0 snap-start sm:shrink bg-white rounded-xl md:rounded-2xl shadow-md overflow-hidden flex flex-col group border border-slate-100 hover:-translate-y-1 transition-all duration-300">
        <div className="w-full bg-white relative flex items-center justify-center p-4 border-b border-slate-100 group-hover:bg-blue-50/20 transition-colors">
          <img 
            src="https://res.cloudinary.com/xtijkslp/image/upload/v1792237393/battery-mantra/categories/lyakjyydecgygttdm2gr.png" 
            alt="Solar Batteries" 
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain group-hover:scale-105 transition-transform duration-500" 
            loading="lazy"
          />
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            Deep Cycle C10
          </span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between bg-[#eff6ff] p-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-[#1d4ed8] text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</div>
              <h3 className="text-base sm:text-lg font-bold text-[#1e40af] leading-tight">Solar Batteries</h3>
            </div>
            <p className="text-[11px] sm:text-xs text-[#1e3a8a] leading-snug line-clamp-2 h-8">
              Heavy-duty C10 rated tall tubular batteries engineered for daily solar discharge cycles.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200/60">
            <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] font-semibold text-[#1e3a8a]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <BatteryCharging className="w-3 h-3 text-blue-600" />
                </div>
                <span>1500+ Cycles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Battery className="w-3 h-3 text-blue-600" />
                </div>
                <span>C10 Rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                </div>
                <span>Low Maintenance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Award className="w-3 h-3 text-blue-600" />
                </div>
                <span>Up to 60M Wty</span>
              </div>
            </div>

            <Link
              to="/shop-by-category/$"
              params={{ _splat: "solar-tubular-battery" }}
              className="w-full py-2.5 px-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-[0.98]"
            >
              Shop Batteries <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Card 4: Solar Accessories */}
      <div className="w-[270px] sm:w-auto shrink-0 snap-start sm:shrink bg-white rounded-xl md:rounded-2xl shadow-md overflow-hidden flex flex-col group border border-slate-100 hover:-translate-y-1 transition-all duration-300">
        <div className="w-full bg-white relative flex items-center justify-center p-4 border-b border-slate-100 group-hover:bg-orange-50/20 transition-colors">
          <img 
            src="https://res.cloudinary.com/xtijkslp/image/upload/v1792237444/battery-mantra/categories/n9xmybajt9o2gbgiekp6.png" 
            alt="Solar Accessories" 
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain group-hover:scale-105 transition-transform duration-500" 
            loading="lazy"
          />
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/60">
            Complete Kits
          </span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between bg-[#fff7ed] p-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-[#c2410c] text-white text-[11px] font-bold flex items-center justify-center shrink-0">4</div>
              <h3 className="text-base sm:text-lg font-bold text-[#9a3412] leading-tight">Solar Accessories</h3>
            </div>
            <p className="text-[11px] sm:text-xs text-[#7c2d12] leading-snug line-clamp-2 h-8">
              Rust-proof GI mounting structures, MC4 branch connectors, and safety ACDB/DCDB boxes.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-orange-200/60">
            <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] font-semibold text-[#7c2d12]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-3 h-3 text-orange-600" />
                </div>
                <span>Rust-Proof GI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Zap className="w-3 h-3 text-orange-600" />
                </div>
                <span>Lightning Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Shield className="w-3 h-3 text-orange-600" />
                </div>
                <span>UV DC Cables</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <Award className="w-3 h-3 text-orange-600" />
                </div>
                <span>Easy Assembly</span>
              </div>
            </div>

            <Link
              to="/shop-by-category/$"
              params={{ _splat: "solar-accessories" }}
              className="w-full py-2.5 px-3 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-[0.98]"
            >
              Shop Accessories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
