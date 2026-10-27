export type BannerDeviceType = "ALL" | "DESKTOP" | "MOBILE";
export type BannerPlacement = "HERO" | "MID_1" | "MID_2" | "BOTTOM";

export const BANNER_PLACEMENTS: { value: BannerPlacement; label: string; description: string }[] = [
  {
    value: "HERO",
    label: "Hero Slider (Top)",
    description: "Main rotating carousel below category pills at top of homepage",
  },
  {
    value: "MID_1",
    label: "Middle Banner 1 (After Categories)",
    description: "Promo banner appearing right below Shop by Category / Car Makes",
  },
  {
    value: "MID_2",
    label: "Middle Banner 2 (After Brands)",
    description: "Promo banner appearing between Top Brands and Featured Batteries",
  },
  {
    value: "BOTTOM",
    label: "Bottom Banner (Before FAQs)",
    description: "Full-width promotional banner placed before FAQs / Footer",
  },
];

export function getPlacementLabel(placement: BannerPlacement): string {
  switch (placement) {
    case "HERO":
      return "Hero Slider";
    case "MID_1":
      return "Middle 1 (After Categories)";
    case "MID_2":
      return "Middle 2 (After Brands)";
    case "BOTTOM":
      return "Bottom (Before FAQs)";
    default:
      return "Hero Slider";
  }
}

/**
 * Parses raw banner title to extract device targeting and slot placement.
 * Examples:
 *  - "[MID_1][DESKTOP] Summer Sale" -> { placement: "MID_1", deviceType: "DESKTOP", cleanTitle: "Summer Sale" }
 *  - "[MOBILE] Battery Exchange Offer" -> { placement: "HERO", deviceType: "MOBILE", cleanTitle: "Battery Exchange Offer" }
 *  - "Normal Title" -> { placement: "HERO", deviceType: "ALL", cleanTitle: "Normal Title" }
 */
export function parseBannerTitle(rawTitle?: string | null): {
  deviceType: BannerDeviceType;
  placement: BannerPlacement;
  cleanTitle: string;
} {
  if (!rawTitle) {
    return { deviceType: "ALL", placement: "HERO", cleanTitle: "" };
  }

  let text = rawTitle.trim();
  let deviceType: BannerDeviceType = "ALL";
  let placement: BannerPlacement = "HERO";

  // Check for placement tags
  if (/\[MID_1\]/i.test(text)) {
    placement = "MID_1";
    text = text.replace(/\[MID_1\]/gi, "").trim();
  } else if (/\[MID_2\]/i.test(text)) {
    placement = "MID_2";
    text = text.replace(/\[MID_2\]/gi, "").trim();
  } else if (/\[BOTTOM\]/i.test(text)) {
    placement = "BOTTOM";
    text = text.replace(/\[BOTTOM\]/gi, "").trim();
  } else if (/\[HERO\]/i.test(text)) {
    placement = "HERO";
    text = text.replace(/\[HERO\]/gi, "").trim();
  }

  // Check for device targeting tags
  if (/\[DESKTOP\]/i.test(text)) {
    deviceType = "DESKTOP";
    text = text.replace(/\[DESKTOP\]/gi, "").trim();
  } else if (/\[MOBILE\]/i.test(text)) {
    deviceType = "MOBILE";
    text = text.replace(/\[MOBILE\]/gi, "").trim();
  }

  return {
    deviceType,
    placement,
    cleanTitle: text,
  };
}

/**
 * Formats title with placement and device tags.
 */
export function formatBannerTitle(
  cleanTitle: string | undefined | null,
  deviceType: BannerDeviceType = "ALL",
  placement: BannerPlacement = "HERO"
): string | undefined {
  const title = cleanTitle?.trim() || "";
  const tags: string[] = [];

  if (placement !== "HERO") {
    tags.push(`[${placement}]`);
  }
  if (deviceType !== "ALL") {
    tags.push(`[${deviceType}]`);
  }

  const prefix = tags.join("");
  if (!prefix && !title) return undefined;
  if (prefix && title) return `${prefix} ${title}`;
  if (prefix) return prefix;
  return title || undefined;
}
