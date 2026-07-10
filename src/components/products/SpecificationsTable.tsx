export function SpecificationsTable({ specs }: { specs?: Record<string, unknown> }) {
  if (!specs) return null;
  const entries = Object.entries(specs).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return null;

  const fmt = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  const label = (k: string) =>
    k
      .replace(/[_-]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // Check if specs are grouped (nested objects) or flat
  const isGrouped = entries.some(
    ([, v]) => typeof v === "object" && v !== null && !Array.isArray(v)
  );

  // Separate grouped and flat entries
  const groups: { name: string; entries: [string, unknown][] }[] = [];
  const flatEntries: [string, unknown][] = [];

  if (isGrouped) {
    for (const [key, value] of entries) {
      if (key === "originalPrice") continue; // Skip originalPrice
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const groupEntries = Object.entries(value as Record<string, unknown>).filter(
          ([, v]) => v !== null && v !== undefined && v !== ""
        );
        if (groupEntries.length > 0) {
          groups.push({ name: key, entries: groupEntries });
        }
      } else {
        flatEntries.push([key, value]);
      }
    }
  } else {
    flatEntries.push(...entries.filter(([k]) => k !== "originalPrice"));
  }

  const renderTable = (rows: [string, unknown][], startIdx = 0) => (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v], idx) => (
          <tr key={k} className={(startIdx + idx) % 2 === 0 ? "bg-muted/30" : "bg-card"}>
            <th
              scope="row"
              className="w-1/2 px-4 py-3 text-left font-medium text-muted-foreground"
            >
              {label(k)}
            </th>
            <td className="px-4 py-3 text-foreground">{fmt(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Flat specs — simple table (backward compatible)
  if (!isGrouped) {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        {renderTable(flatEntries)}
      </div>
    );
  }

  // Grouped specs — render with section headings
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.name} className="overflow-hidden rounded-xl border border-border">
          <div className="bg-muted/50 border-b border-border px-4 py-3">
            <h3 className="font-semibold text-base text-foreground">{label(group.name)}</h3>
          </div>
          {renderTable(group.entries)}
        </div>
      ))}

      {/* Render any remaining flat entries that aren't part of a group */}
      {flatEntries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="bg-muted/50 border-b border-border px-4 py-3">
            <h3 className="font-semibold text-base text-foreground">Other Details</h3>
          </div>
          {renderTable(flatEntries)}
        </div>
      )}
    </div>
  );
}

/**
 * Utility: Flatten grouped specs into a flat array for Key Highlights, etc.
 * Works with both flat and grouped specs.
 */
export function flattenSpecs(specs?: Record<string, unknown>): [string, unknown][] {
  if (!specs) return [];
  const result: [string, unknown][] = [];

  for (const [key, value] of Object.entries(specs)) {
    if (key === "originalPrice") continue; // Skip originalPrice
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Nested group — flatten its entries
      for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
        if (subVal !== null && subVal !== undefined && subVal !== "") {
          result.push([subKey, subVal]);
        }
      }
    } else {
      result.push([key, value]);
    }
  }

  return result;
}
