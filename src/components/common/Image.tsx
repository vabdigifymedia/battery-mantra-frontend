import React, { useState, useEffect, type ImgHTMLAttributes } from "react";
import { FALLBACK_IMAGE, normalizeImageUrl } from "@/lib/image/cdn";
import { cn } from "@/lib/utils";

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onError"> {
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
  priority = false,
  ...rest
}: ImageProps) {
  const [errored, setErrored] = useState(false);
  const cleanSrc = normalizeImageUrl(src);

  // Reset error when src changes
  useEffect(() => {
    setErrored(false);
  }, [cleanSrc]);

  const activeSrc = errored || !cleanSrc ? fallback : cleanSrc;

  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center justify-center bg-slate-50/50 dark:bg-muted/10",
        rounded && "rounded-xl",
        aspectMap[aspect],
        className,
        containerClassName
      )}
    >
      <img
        src={activeSrc}
        alt={alt}
        loading={priority ? "eager" : loading}
        decoding="async"
        onError={() => setErrored(true)}
        className={cn(
          "w-full h-full object-contain dark:mix-blend-normal transition-opacity duration-200",
          imgClassName
        )}
        {...rest}
      />
    </div>
  );
}
