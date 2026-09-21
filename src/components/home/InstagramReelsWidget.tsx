import { Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { activeReelsQuery } from "@/queries";
import type { ReelResponse } from "@/types/dto";

const getEmbedUrl = (rawUrl: string) => {
  try {
    const urlObj = new URL(rawUrl);
    // Remove query parameters like ?igsh=... which break the /embed/ endpoint
    const cleanUrl = `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '');
    return `${cleanUrl}/embed/`;
  } catch {
    return rawUrl;
  }
};

export function InstagramReelsWidget() {
  const { data: reels, isLoading } = useQuery(activeReelsQuery());

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
          // Use overflow-hidden to crop the iframe's header and footer
          className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black border shadow-sm group"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-0">
            <Instagram className="h-8 w-8 mb-2 opacity-20 text-white" />
            <span className="text-sm font-medium text-white/50">Loading Reel...</span>
          </div>
          <iframe
            src={getEmbedUrl(reel.url)}
            // Scale and translate the iframe to hide Instagram's top header and bottom footer
            className="absolute z-10 w-[calc(100%+4px)] h-[calc(100%+140px)] -top-[65px] -left-[2px] border-0"
            scrolling="no"
            allowTransparency={true}
            allow="encrypted-media"
            title={`Instagram Reel`}
          ></iframe>
          
          {/* Transparent overlay to prevent clicking on Instagram's external links if they peek through the edges, while still allowing play/pause in the center */}
          <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"></div>
        </div>
      ))}
    </div>
  );
}

