import { cn } from "@/lib/utils";

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("shimmer h-4 w-full rounded-md", className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("shimmer w-full rounded-xl", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-product">
      <SkeletonBlock className="aspect-square" />
      <div className="mt-4 space-y-2">
        <SkeletonLine className="w-3/4" />
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-1/3" />
      </div>
    </div>
  );
}
