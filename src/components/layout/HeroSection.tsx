import type { ReactNode } from "react";
import { Container } from "./Container";
import { cn } from "@/lib/utils";

export function HeroSection({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  media,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  media?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-surface", className)}>
      <Container size="xl" className="grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-3 inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">{description}</p>
          ) : null}
          {(primaryAction || secondaryAction) && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {primaryAction}
              {secondaryAction}
            </div>
          )}
        </div>
        {media ? <div className="min-w-0">{media}</div> : null}
      </Container>
    </section>
  );
}
