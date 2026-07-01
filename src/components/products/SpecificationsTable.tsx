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

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([k, v], idx) => (
            <tr key={k} className={idx % 2 === 0 ? "bg-surface" : "bg-card"}>
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
    </div>
  );
}
