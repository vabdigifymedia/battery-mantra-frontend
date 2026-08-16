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

export const toSlug = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-");

export function applySeoTemplate(template: string, context: Record<string, string>): string {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(context)) {
    // Matches both {key} and {{key}} with optional whitespace inside
    const regex = new RegExp(`\\{{1,2}\\s*${key}\\s*\\}{1,2}`, 'gi');
    result = result.replace(regex, value || "");
  }
  return result;
}
