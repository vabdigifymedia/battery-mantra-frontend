/**
 * Image helpers. Wire to a real CDN later.
 */
export function buildSrcSet(src: string, widths: number[] = [320, 480, 640, 960, 1280]): string {
  return widths.map((w) => `${appendQuery(src, { w })} ${w}w`).join(", ");
}

export function appendQuery(src: string, params: Record<string, string | number>): string {
  if (!src) return src;
  try {
    const url = new URL(src, "http://localhost");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    return src.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
  } catch {
    return src;
  }
}

export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><rect width='1' height='1' fill='%23f3f4f6'/></svg>";
