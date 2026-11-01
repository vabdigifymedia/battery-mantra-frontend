import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignCountdownProps {
  endDate: string;
  variant?: "compact" | "badge" | "banner" | "hero";
  className?: string;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(endDateStr: string): TimeLeft {
  const difference = new Date(endDateStr).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false,
  };
}

export function CampaignCountdown({
  endDate,
  variant = "banner",
  className,
  onExpire,
}: CampaignCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft(endDate);
      setTimeLeft(updated);
      if (updated.isExpired) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <span className="text-xs font-semibold text-rose-300 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Offer Expired
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-1 text-xs font-mono font-semibold tracking-wider", className)}>
        <Clock className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {pad(timeLeft.hours)}h:{pad(timeLeft.minutes)}m:{pad(timeLeft.seconds)}s
        </span>
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-medium", className)}>
        <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
        <span className="font-mono font-bold tracking-wide">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  // Hero / Banner mode (large boxes with labels)
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      <div className="flex flex-col items-center justify-center min-w-[48px] sm:min-w-[56px] py-1.5 sm:py-2 px-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/15 shadow-inner">
        <span className="font-mono text-base sm:text-xl font-extrabold text-white leading-none">
          {pad(timeLeft.days)}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-white/70 tracking-wider mt-1">
          Days
        </span>
      </div>
      <span className="text-white/60 font-bold text-lg sm:text-xl">:</span>

      <div className="flex flex-col items-center justify-center min-w-[48px] sm:min-w-[56px] py-1.5 sm:py-2 px-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/15 shadow-inner">
        <span className="font-mono text-base sm:text-xl font-extrabold text-white leading-none">
          {pad(timeLeft.hours)}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-white/70 tracking-wider mt-1">
          Hours
        </span>
      </div>
      <span className="text-white/60 font-bold text-lg sm:text-xl">:</span>

      <div className="flex flex-col items-center justify-center min-w-[48px] sm:min-w-[56px] py-1.5 sm:py-2 px-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/15 shadow-inner">
        <span className="font-mono text-base sm:text-xl font-extrabold text-white leading-none">
          {pad(timeLeft.minutes)}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-white/70 tracking-wider mt-1">
          Mins
        </span>
      </div>
      <span className="text-white/60 font-bold text-lg sm:text-xl">:</span>

      <div className="flex flex-col items-center justify-center min-w-[48px] sm:min-w-[56px] py-1.5 sm:py-2 px-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/15 shadow-inner">
        <span className="font-mono text-base sm:text-xl font-extrabold text-amber-300 leading-none">
          {pad(timeLeft.seconds)}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-300/80 tracking-wider mt-1">
          Secs
        </span>
      </div>
    </div>
  );
}
