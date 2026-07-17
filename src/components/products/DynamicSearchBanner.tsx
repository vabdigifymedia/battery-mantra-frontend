import { useQuery } from "@tanstack/react-query";
import { brandsQuery, categoriesQuery, vehiclesListQuery } from "@/queries";
import { useLocationStore } from "@/store/useLocationStore";

export function DynamicSearchBanner({ search }: { search: any }) {
  const { city } = useLocationStore();
  const locationName = city?.cityName || "Delhi"; // Fallback to Delhi if not set

  const { data: brands } = useQuery(brandsQuery());
  const { data: categories } = useQuery(categoriesQuery());
  const { data: vehicles } = useQuery(vehiclesListQuery());

  const brand = search.brandId ? brands?.find((b: any) => b.brandId === search.brandId) : null;
  const category = search.categoryId ? categories?.find((c: any) => c.categoryId === search.categoryId) : null;
  const vehicle = search.vehicleId ? vehicles?.find((v: any) => v.vehicleId === search.vehicleId) : null;

  // We only show this banner if at least one filter is active.
  if (!brand && !category && !vehicle) return null;

  let title = "";
  let subtitle = "";
  let imageUrl = "";

  const catName = category?.categoryName || "Battery";

  if (vehicle) {
    title = `${vehicle.make} ${vehicle.model} ${catName} Price in ${locationName}`;
    subtitle = `With Battery Mantra, get ${vehicle.make} ${vehicle.model} ${catName} at best price`;
    imageUrl = vehicle.imageUrl || "";
  } else if (brand && category) {
    title = `${brand.brandName} ${category.categoryName} Price in ${locationName}`;
    subtitle = `With Battery Mantra, get ${brand.brandName} ${category.categoryName} at best price`;
    imageUrl = brand.brandLogo || "";
  } else if (brand) {
    title = `${brand.brandName} Batteries Price in ${locationName}`;
    subtitle = `With Battery Mantra, get ${brand.brandName} Batteries at best price`;
    imageUrl = brand.brandLogo || "";
  } else if (category) {
    title = `${category.categoryName} Price in ${locationName}`;
    subtitle = `With Battery Mantra, get ${category.categoryName} at best price`;
    imageUrl = category.iconUrl || "";
  }

  return (
    <div className="mb-6 border-2 border-dashed border-gray-200 rounded-3xl overflow-hidden py-4 px-6 relative bg-white">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
        {imageUrl && (
          <div className="shrink-0">
            <img 
              src={imageUrl} 
              alt={title} 
              className="h-14 object-contain"
            />
          </div>
        )}
        <div className="flex flex-col items-center">
          <h1 className="text-xl md:text-2xl font-bold uppercase text-foreground">
            {title}
          </h1>
          <p className="text-brand font-medium text-lg mt-1">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
