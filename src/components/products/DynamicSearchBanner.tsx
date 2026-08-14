import { useQuery } from "@tanstack/react-query";
import { brandsQuery, categoriesQuery, vehiclesListQuery } from "@/queries";
import { useLocationStore } from "@/store/useLocationStore";
import { ShieldCheck, Award, Truck, BadgeIndianRupee } from "lucide-react";

export function DynamicSearchBanner({ search }: { search: any }) {
  const { city } = useLocationStore();
  const locationName = city?.cityName || "Delhi"; // Fallback to Delhi if not set

  const { data: brands } = useQuery(brandsQuery());
  const { data: categories } = useQuery(categoriesQuery());
  const { data: vehicles } = useQuery(vehiclesListQuery());

  // Handle categoryId arrays if present
  const catId = Array.isArray(search.categoryId) ? search.categoryId[0] : search.categoryId;
  const brndId = Array.isArray(search.brandId) ? search.brandId[0] : search.brandId;

  const brand = brndId ? brands?.find((b: any) => b.brandId === brndId) : null;
  const category = catId ? categories?.find((c: any) => c.categoryId === catId) : null;
  const vehicle = search.vehicleId ? vehicles?.find((v: any) => v.vehicleId === search.vehicleId) : null;

  // We only show this banner if at least one filter is active.
  if (!brand && !category && !vehicle) return null;

  let title = "";
  let subtitle = "";
  let imageUrl = "";
  let brandNameHeader = "";
  let brandLogoUrl = "";

  const catName = category?.categoryName || "Battery";

  if (vehicle) {
    title = `${vehicle.make} ${vehicle.model} ${catName} Price in ${locationName}`;
    subtitle = `With Battery Mantra, get ${vehicle.make} ${vehicle.model} ${catName} at best price`;
    imageUrl = vehicle.imageUrl || "/images/placeholders/car-placeholder.png";
    brandNameHeader = vehicle.make;
    // Attempt to find brand logo if vehicle make matches a brand
    const matchedBrand = brands?.find((b: any) => b.brandName?.toLowerCase() === vehicle.make?.toLowerCase());
    if (matchedBrand) brandLogoUrl = matchedBrand.brandLogo || "";
  } else if (brand && category) {
    title = `${brand.brandName} ${category.categoryName} Price in ${locationName}`;
    subtitle = `With Battery Mantra, get ${brand.brandName} ${category.categoryName} at best price`;
    imageUrl = brand.brandLogo || category.iconUrl || "";
    brandNameHeader = brand.brandName;
    brandLogoUrl = brand.brandLogo || "";
  } else if (brand) {
    title = `${brand.brandName} Batteries Price in ${locationName}`;
    subtitle = `With Battery Mantra, get ${brand.brandName} Batteries at best price`;
    imageUrl = brand.brandLogo || "";
    brandNameHeader = brand.brandName;
    brandLogoUrl = brand.brandLogo || "";
  } else if (category) {
    title = `${category.categoryName} Price in ${locationName}`;
    subtitle = `With Battery Mantra, get ${category.categoryName} at best price`;
    imageUrl = category.iconUrl || "";
    brandNameHeader = category.categoryName;
  }

  return (
    <div className="mb-6 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50/80 via-white to-white shadow-sm border border-border/40">
      
      {/* Top Section: Image + Content */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
        {/* Left: Main Image */}
        {imageUrl && (
          <div className="w-48 h-32 md:w-64 md:h-40 shrink-0 flex items-center justify-center p-2">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
        )}
        
        {/* Right: Text Content */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
          {brandNameHeader && (
            <div className="flex items-center gap-2 mb-2">
              {brandLogoUrl && (
                <img src={brandLogoUrl} alt={brandNameHeader} className="h-6 w-auto object-contain mix-blend-multiply" />
              )}
              <span className="text-red-600 font-extrabold tracking-wider uppercase text-sm md:text-base">
                {brandNameHeader}
              </span>
            </div>
          )}
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase text-slate-900 leading-tight">
            {title}
          </h1>
          <p className="text-slate-600 font-medium text-sm md:text-base mt-2 max-w-2xl">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Section: Trust Badges */}
      <div className="bg-red-50/40 border-t border-red-100/60 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-slate-800 leading-tight">100% Compatible<br/>Batteries</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-slate-800 leading-tight">Genuine Quality<br/>Assured</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-slate-800 leading-tight">Free Installation<br/>at Doorstep</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <BadgeIndianRupee className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-slate-800 leading-tight">Best Price<br/>Guarantee</span>
          </div>

        </div>
      </div>
      
    </div>
  );
}
