import { useRouter } from "@tanstack/react-router";
import { useLocationStore } from "@/store/useLocationStore";
import { useQueryClient } from "@tanstack/react-query";
import type { CityDto } from "@/types/dto";

export const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

/**
 * Checks whether the current route or URL is explicitly scoped to a city.
 * E.g. /shop/inverter-battery/exide/faridabad -> true
 *      /products/faridabad -> true
 *      /brands/car-battery/faridabad -> true
 *      /shop/inverter-battery/exide -> false
 */
export function isRouteCityScoped(
  routeId?: string,
  params?: Record<string, string>,
  pathname?: string,
  cities?: CityDto[]
): boolean {
  // 1. Direct route params check (synchronous and instant on render)
  if (params?.citySlug) return true;
  if (routeId?.includes("$citySlug")) return true;

  // 2. Splats that contain 2 segments (e.g. product/slug/city or shop-by-category/slug/city)
  if (params?._splat && params._splat.includes("/")) {
    return true;
  }

  // 3. Pathname segments check against known cities
  if (pathname && cities && cities.length > 0) {
    const clean = pathname.replace(/\/+$/, "");
    const segments = clean.split("/").filter(Boolean);
    const lastSeg = segments[segments.length - 1]?.toLowerCase();
    if (lastSeg && cities.some(c => toSlug(c.cityName) === lastSeg)) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts and matches a CityDto from route params or pathname
 */
export function getMatchedCityFromUrl(
  pathname?: string,
  params?: Record<string, string>,
  cities?: CityDto[]
): CityDto | undefined {
  if (!cities || cities.length === 0) return undefined;

  const targetSlug = params?.citySlug?.toLowerCase() || (
    params?._splat && params._splat.includes("/")
      ? params._splat.split("/")[1]?.toLowerCase()
      : undefined
  ) || (
    pathname
      ? pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop()?.toLowerCase()
      : undefined
  );

  if (!targetSlug) return undefined;

  return cities.find(c => toSlug(c.cityName) === targetSlug);
}

/**
 * Route IDs (from routeTree.gen.ts) that contain a city slug in the URL.
 * Also includes index routes that have city-slug variants, so we can
 * navigate the user to the city-specific version when they change location.
 */
const CITY_ROUTE_MAP: Record<string, (params: Record<string, string>, citySlug: string) => string> = {
  // Product splat: /product/{slug}/{city}
  "/product/$": (params, citySlug) => {
    const splat = params._splat || "";
    const slug = splat.split("/")[0];
    return slug ? `/product/${slug}/${citySlug}` : "";
  },

  // Manufacturer products splat: /manufacturer-products/{cat}/{make}/{model}/{city}
  "/manufacturer-products/$categorySlug/$makeSlug/$modelSlug/$": (params, citySlug) =>
    `/manufacturer-products/${params.categorySlug}/${params.makeSlug}/${params.modelSlug}/${citySlug}`,

  // Manufacturers combined (slug can be make or city)
  "/manufacturers/$categorySlug/$slug": (params, citySlug) =>
    `/manufacturers/${params.categorySlug}/${citySlug}`,

  // Manufacturers + make + city variant
  "/manufacturers/$categorySlug/$slug/$citySlug": (params, citySlug) =>
    `/manufacturers/${params.categorySlug}/${params.slug}/${citySlug}`,

  // Manufacturers root index
  "/manufacturers/$categorySlug/": (params, citySlug) =>
    `/manufacturers/${params.categorySlug}/${citySlug}`,

  // Brands — city variant (already has city)
  "/brands/$categorySlug/$citySlug": (params, citySlug) =>
    `/brands/${params.categorySlug}/${citySlug}`,

  // Brands — index (no city yet, navigate to city variant)
  "/brands/$categorySlug/": (params, citySlug) =>
    `/brands/${params.categorySlug}/${citySlug}`,

  // Products
  "/products/": (params, citySlug) => `/products/${citySlug}`,
  "/products/$citySlug": (params, citySlug) => `/products/${citySlug}`,

  // Shop specific categories
  "/shop/c/$categorySlug/": (params, citySlug) => `/shop/c/${params.categorySlug}/${citySlug}`,
  "/shop/c/$categorySlug/$citySlug": (params, citySlug) => `/shop/c/${params.categorySlug}/${citySlug}`,

  // Shop category and brand
  "/shop/$categorySlug/$brandSlug/": (params, citySlug) => `/shop/${params.categorySlug}/${params.brandSlug}/${citySlug}`,
  "/shop/$categorySlug/$brandSlug/$citySlug": (params, citySlug) => `/shop/${params.categorySlug}/${params.brandSlug}/${citySlug}`,

  // Shop by category splat: /shop-by-category/{categorySlug}/{citySlug}
  "/shop-by-category/$": (params, citySlug) => {
    const splat = params._splat || "";
    const categorySlug = splat.split("/")[0];
    return categorySlug ? `/shop-by-category/${categorySlug}/${citySlug}` : "";
  },
};

/**
 * Centralized hook for changing location.
 * Updates both the Zustand store AND the URL (if the current page supports city in URL).
 *
 * Usage:
 *   const { changeLocation } = useLocationNavigation();
 *   changeLocation(city);                          // city only
 *   changeLocation(city, "110001");                 // city + pincode
 *   changeLocation(city, "110001", true);           // city + pincode + serviceable
 */
export function useLocationNavigation() {
  const router = useRouter();
  const { setLocation } = useLocationStore();
  const qc = useQueryClient();

  const changeLocation = (
    city: CityDto,
    pincode: string = "",
    isServiceable: boolean = true,
  ) => {
    // 1. Update Zustand store
    setLocation(pincode, isServiceable, city);

    // 2. Invalidate queries so data refreshes
    qc.invalidateQueries({ queryKey: ["products"] });

    // 3. Determine if the URL needs to change
    const matches = router.state.matches;
    const leafMatch = matches[matches.length - 1];
    const routeId = leafMatch.routeId as string;
    const params = (leafMatch.params || {}) as Record<string, string>;
    const citySlug = toSlug(city.cityName);

    const buildUrl = CITY_ROUTE_MAP[routeId];
    if (buildUrl) {
      const newPath = buildUrl(params, citySlug);
      if (newPath && newPath !== router.state.location.pathname) {
        router.navigate({ to: newPath as any });
      }
    }
    // For routes not in the map (home, admin, etc.) we just update the store — no URL change.
  };

  return { changeLocation };
}
