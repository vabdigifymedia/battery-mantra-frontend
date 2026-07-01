import { useState, type ImgHTMLAttributes } from "react";
import { FALLBACK_IMAGE } from "@/lib/image/cdn";
import { cn } from "@/lib/utils";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "onError" | "onLoad"> & {
  fallback?: string;
  aspect?: "square" | "video" | "auto";
  rounded?: boolean;
};

const aspectMap = {
  square: "aspect-square",
  video: "aspect-video",
  auto: "",
} as const;

export function Image({
  src,
  alt = "",
  className,
  fallback = FALLBACK_IMAGE,
  aspect = "auto",
  rounded = true,
  loading = "lazy",
  decoding = "async",
  ...rest
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        rounded && "rounded-xl",
        aspectMap[aspect],
        className,
      )}
    >
      {!loaded && !errored ? <div className="shimmer absolute inset-0" /> : null}
      <img
        src={errored ? fallback : (src as string)}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
        {...rest}
      />
    </div>
  );
}
