import type { ProductListResponse, ProductDetailResponse, VehicleResponse } from "@/types/dto";

/**
 * Parsed battery capacity representation
 */
export interface ParsedCapacity {
  raw: string;
  ah?: number;
  dinCode?: string;
  jisCode?: string;
}

/**
 * Normalized category extraction to prevent typos / plural differences
 */
export function normalizeCategoryName(cat?: string | null): string {
  if (!cat) return "";
  return cat
    .toLowerCase()
    .trim()
    .replace(/[\-_]/g, " ")
    .replace(/ies$/, "y") // e.g. batteries -> battery
    .replace(/s$/, "");   // e.g. inverters -> inverter
}

/**
 * Extracts Ah (Ampere-Hour), DIN codes (e.g. DIN60), or JIS codes (e.g. 38B20L)
 * from capacity fields or product names.
 */
export function parseBatteryCapacity(
  capacityStr?: string | null,
  capacityAhStr?: string | null,
  productName?: string | null
): ParsedCapacity {
  const combined = `${capacityStr || ""} ${capacityAhStr || ""} ${productName || ""}`.toLowerCase();

  // 1. Try extracting numeric Ah (e.g. 35ah, 35 ah, 45ah, 150ah, 200 ah)
  let ah: number | undefined = undefined;

  if (capacityAhStr) {
    const directAhMatch = capacityAhStr.match(/(\d+(?:\.\d+)?)/);
    if (directAhMatch) {
      const parsed = parseFloat(directAhMatch[1]);
      if (parsed > 0 && parsed <= 500) ah = parsed;
    }
  }

  if (!ah) {
    const ahMatch = combined.match(/(\d+(?:\.\d+)?)\s*ah\b/i) || combined.match(/\b(\d+(?:\.\d+)?)\s*a\.h\b/i);
    if (ahMatch) {
      const parsed = parseFloat(ahMatch[1]);
      if (parsed > 0 && parsed <= 500) ah = parsed;
    }
  }

  // 2. Try extracting DIN code (e.g. DIN44, DIN50, DIN55, DIN60, DIN65, DIN74, DIN80, DIN100)
  let dinCode: string | undefined = undefined;
  const dinMatch = combined.match(/\bdin\s*(\d{2,3})\b/i);
  if (dinMatch) {
    dinCode = `din${dinMatch[1]}`;
    // Common DIN Ah estimations if not already found
    if (!ah) {
      const dinNum = parseInt(dinMatch[1], 10);
      if (dinNum >= 40 && dinNum <= 110) ah = dinNum;
    }
  }

  // 3. Try extracting JIS / standard car battery box codes (e.g. 38B20L, 45D21L, 55D23L, 80D26L, N55)
  let jisCode: string | undefined = undefined;
  const jisMatch = combined.match(/\b(\d{2}[a-z]\d{2}[lr]?|n\d{2}[lr]?)\b/i);
  if (jisMatch) {
    jisCode = jisMatch[1].toUpperCase();
    if (!ah) {
      if (jisCode.startsWith("38B20")) ah = 35;
      else if (jisCode.startsWith("45D21")) ah = 45;
      else if (jisCode.startsWith("55D23")) ah = 55;
      else if (jisCode.startsWith("80D26")) ah = 65;
      else if (jisCode.startsWith("N55")) ah = 45;
    }
  }

  return {
    raw: (capacityStr || capacityAhStr || "").trim(),
    ah,
    dinCode,
    jisCode,
  };
}

/**
 * Strict category check ensuring Car Batteries are NEVER mixed with Inverter,
 * Solar, Bike, or E-Rickshaw batteries.
 */
export function isSameProductCategory(
  candidate: ProductListResponse,
  current: ProductDetailResponse
): boolean {
  // 1. Direct categoryId equality
  if (candidate.categoryId && current.categoryId && candidate.categoryId === current.categoryId) {
    return true;
  }

  // 2. Candidate belongs to current's category array
  if (candidate.categories && current.categoryId) {
    if (candidate.categories.some((c) => c.categoryId === current.categoryId)) {
      return true;
    }
  }

  // 3. Current product's categories array contains candidate's categoryId
  if (current.categories && candidate.categoryId) {
    if (current.categories.some((c) => c.categoryId === candidate.categoryId)) {
      return true;
    }
  }

  // 4. Normalized string fallback
  const candNorm = normalizeCategoryName(candidate.productCategory);
  const currNorm = normalizeCategoryName(current.categoryName);

  if (candNorm && currNorm) {
    if (candNorm === currNorm) return true;
    // Check if both contain "car" and "battery"
    if (candNorm.includes("car") && currNorm.includes("car")) return true;
    // Check if both contain "inverter"
    if (candNorm.includes("inverter") && currNorm.includes("inverter")) return true;
    // Check if both contain "bike" or "two wheeler"
    if (
      (candNorm.includes("bike") || candNorm.includes("two")) &&
      (currNorm.includes("bike") || currNorm.includes("two"))
    ) {
      return true;
    }
    // Check if both contain "solar"
    if (candNorm.includes("solar") && currNorm.includes("solar")) return true;
  }

  return false;
}

