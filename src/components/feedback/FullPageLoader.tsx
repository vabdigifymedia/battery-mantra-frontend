import { Spinner } from "./Spinner";

export function FullPageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4"
    >
      <Spinner size="xl" />
      <span className="text-sm text-muted-foreground">{label}…</span>
    </div>
  );
}
