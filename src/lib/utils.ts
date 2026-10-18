import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export const toSlug = (text?: string) => text ? text.toLowerCase().trim().replace(/\s+/g, "-") : "";

export function applySeoTemplate(template?: string | null, context: Record<string, string> = {}): string {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(context)) {
    // Matches both {key} and {{key}} with optional whitespace inside
    const regex = new RegExp(`\\{{1,2}\\s*${key}\\s*\\}{1,2}`, 'gi');
    result = result.replace(regex, value || "");
  }
  // Safety fallback: if delivery_time is still unreplaced, replace with context value or standard fallback
  if (/\{{1,2}\s*delivery_time\s*\}{1,2}/i.test(result)) {
    const fallback = context.delivery_time || "1-2 Hours";
    result = result.replace(/\{{1,2}\s*delivery_time\s*\}{1,2}/gi, fallback);
  }
  return result;
}