/**
 * Determines if two parsed capacities are direct fitment equivalents
 */
export function isCapacityEquivalent(
  cand: ParsedCapacity,
  curr: ParsedCapacity
): { isEquivalent: boolean; matchType: "exact_ah" | "din_match" | "close_ah" | "none"; label?: string } {
  // DIN match
  if (cand.dinCode && curr.dinCode && cand.dinCode === curr.dinCode) {
    return { isEquivalent: true, matchType: "din_match", label: `Same ${curr.dinCode.toUpperCase()}` };
  }

  // Exact Ah match (e.g. 35Ah === 35Ah)
  if (cand.ah && curr.ah && cand.ah === curr.ah) {
    return { isEquivalent: true, matchType: "exact_ah", label: `Direct ${curr.ah}Ah Fit` };
  }

  // Close Ah match within ±3Ah (e.g. 35Ah vs 38Ah) which share same battery tray/group
  if (cand.ah && curr.ah && Math.abs(cand.ah - curr.ah) <= 3) {
    return { isEquivalent: true, matchType: "close_ah", label: `Compatible ${cand.ah}Ah` };
  }

  // Exact raw string match if neither has parsed Ah
  if (cand.raw && curr.raw && cand.raw.toLowerCase() === curr.raw.toLowerCase()) {
    return { isEquivalent: true, matchType: "exact_ah", label: `Same ${curr.raw}` };
  }

  return { isEquivalent: false, matchType: "none" };
}

export interface ScoredProduct {
  product: ProductListResponse;
  score: number;
  matchType: "alternative" | "brand_series" | "vehicle_fit" | "category_popular";
  badge?: string;
  badgeVariant?: "emerald" | "blue" | "amber" | "purple" | "default";
}

export interface RecommendationBuckets {
  directAlternatives: ScoredProduct[];
  sameBrandOptions: ScoredProduct[];
  compatibleFitments: ScoredProduct[];
  allRecommended: ScoredProduct[];
  currentCapacityLabel?: string;
}

/**
 * Industry-grade recommendation scoring algorithm
 */
