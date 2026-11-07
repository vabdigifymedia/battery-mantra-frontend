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
 * 2. Injects 'f_auto,q_auto' into Cloudinary URLs so every device receives its optimal supported format (WebP, AVIF, or JPEG/PNG fallback).
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim();
  if (!clean) return "";

  // Upgrade http to https to avoid mixed-content blocking on modern mobile devices
  if (clean.startsWith("http://")) {
    clean = clean.replace(/^http:\/\//i, "https://");
  }

  // Cloudinary auto-optimization for cross-device support (WebP/AVIF/fallback)
  if (
    clean.includes("res.cloudinary.com") &&
    clean.includes("/image/upload/") &&
    !clean.includes("/f_auto") &&
    !clean.includes("/q_auto")
  ) {
    clean = clean.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  }

  return clean;
}

/**
 * High-quality SVG Battery illustration fallback.
 * Renders instantly with 0 external network requests if image fails or is missing.
 */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240' fill='none'><rect width='240' height='240' fill='%23f8fafc' rx='16'/><rect x='55' y='75' width='130' height='105' rx='10' fill='%23e2e8f0' stroke='%23cbd5e1' stroke-width='4'/><rect x='76' y='60' width='26' height='15' rx='3' fill='%2394a3b8'/><rect x='138' y='60' width='26' height='15' rx='3' fill='%2394a3b8'/><path d='M123 96L105 128H121L116 154L137 122H123L128 96Z' fill='%23dc2626'/><text x='120' y='208' font-family='system-ui,-apple-system,sans-serif' font-size='12' font-weight='700' fill='%2394a3b8' text-anchor='middle'>BATTERY MANTRA</text></svg>";

export const FALLBACK_BATTERY_IMAGE = FALLBACK_IMAGE;
