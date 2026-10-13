/**
 * Centralized SEO Redirect Mapping
 * Maps legacy URLs from the old website to the new URL structure with HTTP 301.
 */

export const EXACT_SEO_REDIRECTS: Record<string, string> = {
  "/shop-by-manufacturers": "/manufacturers/car-batteries",
  "/shop-by-category/inverter-battery": "/brands/inverter-battery",
  "/shop-by-category/inverter-batteries": "/brands/inverter-battery",
  "/shop-by-category/generator-batteries": "/brands/generator-battery",
  "/shop-by-category/generator-battery": "/brands/generator-battery",
};

/**
 * Resolves incoming URL to target URL if a redirect is required, otherwise returns null.
 */
export function getSeoRedirect(rawPathname: string): string | null {
  if (!rawPathname) return null;

  // Normalize path (strip query params, trailing slashes, lowercase)
  const clean = rawPathname.split("?")[0].trim().replace(/\/+$/, "").toLowerCase();

  // 1. Check exact match
  if (EXACT_SEO_REDIRECTS[clean]) {
    return EXACT_SEO_REDIRECTS[clean];
  }

  // 2. Check /shop-by-category/* pattern
  if (clean.startsWith("/shop-by-category/")) {
    const remainder = clean.replace("/shop-by-category/", "");
    const parts = remainder.split("/").filter(Boolean);
    const cat = parts[0] || "";
    const city = parts[1] || "";

    const isCar = cat === "car-batteries" || cat === "car-battery";
    const normCat = isCar
      ? "car-batteries"
      : cat.endsWith("-batteries")
        ? cat.slice(0, -3) + "y"
        : cat;

    if (isCar) {
      return city ? `/manufacturers/car-batteries/${city}` : "/manufacturers/car-batteries";
    }
    return city ? `/brands/${normCat}/${city}` : `/brands/${normCat}`;
  }

  return null;
}
