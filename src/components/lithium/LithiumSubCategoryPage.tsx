import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { productFilterQuery } from "@/queries";
import { ProductCard } from "@/components/products/ProductCard";
import { ShieldCheck, Award, Truck, BadgeIndianRupee, Battery, BatteryCharging, Sun, Zap, Leaf, ArrowRight } from "lucide-react";
import { CategoryListResponse } from "@/types/dto";

const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

export function LithiumSubCategoryPage({
  category,
  type
}: {
  category: CategoryListResponse;
  type: string;
}) {
  const { data } = useQuery(productFilterQuery({ categoryId: [category.categoryId], size: 8 }));
  const products = data?.content || [];

  const isSolar = type === "lithium-inbuilt-solar-inverter-battery";
  const isIntegrated = type === "lithium-integrated-inverter-battery";
  
  let config;
  if (isSolar) {
    config = {
      theme: "emerald",
      subtitle: "SOLAR POWER. SMARTER LIVING.",
      titleHighlight: "Solar",
      desc: "Solar Inverter + Lithium Battery + Solar Charge Controller All-in-One. Smarter. Cleaner. Greener.",
      features: [
        { icon: Sun, label: "Inbuilt Solar Controller", desc: "Direct Solar Charging" },
        { icon: Battery, label: "High-Capacity Battery", desc: "Longer Life (10+ Years)" },
        { icon: ShieldCheck, label: "Smart BMS Protection", desc: "Safe & Reliable" },
        { icon: Zap, label: "Plug & Play Installation", desc: "Easy to Set Up" }
      ],
      highlights: [
        { icon: Sun, label: "Use Solar Energy", desc: "Reduce Electricity Bills" },
        { icon: BatteryCharging, label: "Stores Solar Power", desc: "For Day & Night Use" },
        { icon: Leaf, label: "Eco-Friendly", desc: "Clean & Sustainable" },
        { icon: Zap, label: "Integrated Solution", desc: "Inverter + Battery + Solar" }
      ]
    };
  } else if (isIntegrated) {
    config = {
      theme: "blue",
      subtitle: "NEXT-GEN POWER SOLUTION",
      titleHighlight: "Integrated",
      desc: "Inverter + Lithium Battery + BMS All-in-One Smart Solution. Smarter Power for a Brighter Tomorrow.",
      features: [
        { icon: Zap, label: "Plug & Play", desc: "Hassle-Free Installation" },
        { icon: BatteryCharging, label: "Longer Backup", desc: "Reliable Power for Years" },
        { icon: ShieldCheck, label: "Smart BMS Protection", desc: "Safe & Efficient" },
        { icon: Battery, label: "Compact & Space Saving", desc: "Modern Design" }
      ],
      highlights: [
        { icon: Zap, label: "Fast Charging", desc: "Charges up to 3x Faster" },
        { icon: Battery, label: "Long Life", desc: "Up to 10+ Years" },
        { icon: ShieldCheck, label: "Zero Maintenance", desc: "No Water, No Hassle" },
        { icon: Leaf, label: "Eco Friendly", desc: "Cleaner & Greener Tomorrow" }
      ]
    };
  } else {
    config = {
      theme: "indigo",
      subtitle: "UPGRADE YOUR INVERTER",
      titleHighlight: "Battery",
      desc: "Upgrade your existing inverter with lithium. Enjoy longer backup, faster charging and zero maintenance.",
      features: [
        { icon: Battery, label: "Longer Life", desc: "Up to 10+ Years" },
        { icon: BatteryCharging, label: "Fast Charging", desc: "Charges in 2-3 Hours" },
        { icon: ShieldCheck, label: "Zero Maintenance", desc: "No Water Top-up" },
        { icon: Leaf, label: "Lightweight & Compact", desc: "Easy to Move" }
      ],
      highlights: [
        { icon: Battery, label: "High Energy Density", desc: "More Power, Less Space" },
        { icon: Zap, label: "High Efficiency", desc: "Minimal Power Loss" },
        { icon: ShieldCheck, label: "Advanced BMS", desc: "Total Safety" },
        { icon: Leaf, label: "Eco Friendly", desc: "Cleaner & Greener Tomorrow" }
      ]
    };
  }

  const isEmerald = config.theme === "emerald";
  const isIndigo = config.theme === "indigo";
  const IconBg = isEmerald ? "bg-emerald-100" : isIndigo ? "bg-indigo-100" : "bg-blue-100";
  const IconText = isEmerald ? "text-emerald-600" : isIndigo ? "text-indigo-600" : "text-blue-600";
  const BadgeBg = isEmerald ? "bg-emerald-600" : isIndigo ? "bg-indigo-600" : "bg-blue-600";

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen">

      {/* Hero Banner Area */}
      <div
        className="relative min-h-[220px] sm:min-h-[350px] lg:min-h-[600px] flex items-center bg-slate-900 overflow-hidden"
        style={{
          backgroundImage: `url('${category.bannerUrl || `/images/lithium/${isSolar ? 'solar-battery-banner.png' : isIntegrated ? 'integrated-battery-banner.png' : 'inverter-battery.png'}`}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 ${isSolar ? 'bg-gradient-to-b lg:bg-gradient-to-l' : 'bg-gradient-to-b lg:bg-gradient-to-r'} from-white/95 via-white/85 lg:via-white/80 to-white/40 lg:to-white/10`} />

        <Container size="xl" className="relative z-10 w-full py-4 sm:py-10 lg:py-16">
          <div className={`flex flex-col lg:flex-row ${isSolar ? 'lg:justify-end' : 'justify-start'}`}>
            <div className={`w-full lg:w-1/2 text-center lg:text-left ${isSolar ? 'lg:text-right' : 'lg:text-left'} flex flex-col items-center lg:items-start ${isSolar ? 'lg:items-end' : ''}`}>
              <span className={`${IconText} font-extrabold tracking-widest text-[10px] sm:text-xs lg:text-sm uppercase mb-2 sm:mb-4 block`}>
                {config.subtitle}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 sm:mb-4 lg:mb-6 leading-tight text-slate-900">
                Lithium {config.titleHighlight} <br />Inverter Battery
              </h1>
              <p className={`text-xs lg:text-lg text-slate-700 font-semibold mb-6 sm:mb-6 lg:mb-10 max-w-xl mx-auto lg:mx-0 ${isSolar ? 'lg:ml-auto lg:mr-0' : ''}`}>
                {config.desc}
              </p>

              <div className="grid grid-cols-2 gap-3 lg:gap-6 mt-2 w-full max-w-md lg:max-w-none">
                {config.features.map((f, i) => (
                  <div key={i} className={`flex flex-col gap-1.5 lg:gap-3 items-center lg:items-start ${isSolar ? 'lg:items-end' : ''} bg-white/40 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none p-3 rounded-xl lg:p-0`}>
                    <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-full ${IconBg} flex items-center justify-center shadow-sm shrink-0`}>
                      <f.icon className={`w-5 h-5 lg:w-7 lg:h-7 ${IconText}`} />
                    </div>
                    <div className={`text-center lg:text-left ${isSolar ? 'lg:text-right' : ''}`}>
                      <div className="font-bold text-xs lg:text-sm text-slate-900 leading-tight">{f.label}</div>
                      <div className="text-[10px] lg:text-xs font-semibold text-slate-600 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Highlights Strip */}
      <Container size="xl" className="-mt-6 sm:-mt-8 relative z-20 mb-8 sm:mb-16 md:px-4">
        <div className="flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-3 sm:gap-4 pb-4 lg:pb-0 px-4 md:px-0 -mx-4 md:mx-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {config.highlights.map((h, i) => (
            <div key={i} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-100 p-3 sm:p-6 flex items-center gap-2 sm:gap-3 shrink-0 snap-center w-[75vw] sm:w-[45vw] lg:w-auto">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${IconBg} flex items-center justify-center shrink-0`}>
                <h.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${IconText}`} />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-xs sm:text-sm">{h.label}</div>
                <div className="text-[10px] sm:text-xs text-slate-500">{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Featured Products */}
      <Container size="xl" className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 mb-1 line-clamp-2 md:line-clamp-none leading-tight pr-4 md:pr-0">
              Top {category.categoryName}s
            </h2>
            <p className="text-slate-500 font-medium text-xs md:text-base">Smart. Powerful. Future Ready.</p>
          </div>
          <Link to="/shop/c/$categorySlug" params={{ categorySlug: type || toSlug(category.categoryName) }} className={`hidden md:flex items-center gap-1 text-sm font-bold ${IconText} hover:opacity-80`}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-4 gap-4 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product: any) => (
            <div key={product.productId} className="shrink-0 snap-center w-[75vw] sm:w-[45vw] md:w-auto">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
            No products found in this category.
          </div>
        )}
      </Container>

      {/* Trust Strip */}
      <Container size="xl" className="mb-24 hidden md:block">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:divide-x divide-slate-100">
            <div className="flex items-center gap-3 justify-center">
              <div className={`w-10 h-10 rounded-full ${IconBg} flex items-center justify-center ${IconText}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">100% Genuine</div>
                <div className="text-xs text-slate-500">Authorized Dealers</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className={`w-10 h-10 rounded-full ${IconBg} flex items-center justify-center ${IconText}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">Fast Delivery</div>
                <div className="text-xs text-slate-500">In 60 Minutes</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className={`w-10 h-10 rounded-full ${IconBg} flex items-center justify-center ${IconText}`}>
                <Award className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800">Expert Installation</div>
                <div className="text-xs text-slate-500">By Professionals</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className={`w-10 h-10 rounded-full ${IconBg} flex items-center justify-center ${IconText}`}>
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

    </div>
  );
}
