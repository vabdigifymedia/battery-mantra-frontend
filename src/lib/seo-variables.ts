export function replaceSeoVariables(html: string | undefined | null, variables: Record<string, string>): string {
  if (!html) return "";
  
  let processedHtml = html;
  
  // Replace all keys dynamically, e.g., {{city}} -> "Delhi", {{brand}} -> "Exide"
  for (const [key, value] of Object.entries(variables)) {
    // Escape the key in case it has special regex chars
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'gi');
    processedHtml = processedHtml.replace(regex, value || "");
  }
  
  return processedHtml;
}
