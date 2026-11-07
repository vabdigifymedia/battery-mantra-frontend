import React, { useState, useEffect, useRef, useMemo, type ImgHTMLAttributes } from "react";
import { FALLBACK_IMAGE, normalizeImageUrl } from "@/lib/image/cdn";
import { cn } from "@/lib/utils";

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onError" | "onLoad"> {
  fallback?: string;
  aspect?: "square" | "video" | "auto" | "4/3";
  rounded?: boolean;
  priority?: boolean;
  containerClassName?: string;
  imgClassName?: string;
}

const aspectMap = {
  square: "aspect-square",
  video: "aspect-video",
  "4/3": "aspect-[4/3]",
  auto: "",
} as const;

export function Image({
  src,
  alt = "",
  className,
  containerClassName,
  imgClassName,
  fallback = FALLBACK_IMAGE,
  aspect = "auto",
  rounded = true,
  loading = "lazy",
  decoding = "async",
  priority = false,
  ...rest
}: ImageProps) {
  const normalizedSrc = useMemo(() => normalizeImageUrl(src), [src]);

  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // CRITICAL FIX: Check if image is already completed by the browser (cache/SSR hydration)
  useEffect(() => {
    if (!normalizedSrc) {
      setLoaded(false);
      setErrored(true);
      return;
    }

    const img = imgRef.current;
    if (img) {
      if (img.complete) {
        if (img.naturalWidth > 0) {
          setLoaded(true);
          setErrored(false);
          return;
        } else if (img.naturalWidth === 0 && img.src) {
          setLoaded(false);
          setErrored(true);
          return;
        }
      }
    }

    // Reset when src changes
    setLoaded(false);
    setErrored(false);
  }, [normalizedSrc]);

  // If errored or missing URL, show fallback
  const isFallback = errored || !normalizedSrc;
  const activeSrc = isFallback ? fallback : normalizedSrc;

  // Separate container styling classes from image-specific classes
  const { containerClasses, imgClasses } = useMemo(() => {
    if (!className) return { containerClasses: "", imgClasses: "" };
    const tokens = className.split(/\s+/).filter(Boolean);
    const imgTokens: string[] = [];
    const containerTokens: string[] = [];

    tokens.forEach((t) => {
      if (
        t.startsWith("object-") ||
        t.startsWith("mix-blend-") ||
        t.startsWith("grayscale") ||
        t.startsWith("filter") ||
        t.startsWith("scale-") ||
        t.startsWith("group-hover:scale-") ||
        t.startsWith("hover:scale-") ||
        t.startsWith("contrast-") ||
        t.startsWith("brightness-") ||
        t.startsWith("invert")
      ) {
        imgTokens.push(t);
      } else {
        containerTokens.push(t);
      }
    });

    return {
      containerClasses: containerTokens.join(" "),
      imgClasses: imgTokens.join(" "),
    };
  }, [className]);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-50/70 dark:bg-muted/30 flex items-center justify-center",
        rounded && "rounded-xl",
        aspectMap[aspect],
        containerClasses,
        containerClassName
      )}
    >
      {/* Shimmer overlay only while genuinely loading a valid image */}
      {!loaded && !isFallback && !priority && (
        <div className="shimmer absolute inset-0 pointer-events-none z-0" />
      )}

      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        loading={priority ? "eager" : loading}
        decoding={decoding}
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth > 0) {
            setLoaded(true);
            setErrored(false);
          } else {
            setErrored(true);
          }
        }}
        onError={() => {
          setLoaded(false);
          setErrored(true);
        }}
        className={cn(
          "w-full h-full object-contain transition-all duration-300 relative z-10",
          // Dark mode safety: Ensure dark:mix-blend-normal is applied so multiply doesn't black out images in dark mode
          "dark:mix-blend-normal",
          // Visibility fix: If loaded, fallback, or priority, show full opacity immediately
          loaded || isFallback || priority ? "opacity-100" : "opacity-0",
          imgClasses,
          imgClassName
        )}
        {...rest}
      />
    </div>
  );
}
