import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { activeReelsQuery } from "@/queries";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { 
  Instagram, 
  ArrowRight, 
  BadgeCheck, 
  Copy, 
  ExternalLink,
  Zap,
  Clock,
  Wrench,
  Check
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import type { ReelResponse } from "@/types/dto";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reels")({
  loader: ({ context }) => context.queryClient.ensureQueryData(activeReelsQuery()),
  head: () => ({
    meta: [
      { title: "Watch Battery Tips, Guides & Customer Stories | BatteryMantra Reels" },
      { name: "description", content: "Explore the latest car battery care tips, installation highlights, inverter buying guides, and real customer stories from BatteryMantra." },
    ],
  }),
  component: ReelsPage,
});

// Instagram Global typings
declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const getCleanUrl = (rawUrl: string) => {
  try {
    const urlObj = new URL(rawUrl);
    return `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '');
  } catch {
    return rawUrl;
  }
};

// Reusable hook to load Instagram embed script
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

function ReelCard({ reel, index, priority = false }: { reel: ReelResponse; index: number; priority?: boolean }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: priority ? "400px" : "200px",
  });
  const [copied, setCopied] = useState(false);

  const cleanUrl = getCleanUrl(reel.url);

  // Trigger IG script only when in view
  useInstagramEmbed(inView ? [cleanUrl] : []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cleanUrl);
    setCopied(true);
    toast.success("Reel link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      ref={ref}
      className="relative w-full aspect-[229/400] rounded-[2rem] overflow-hidden bg-slate-900 shadow-md group hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(220,39,67,0.3)] transition-all duration-300 isolate"
    >
      {/* Inner ring overlay to simulate phone bevel */}
      <div className="absolute inset-0 z-40 rounded-[2rem] ring-1 ring-inset ring-white/10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0" />
      
      {/* Fallback / Loading state */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-0 bg-slate-900">
        <Instagram className="h-10 w-10 mb-3 opacity-30 text-white animate-pulse" />
        <span className="text-sm font-medium text-white/50">Loading Reel...</span>
      </div>

      {/* Floating Action Bar (Top) */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/60 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-white/10">
          <Instagram className="w-3.5 h-3.5" />
          #{String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopyLink}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
            title="Copy Link"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <a 
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
            title="Open in Instagram"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Instagram Embed Wrapper */}
      {inView && (
        <div className="absolute z-10 w-[calc(100%*326/229)] left-[calc(-100%*49/229)] -top-[56px] transition-transform duration-500 ease-out group-hover:scale-[1.02] [&_iframe]:!w-full [&_iframe]:!min-w-0 [&_iframe]:!max-w-none [&_iframe]:!m-0 [&_iframe]:!p-0 [&_iframe]:!border-0">
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={cleanUrl + '/'}
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
      )}

      {/* Transparent overlay to prevent accidental clicking on IG frame links while browsing */}
      <div className="absolute inset-0 z-30 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] group-hover:shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] transition-shadow duration-300" />
    </div>
  );
}

function ReelsPage() {
  const { data: reels, isLoading } = useQuery(activeReelsQuery());

  const featuredReel = reels && reels.length > 0 ? reels[0] : null;
  const gridReels = reels && reels.length > 1 ? reels.slice(1) : [];

  return (
    <main className="min-h-screen bg-slate-50 pt-20 pb-20">
      
      {/* Hero Spotlight Section */}
      <section className="bg-white border-b overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/40 via-red-50/20 to-transparent dark:from-slate-800 dark:via-slate-900/50" />
        
        <Container className="relative py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6">
                <Instagram className="h-4 w-4 text-[#dc2743]" />
                <span className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">@batterymantra</span>
                <BadgeCheck className="h-4 w-4 text-blue-500" />
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
                Watch, Learn & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Power Up</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Explore our collection of quick battery care tips, doorstep installation highlights, inverter buying guides, and real customer stories.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <a 
                  href="https://instagram.com/batterymantra" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-white rounded-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:shadow-[0_8px_24px_rgba(220,39,67,0.35)] hover:-translate-y-1 transition-all duration-300"
                >
                  <Instagram className="mr-2 h-5 w-5" /> Follow Us
                </a>
                <Button size="lg" variant="outline" className="rounded-full px-6 py-3.5 h-auto text-base font-bold border-slate-300 hover:bg-slate-100">
                  Shop Batteries
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">100% Genuine<br/>Products</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">60-Minute<br/>Delivery</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Free Doorstep<br/>Installation</div>
                </div>
              </div>
            </div>

            {/* Right Content - Featured Reel Spotlight */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[340px] perspective-1000">
                {/* Decorative background glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-20 blur-3xl rounded-full" />
                
                {isLoading ? (
                  <div className="w-full aspect-[229/400] rounded-[2.5rem] bg-slate-200 animate-pulse border-[6px] border-white shadow-2xl" />
                ) : featuredReel ? (
                  <div className="relative transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-500">
                    <div className="absolute -top-4 -right-4 z-50 animate-bounce">
                      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white flex items-center gap-1.5 uppercase tracking-wider">
                        <Zap className="h-3.5 w-3.5 fill-white" /> Featured Drop
                      </div>
                    </div>
                    {/* Thicker border for spotlight */}
                    <div className="p-1.5 rounded-[2.5rem] bg-gradient-to-b from-slate-100 to-slate-200 shadow-2xl">
                      <ReelCard reel={featuredReel} index={0} priority={true} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            
          </div>
        </Container>
      </section>

      {/* Reels Gallery Grid */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">More Reels & Stories</h2>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="w-full aspect-[229/400] rounded-[2rem] bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : gridReels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {gridReels.map((reel, index) => (
                <ReelCard key={reel.reelId} reel={reel} index={index + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <Instagram className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No more reels available</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">We're constantly updating our Instagram with new tips and stories. Follow us to stay updated!</p>
              <a 
                href="https://instagram.com/batterymantra" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white rounded-full bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                Go to Instagram <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          )}
        </Container>
      </section>
      
    </main>
  );
}
