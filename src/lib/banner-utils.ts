export type BannerDeviceType = "ALL" | "DESKTOP" | "MOBILE";

/**
 * Parses the raw banner title string to extract device targeting.
 * Conventions:
 *  - "[DESKTOP] ..." or "[DESKTOP]" -> DESKTOP
 *  - "[MOBILE] ..." or "[MOBILE]" -> MOBILE
 *  - anything else -> ALL
 */
export function parseBannerTitle(rawTitle?: string | null): {
  deviceType: BannerDeviceType;
  cleanTitle: string;
} {
  if (!rawTitle) return { deviceType: "ALL", cleanTitle: "" };

  const trimmed = rawTitle.trim();
  if (trimmed.toUpperCase().startsWith("[DESKTOP]")) {
    return {
      deviceType: "DESKTOP",
      cleanTitle: trimmed.replace(/^\[DESKTOP\]\s*/i, "").trim(),
    };
  }
  if (trimmed.toUpperCase().startsWith("[MOBILE]")) {
    return {
      deviceType: "MOBILE",
      cleanTitle: trimmed.replace(/^\[MOBILE\]\s*/i, "").trim(),
    };
  }
  return {
    deviceType: "ALL",
    cleanTitle: trimmed,
  };
}

/**
 * Formats clean title with device targeting tag if applicable.
 */
export function formatBannerTitle(cleanTitle: string | undefined | null, deviceType: BannerDeviceType): string | undefined {
  const title = cleanTitle?.trim() || "";
  if (deviceType === "DESKTOP") {
    return title ? `[DESKTOP] ${title}` : "[DESKTOP]";
  }
  if (deviceType === "MOBILE") {
    return title ? `[MOBILE] ${title}` : "[MOBILE]";
  }
  return title || undefined;
}