export function getSmartRecommendations(
  allProducts: ProductListResponse[] | undefined,
  currentProduct: ProductDetailResponse | undefined,
  vehicles?: VehicleResponse[]
): RecommendationBuckets {
  const emptyResult: RecommendationBuckets = {
    directAlternatives: [],
    sameBrandOptions: [],
    compatibleFitments: [],
    allRecommended: [],
  };

  if (!allProducts || !currentProduct || allProducts.length === 0) {
    return emptyResult;
  }

  const currCap = parseBatteryCapacity(
    currentProduct.capacity,
    (currentProduct as any).capacityAh,
    currentProduct.productName
  );

  const currentBrandId = currentProduct.brandId;
  const currentBrandName = (currentProduct.brandName || "").trim().toLowerCase();
  const currentPrice = currentProduct.productPrice || 0;

  // Find all capacity codes associated with vehicles that fit the current product
  const compatibleCapacityCodes = new Set<string>();
  if (currentProduct.capacity && vehicles && vehicles.length > 0) {
    const cleanCurrCap = currentProduct.capacity.toLowerCase().trim();
    for (const v of vehicles) {
      const vCaps = (v.capacity || "").toLowerCase().split(",").map((c) => c.trim());
      if (vCaps.includes(cleanCurrCap)) {
        // This vehicle fits the current product, add all its alternative capacities
        vCaps.forEach((c) => compatibleCapacityCodes.add(c));
      }
    }
  }

  const scoredList: ScoredProduct[] = [];

  for (const candidate of allProducts) {
    // 1. SELF EXCLUSION: Never recommend current product
    if (candidate.productId === currentProduct.productId) continue;

    // 2. APPROVAL GATE: Skip unapproved partner drafts
    if (candidate.isApproved === false) continue;

    // 3. STRICT CATEGORY GATE: ZERO CROSS-CATEGORY POLLUTION
    // A Car Battery PDP must NEVER show Inverter, Solar, Bike, or E-Rickshaw items!
    if (!isSameProductCategory(candidate, currentProduct)) continue;

    const candCap = parseBatteryCapacity(
      candidate.capacity,
      candidate.capacityAh,
      candidate.productName
    );

    const isSameBrand =
      (candidate.brandId && currentBrandId && candidate.brandId === currentBrandId) ||
      (candidate.brandName && currentBrandName && candidate.brandName.trim().toLowerCase() === currentBrandName);

    const { isEquivalent, matchType: capMatchType, label: capLabel } = isCapacityEquivalent(candCap, currCap);

    let score = 0;
    let matchType: ScoredProduct["matchType"] = "category_popular";
    let badge: string | undefined = undefined;
    let badgeVariant: ScoredProduct["badgeVariant"] = "default";

    // 4. CAPACITY SCORING
    if (isEquivalent) {
      if (capMatchType === "exact_ah" || capMatchType === "din_match") {
        score += 50;
      } else {
        score += 35;
      }
    } else if (candCap.ah && currCap.ah && Math.abs(candCap.ah - currCap.ah) <= 8) {
      score += 15;
    }

    // 5. VEHICLE COMPATIBILITY OVERLAP SCORING
    const candRawCap = (candidate.capacity || "").toLowerCase().trim();
    if (candRawCap && compatibleCapacityCodes.has(candRawCap)) {
      score += 25;
      matchType = "vehicle_fit";
      badge = "Fits Same Cars";
      badgeVariant = "purple";
    }

    // 6. BRAND DIVERSITY vs BRAND UPGRADE
    if (isEquivalent) {
      if (!isSameBrand) {
        // Cross-brand alternative with same capacity (e.g. Exide vs Amaron vs SF)
        score += 30;
        matchType = "alternative";
        badge = capLabel || `Direct Alternative`;
        badgeVariant = "emerald";

        // Price saving callout
        if (candidate.productPrice && currentPrice > candidate.productPrice) {
          const diff = Math.round(currentPrice - candidate.productPrice);
          if (diff >= 200) {
            badge = `Save ₹${diff.toLocaleString("en-IN")}`;
            badgeVariant = "emerald";
          }
        }
      } else {
        // Same brand variant (e.g. higher warranty or upgrade tier)
        score += 25;
        matchType = "brand_series";
        badge = `More from ${candidate.brandName || "Brand"}`;
        badgeVariant = "blue";

        // Check if candidate has warranty
        if (candidate.warranty) {
          badge = `${candidate.warranty} Warranty`;
        }
      }
    } else if (isSameBrand) {
      // Same brand, different capacity tier
      score += 15;
      matchType = "brand_series";
      badge = `More from ${candidate.brandName || "Brand"}`;
      badgeVariant = "blue";
    }

    // 7. IN-STOCK PRIORITY
    if ((candidate.productStock ?? 1) > 0) {
      score += 10;
    }

    // 8. PRICE PROXIMITY (±25% of current price)
    if (currentPrice > 0 && candidate.productPrice > 0) {
      const priceRatio = candidate.productPrice / currentPrice;
      if (priceRatio >= 0.75 && priceRatio <= 1.25) {
        score += 10;
      } else if (priceRatio >= 0.5 && priceRatio <= 1.5) {
        score += 5;
      }
    }

    // Display order boost
    if (candidate.categoryDisplayOrder !== undefined) {
      score += Math.max(0, 10 - candidate.categoryDisplayOrder);
    }

    scoredList.push({
      product: candidate,
      score,
      matchType,
      badge,
      badgeVariant,
    });
  }

  // Sort descending by score
  scoredList.sort((a, b) => b.score - a.score);

  // Divide into targeted buckets
  const directAlternatives = scoredList.filter(
    (item) => item.matchType === "alternative"
  );

  const sameBrandOptions = scoredList.filter(
    (item) => item.matchType === "brand_series"
  );

  const compatibleFitments = scoredList.filter(
    (item) => item.matchType === "vehicle_fit"
  );

  // Overall blended recommendations: top 8 items, guaranteed same category
  const allRecommended = scoredList.slice(0, 8);

  const capLabel = currCap.ah ? `${currCap.ah}Ah` : currCap.dinCode ? currCap.dinCode.toUpperCase() : currCap.raw;

  return {
    directAlternatives,
    sameBrandOptions,
    compatibleFitments,
    allRecommended,
    currentCapacityLabel: capLabel || undefined,
  };
}

