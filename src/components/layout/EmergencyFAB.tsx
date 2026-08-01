import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmergencyFAB() {
  return (
    <Button
      size="icon"
      className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] active:scale-95 transition-all duration-300 sm:bottom-8 sm:right-8 bg-brand hover:bg-brand-hover text-white flex flex-col items-center justify-center gap-0.5 animate-in slide-in-from-bottom-10 fade-in"
      onClick={() => window.open("tel:7678244168", "_self")}
      aria-label="Call Emergency Support"
    >
      <PhoneCall className="h-6 w-6 animate-pulse" />
    </Button>
  );
}
