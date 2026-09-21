import { Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { activeReelsQuery } from "@/queries";
import type { ReelResponse } from "@/types/dto";

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
          className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-card flex items-center justify-center border shadow-sm group"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-0">
            <Instagram className="h-8 w-8 mb-2 opacity-20" />
            <span className="text-sm font-medium">Loading Reel...</span>
          </div>
          <iframe
            src={`${reel.url.replace(/\/$/, '')}/embed/`}
            className="relative z-10 w-full h-full border-0"
            scrolling="no"
            allowTransparency={true}
            allow="encrypted-media"
            title={`Instagram Reel`}
          ></iframe>
        </div>
      ))}
    </div>
  );
}
