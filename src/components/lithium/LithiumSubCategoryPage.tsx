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

  const config = isSolar ? {
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
  } : {
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

  const IconBg = `bg-${config.theme}-100`;
  const IconText = `text-${config.theme}-600`;
  const BadgeBg = `bg-${config.theme}-600`;

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen">
      
      {/* Hero Banner Area */}
      <div 
        className="relative min-h-[500px] lg:min-h-[600px] flex items-center bg-slate-900 overflow-hidden"
        style={{
          backgroundImage: `url('/images/lithium/${isSolar ? 'solar-battery-banner.png' : 'integrated-battery-banner.png'}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Gradient Overlay to ensure text readability */}
        <div className={`absolute inset-0 bg-gradient-to-${isSolar ? 'l' : 'r'} from-white/90 via-white/70 to-transparent lg:from-white/95 lg:via-white/80 lg:to-white/10`} />
        
        <Container size="xl" className="relative z-10 w-full py-16">
          <div className={`flex flex-col lg:flex-row ${isSolar ? 'justify-end' : 'justify-start'}`}>
            <div className={`w-full lg:w-1/2 ${isSolar ? 'text-right' : 'text-left'}`}>
              <span className={`text-${config.theme}-600 font-extrabold tracking-widest text-sm uppercase mb-4 block drop-shadow-sm`}>
                {config.subtitle}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight text-slate-900 drop-shadow-md">
                Lithium {config.titleHighlight} <br/>Inverter Battery
              </h1>
              <p className={`text-lg text-slate-700 font-semibold mb-10 max-w-xl drop-shadow-sm ${isSolar ? 'ml-auto' : 'mr-auto'}`}>
                {config.desc}
              </p>

              <div className={`flex flex-wrap gap-6 ${isSolar ? 'justify-end' : 'justify-start'}`}>
                {config.features.map((f, i) => (
                  <div key={i} className={`flex flex-col gap-3 ${isSolar ? 'items-end' : 'items-start'}`}>
                    <div className={`w-14 h-14 rounded-full bg-${config.theme}-100 flex items-center justify-center shadow-md`}>
                      <f.icon className={`w-7 h-7 text-${config.theme}-600`} />
                    </div>
                    <div className={isSolar ? 'text-right' : 'text-left'}>
                      <div className="font-bold text-sm text-slate-900 leading-tight">{f.label}</div>
                      <div className="text-xs font-semibold text-slate-600">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Highlights Strip */}
      <Container size="xl" className="-mt-8 relative z-20 mb-16">
         <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex justify-between gap-4 overflow-x-auto">
            {config.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0">
                 <div className={`w-12 h-12 rounded-full ${IconBg} flex items-center justify-center`}>
                    <h.icon className={`w-6 h-6 ${IconText}`} />
                 </div>
                 <div>
                    <div className="font-bold text-slate-800 text-sm">{h.label}</div>
                    <div className="text-xs text-slate-500">{h.desc}</div>
                 </div>
              </div>
            ))}
         </div>
      </Container>

      {/* Featured Products */}
      <Container size="xl" className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-1">
              Top {category.categoryName}s
            </h2>
            <p className="text-slate-500 font-medium">Smart. Powerful. Future Ready.</p>
          </div>
          <Link to={`/shop/c/${type || toSlug(category.categoryName)}`} className={`hidden md:flex items-center gap-1 text-sm font-bold ${IconText} hover:opacity-80`}>
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
      
      {/* Trust Strip */}
      <Container size="xl" className="mb-24">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-slate-100">
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
