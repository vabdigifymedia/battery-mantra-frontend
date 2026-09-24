import { Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { activeReelsQuery } from "@/queries";
import { useEffect, useRef } from "react";
import type { ReelResponse } from "@/types/dto";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

function useInstagramEmbed(deps: unknown[]) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }

    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => window.instgrm?.Embeds.process();
    document.body.appendChild(script);

    return () => { };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const getCleanUrl = (rawUrl: string) => {
  try {
    const urlObj = new URL(rawUrl);
    return `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '');
  } catch {
    return rawUrl;
  }
};

export function InstagramReelsWidget() {
  const { data: reels, isLoading } = useQuery(activeReelsQuery());

  useInstagramEmbed([reels]);

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-4 lg:gap-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 lg:mx-0 lg:px-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[75vw] sm:w-[45vw] lg:w-full shrink-0 snap-center aspect-[9/16] rounded-[2rem] bg-slate-100 dark:bg-slate-800 animate-pulse border-4 border-white dark:border-slate-800 shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (!reels || reels.length === 0) return null;

  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-4 lg:gap-6 pb-8 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 lg:mx-0 lg:px-0">
      {reels.map((reel: ReelResponse) => (
        <div
          key={reel.reelId}
          className="relative w-[75vw] sm:w-[45vw] lg:w-full shrink-0 snap-center aspect-[229/400] rounded-[2rem] overflow-hidden bg-black border-4 border-white dark:border-slate-800 shadow-md group hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(220,39,67,0.3)] transition-all duration-300 [&_iframe]:!w-full [&_iframe]:!min-w-0 [&_iframe]:!max-w-none [&_iframe]:!m-0 [&_iframe]:!p-0 [&_iframe]:!border-0"
        >
          {/* Inner ring overlay to simulate phone bevel */}
          <div className="absolute inset-0 z-30 rounded-[2rem] ring-1 ring-inset ring-white/10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0"></div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-0">
            <Instagram className="h-10 w-10 mb-2 opacity-30 text-white animate-pulse" />
            <span className="text-sm font-medium text-white/50">Loading Reel...</span>
          </div>

          <div className="absolute z-10 w-[calc(100%*326/229)] left-[calc(-100%*49/229)] -top-[56px] transition-transform duration-500 ease-out group-hover:scale-[1.02]">
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={getCleanUrl(reel.url) + '/'}
              data-instgrm-version="14"
              style={{
                background: '#000',
                border: '0',
                margin: '0',
                padding: '0',
                width: '100%',
              }}
            />
          </div>

          {/* Transparent overlay to prevent clicking on Instagram's external links if they peek through */}
          <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] group-hover:shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] transition-shadow duration-300"></div>
        </div>
      ))}
    </div>
  );
}

