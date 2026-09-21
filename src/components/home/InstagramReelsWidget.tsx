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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-full aspect-[9/16] rounded-2xl bg-muted animate-pulse border shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (!reels || reels.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {reels.map((reel: ReelResponse) => (
        <div
          key={reel.reelId}
          className="relative w-full aspect-[229/400] rounded-2xl overflow-hidden bg-black border shadow-sm group [&_iframe]:!w-full [&_iframe]:!min-w-0 [&_iframe]:!max-w-none [&_iframe]:!m-0 [&_iframe]:!p-0 [&_iframe]:!border-0"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-0">
            <Instagram className="h-8 w-8 mb-2 opacity-20 text-white" />
            <span className="text-sm font-medium text-white/50">Loading Reel...</span>
          </div>


          <div className="absolute z-10 w-[calc(100%*326/229)] left-[calc(-100%*49/229)] -top-[56px]">
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

          {/* 3. Transparent overlay to prevent clicking on Instagram's external links if they peek through */}
          <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"></div>
        </div>
      ))}
    </div>
  );
}

