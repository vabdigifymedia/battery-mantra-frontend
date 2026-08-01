import { PhoneCall } from "lucide-react";

export function EmergencyFAB() {
  return (
    <a
      href="tel:9200920051"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:opacity-90 active:scale-95 transition-all duration-300 sm:bottom-8 sm:right-8"
      aria-label="Call Emergency Support 9200920051"
      title="Call Support: 9200920051"
    >
      <PhoneCall className="h-6 w-6 animate-pulse text-primary-foreground" />
    </a>
  );
}
