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

/** Load the Instagram embed.js script once, then re-process whenever new embeds appear. */
function useInstagramEmbed(deps: unknown[]) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // If script is already loaded, just re-process embeds
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }

    // Only inject the script tag once
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => window.instgrm?.Embeds.process();
    document.body.appendChild(script);

    return () => {
      // Don't remove the script on unmount — it's a global singleton
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function InstagramReelsWidget() {
  const { data: reels, isLoading } = useQuery(activeReelsQuery());

  // Re-process Instagram embeds whenever `reels` changes
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
          className="w-full rounded-2xl overflow-hidden border shadow-sm bg-card [&_iframe]:!min-width-0"
        >
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={reel.url.replace(/\/$/, '') + '/'}
            data-instgrm-version="14"
            style={{
              margin: 0,
              maxWidth: '100%',
              width: '100%',
              padding: 0,
              border: 'none',
              background: 'transparent',
            }}
          />
        </div>
      ))}
    </div>
  );
}

