/**
 * Image helpers & CDN utilities for BatteryMantra
 */
import { env, isBrowser } from "@/lib/utils/env";

export function buildSrcSet(src: string, widths: number[] = [320, 480, 640, 960, 1280]): string {
  return widths.map((w) => `${appendQuery(src, { w })} ${w}w`).join(", ");
}

export function appendQuery(src: string, params: Record<string, string | number>): string {
  if (!src) return src;
  try {
    const dummyBase = isBrowser ? window.location.origin : (env.API_BASE_URL || "http://dummy");
    const url = new URL(src, dummyBase);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    return src.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
  } catch {
    return src;
  }
}

/**
 * Normalizes image URLs:
 * 1. Upgrades insecure 'http://' to 'https://' to prevent browser mixed-content blocking.
 * 2. URL-encodes literal spaces to prevent mobile WebKit fetch failures.
 * 3. Never mutates Cloudinary or CDN paths to avoid breaking signed or strict-delivery URLs.
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim();
  if (!clean) return "";

  // Relative VPS uploads and public images are returned directly
  if (clean.startsWith("/uploads/") || clean.startsWith("/images/")) {
    return clean;
  }

  // Upgrade http to https to avoid mixed-content blocking on modern mobile devices
  if (clean.startsWith("http://")) {
    clean = clean.replace(/^http:\/\//i, "https://");
  }

  // URL-encode literal spaces if not already encoded or data URI
  if (clean.includes(" ") && !clean.startsWith("data:")) {
    clean = clean.replace(/ /g, "%20");
  }

  return clean;
}

/**
 * High-quality SVG Battery illustration fallback.
 * 100% standards-compliant data URI compatible across Safari, Chrome, Firefox, and mobile WebKit.
 */
export const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240' fill='none'%3E%3Crect width='240' height='240' fill='%23f8fafc' rx='16'/%3E%3Crect x='55' y='75' width='130' height='105' rx='10' fill='%23e2e8f0' stroke='%23cbd5e1' stroke-width='4'/%3E%3Crect x='76' y='60' width='26' height='15' rx='3' fill='%2394a3b8'/%3E%3Crect x='138' y='60' width='26' height='15' rx='3' fill='%2394a3b8'/%3E%3Cpath d='M123 96L105 128H121L116 154L137 122H123L128 96Z' fill='%23dc2626'/%3E%3Ctext x='120' y='208' font-family='system-ui,-apple-system,sans-serif' font-size='12' font-weight='700' fill='%2394a3b8' text-anchor='middle'%3EBATTERY MANTRA%3C/text%3E%3C/svg%3E";

export const FALLBACK_BATTERY_IMAGE = FALLBACK_IMAGE;
