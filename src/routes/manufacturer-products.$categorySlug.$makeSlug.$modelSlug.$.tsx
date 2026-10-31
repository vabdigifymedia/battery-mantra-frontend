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
  productFilterQuery,
} from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo, extractBatteryCapacity, extractProductPriceStats } from "@/lib/seo-templates";
import { ProductsPageLayout } from "@/components/products/ProductsPageLayout";
import { toSlug, toSingularCategory } from "@/lib/utils";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";

export function findMatchingVehicle(
  vehicles: any[] | undefined,
  manufacturers: any[] | undefined,
  makeSlug: string,
  modelSlug: string,
  categorySlug?: string
) {
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
  const isCar = categorySlug ? /(^|-)car(-|$)/.test(categorySlug) : false;
  const isBike = categorySlug ? /(^|-)bike(-|$)/.test(categorySlug) : false;
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
}

export const Route = createFileRoute("/manufacturer-products/$categorySlug/$makeSlug/$modelSlug/$")({
  loader: async ({ context, params }) => {
    void context.queryClient.prefetchQuery(rootCategoriesQuery());
    void context.queryClient.prefetchQuery(brandsQuery());

    const [templates, vehicles, manufacturers] = await Promise.all([
      context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(vehiclesListQuery()).catch(() => []),
      context.queryClient.ensureQueryData(manufacturersListQuery()).catch(() => []),
    ]);

    const { makeSlug, modelSlug, categorySlug } = params as any;
    const vehicle = findMatchingVehicle(vehicles, manufacturers, makeSlug, modelSlug, categorySlug);
    const manufacturer = manufacturers?.find((m: any) => toSlug(m.name) === makeSlug);

    // Fetch initial products for this vehicle to derive price statistics and capacity for SEO
    let initialProducts: any[] = [];
    if (vehicle?.vehicleId) {
      try {
        const prodData = await context.queryClient.ensureQueryData(
          productFilterQuery({ vehicleId: vehicle.vehicleId, size: 24 })
        );
        initialProducts = prodData?.content || [];
      } catch {
        initialProducts = [];
      }
    }

    return { templates, vehicle, manufacturer, initialProducts };
  },
  head: ({ params, loaderData }) => {
    const { templates, vehicle, manufacturer, initialProducts } = (loaderData as any) || {};
    const { categorySlug, makeSlug, modelSlug, _splat } = params as any;

    const fallbackMake = makeSlug ? makeSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "";
    const rawModel = modelSlug && modelSlug.startsWith(makeSlug + '-') 
      ? modelSlug.slice(makeSlug.length + 1)
      : (modelSlug || "");
    const fallbackModel = rawModel ? rawModel.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "";

    // Prioritize actual database vehicle entity
    const make = vehicle?.make || manufacturer?.name || fallbackMake;
    const model = vehicle?.model || fallbackModel;
    const categoryName = toSingularCategory(categorySlug ? categorySlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Car Battery");

    // City from splat (e.g. /manufacturer-products/.../noida) or undefined
    const citySlug = _splat || undefined;
    const cityNameStr = citySlug ? citySlug.charAt(0).toUpperCase() + citySlug.slice(1) : undefined;

    // Avoid duplicate brand like "Honda Honda Amaze" if model already starts with make
    const displayFullName = model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`;

    const capacity = extractBatteryCapacity(vehicle, initialProducts);
    const priceStats = extractProductPriceStats(initialProducts);

    const seo = resolveTemplateSeo(
      "SUB_MANUFACTURER",
      templates,
      {
        manufacturer_name: make,
        model_name: model,
        category_name: categoryName,
        capacity,
        battery_capacity: capacity,
        price: priceStats.priceFormatted,
        price_low: priceStats.priceLowestFormatted,
        price_lowest: priceStats.priceLowestFormatted,
        price_high: priceStats.priceHighestFormatted,
        price_highest: priceStats.priceHighestFormatted,
        price_range: priceStats.priceRangeFormatted,
        fuel_type: vehicle?.fuelName || "",
        fuel_name: vehicle?.fuelName || "",
        warranty_range: priceStats.warrantyRangeFormatted,
        vehicle_type: vehicle?.vehicleType || "Car",
        delivery_time: "1-2 Hours",
        ...(cityNameStr && { city_name: cityNameStr }),
      },
      (vehicle as any)?.seo || null,
      {
        title: capacity
          ? `${displayFullName} ${capacity} Battery Online | Buy 100% Genuine Car Battery`
          : `${displayFullName} Battery Online | Buy 100% Genuine Car Battery`,
        description: `Buy 100% Genuine ${displayFullName}${capacity ? ` ${capacity}` : ""} Battery Online at Best Price${priceStats.priceRangeFormatted ? ` (${priceStats.priceRangeFormatted})` : ""} in India. Get Free Express Delivery and Installation in 1-2 hours.`,
      }
    );

    return buildPageHead(seo, {
      title: capacity
        ? `${displayFullName} ${capacity} Battery Online | Buy 100% Genuine Car Battery`
        : `${displayFullName} Battery Online | Buy 100% Genuine Car Battery`,
      description: `Buy 100% Genuine ${displayFullName}${capacity ? ` ${capacity}` : ""} Battery Online at Best Price${priceStats.priceRangeFormatted ? ` (${priceStats.priceRangeFormatted})` : ""} in India. Get Free Express Delivery and Installation in 1-2 hours.`,
    });
  },
  validateSearch: productSearchSchema,
  component: VehicleProductsPage,
});

function VehicleProductsPage() {
  const { categorySlug, makeSlug, modelSlug, _splat } = Route.useParams() as any;
  const loaderData = Route.useLoaderData();
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

  // Find the exact vehicle matching the slugs (prioritizing loaded vehicle)
  const matchingVehicle = useMemo(() => {
    return (
      (loaderData as any)?.vehicle ||
      findMatchingVehicle(vehicles, manufacturers, makeSlug, modelSlug, categorySlug)
    );
  }, [loaderData, vehicles, manufacturers, makeSlug, modelSlug, categorySlug]);

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
