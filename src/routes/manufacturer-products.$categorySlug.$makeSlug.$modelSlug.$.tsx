import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { locationService } from "@/services/location.service";
import { useLocationStore } from "@/store/useLocationStore";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import {
  rootCategoriesQuery,
  brandsQuery,
  vehiclesListQuery,
  manufacturersListQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug, toSingularCategory } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export const Route = createFileRoute("/manufacturer-products/$categorySlug/$makeSlug/$modelSlug/$")({
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());
    void context.queryClient.prefetchQuery(vehiclesListQuery());
    void context.queryClient.prefetchQuery(manufacturersListQuery());
    void context.queryClient.prefetchQuery(seoTemplatesQuery());
    const templates = await context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => []);
    return { templates };
  },
  head: ({ params, loaderData }) => {
    const { templates } = (loaderData as any) || {};
    const { categorySlug, makeSlug, modelSlug, _splat } = params as any;
    const make = makeSlug ? makeSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "";
    
    // Extract the raw model by removing the makeSlug prefix if it exists
    const rawModel = modelSlug && modelSlug.startsWith(makeSlug + '-') 
      ? modelSlug.slice(makeSlug.length + 1)
      : (modelSlug || "");
      
    const model = rawModel ? rawModel.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "";
    const categoryName = toSingularCategory(categorySlug ? categorySlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Car Battery");

    // City from splat (e.g. /manufacturer-products/.../noida) or undefined
    const citySlug = _splat || undefined;
    const cityNameStr = citySlug ? citySlug.charAt(0).toUpperCase() + citySlug.slice(1) : undefined;

    const seo = resolveTemplateSeo(
      "SUB_MANUFACTURER",
      templates,
      {
        manufacturer_name: make,
        model_name: model,
        category_name: categoryName,
        delivery_time: "1-2 Hours",
        ...(cityNameStr && { city_name: cityNameStr }),
      },
      null,
      {
        title: `${make} ${model} Battery Online | Buy 100% Genuine Car Battery`,
        description: `Buy 100% Genuine ${make} ${model} Battery Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    return buildPageHead(seo, {
      title: `${make} ${model} Battery Online | Buy 100% Genuine Car Battery`,
      description: `Buy 100% Genuine ${make} ${model} Battery Online at Best Price in India. Get Free Express Delivery and Installation in 1-2 hours.`,
    });
  },
  validateSearch: productSearchSchema,
  component: VehicleProductsPage,
});

function VehicleProductsPage() {
  const { categorySlug, makeSlug, modelSlug, _splat } = Route.useParams() as any;
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/manufacturer-products/$categorySlug/$makeSlug/$modelSlug/$" });
  const { city, pincode, setLocation } = useLocationStore();

  useEffect(() => {
    const citySlug = _splat;
    if (citySlug) {
      const currentCitySlug = city?.cityName?.toLowerCase().replace(/\s+/g, '-');
      if (currentCitySlug !== citySlug.toLowerCase()) {
        locationService.getPublicCities().then(cities => {
          const matchedCity = cities.find(c => c.cityName?.toLowerCase().replace(/\s+/g, '-') === citySlug.toLowerCase());
          if (matchedCity) {
            setLocation(pincode || "", true, matchedCity);
          }
        }).catch(console.error);
      }
    }
  }, [_splat, city?.cityName, pincode, setLocation]);

  // Load vehicles and manufacturers
  const { data: vehicles, isLoading } = useQuery(vehiclesListQuery());
  const { data: manufacturers } = useQuery(manufacturersListQuery());

  // Find the exact vehicle matching the slugs
  const matchingVehicle = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return undefined;

    // 1. Identify manufacturer / make candidates
    const matchedMfr = manufacturers?.find(m => toSlug(m.name) === makeSlug);
    const mfrNameSlug = matchedMfr ? toSlug(matchedMfr.name) : "";

    const isMakeMatch = (vMake: string) => {
      const vMakeSlug = toSlug(vMake);
      if (!vMakeSlug) return false;
      return (
        vMakeSlug === makeSlug ||
        (mfrNameSlug && vMakeSlug === mfrNameSlug) ||
        makeSlug.startsWith(vMakeSlug) ||
        vMakeSlug.startsWith(makeSlug)
      );
    };

    // Filter by make if any match
    const makeVehicles = vehicles.filter(v => isMakeMatch(v.make));
    const searchPool = makeVehicles.length > 0 ? makeVehicles : vehicles;

    // Extract raw model slug by removing make prefix
    const rawModelSlug = modelSlug && modelSlug.startsWith(makeSlug + "-")
      ? modelSlug.slice(makeSlug.length + 1)
      : (modelSlug || "");

    const rawModelSlugNoMfr = mfrNameSlug && rawModelSlug.startsWith(mfrNameSlug + "-")
      ? rawModelSlug.slice(mfrNameSlug.length + 1)
      : rawModelSlug;

    // Prefer vehicle type matching category (e.g. CAR for car-batteries)
    const isCar = /(^|-)car(-|$)/.test(categorySlug);
    const isBike = /(^|-)bike(-|$)/.test(categorySlug);
    const targetType = isCar ? "CAR" : isBike ? "BIKE" : null;

    const sortByTargetType = (a: any, b: any) => {
      if (!targetType) return 0;
      if (a.vehicleType === targetType && b.vehicleType !== targetType) return -1;
      if (b.vehicleType === targetType && a.vehicleType !== targetType) return 1;
      return 0;
    };

    const sortedPool = [...searchPool].sort(sortByTargetType);

    // Priority 0: Exact match by vehicle.slug (dedicated DB slug)
    const matchBySavedSlug = sortedPool.find(v => {
      if (!v.slug) return false;
      const s = toSlug(v.slug);
      return (
        s === modelSlug ||
        s === rawModelSlug ||
        s === rawModelSlugNoMfr ||
        `${makeSlug}-${s}` === modelSlug ||
        (mfrNameSlug && `${mfrNameSlug}-${s}` === modelSlug)
      );
    });

    if (matchBySavedSlug) return matchBySavedSlug;

    // Priority 1: Exact match with fuel (e.g. kia-motors-corporation-carnival-diesel or carnival-diesel)
    const matchWithFuel = sortedPool.find(v => {
      const vMakeSlug = toSlug(v.make);
      const vModelSlug = toSlug(v.model);
      const vFuelSlug = toSlug(v.fuelName || "");
      if (!vFuelSlug) return false;

      // Full slugs
      if (
        modelSlug === `${vMakeSlug}-${vModelSlug}-${vFuelSlug}` ||
        modelSlug === `${makeSlug}-${vModelSlug}-${vFuelSlug}` ||
        (mfrNameSlug && modelSlug === `${mfrNameSlug}-${vModelSlug}-${vFuelSlug}`)
      ) {
        return true;
      }

      // Raw model slugs
      if (
        rawModelSlug === `${vModelSlug}-${vFuelSlug}` ||
        rawModelSlugNoMfr === `${vModelSlug}-${vFuelSlug}`
      ) {
        return true;
      }

      return false;
    });

    if (matchWithFuel) return matchWithFuel;

    // Priority 2: Exact match on model (without fuel, or where v.model already includes fuel)
    const matchModelOnly = sortedPool.find(v => {
      const vMakeSlug = toSlug(v.make);
      const vModelSlug = toSlug(v.model);

      if (
        modelSlug === `${vMakeSlug}-${vModelSlug}` ||
        modelSlug === `${makeSlug}-${vModelSlug}` ||
        (mfrNameSlug && modelSlug === `${mfrNameSlug}-${vModelSlug}`)
      ) {
        return true;
      }

      if (rawModelSlug === vModelSlug || rawModelSlugNoMfr === vModelSlug) {
        return true;
      }

      return false;
    });

    if (matchModelOnly) return matchModelOnly;

    // Priority 3: Model slug partial/prefix match
    const matchFuzzy = sortedPool.find(v => {
      const vModelSlug = toSlug(v.model);
      if (!vModelSlug) return false;
      return rawModelSlug.startsWith(vModelSlug) || vModelSlug.startsWith(rawModelSlug);
    });

    return matchFuzzy;
  }, [vehicles, manufacturers, makeSlug, modelSlug, categorySlug]);

  const vehicleIdOverride = matchingVehicle?.vehicleId;

  // Inject category from route param so ProductsPageLayout only returns items for this category
  const activeSearch = useMemo(() => ({
    ...search,
    category: categorySlug,
  }), [search, categorySlug]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <ProductsPageLayout 
      search={activeSearch}
      onSearchChange={(newSearch) => {
        // Strip the category from query params so the URL remains clean and unchanged
        const { category, ...cleanSearch } = newSearch;
        navigate({ search: { ...search, ...cleanSearch, page: newSearch.page ?? search.page } });
      }}
      hideCategoryFilter={true}
      vehicleIdOverride={vehicleIdOverride}
      baseUrl={`/manufacturer-products/${makeSlug ? categorySlug : ""}/${makeSlug}/${modelSlug}`}
    />
  );
}
