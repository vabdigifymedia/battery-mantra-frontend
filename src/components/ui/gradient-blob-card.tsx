import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientBlobCardProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function GradientBlobCard({ children, className, containerClassName }: GradientBlobCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl flex flex-col items-center justify-center overflow-hidden group shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border border-border/50",
        containerClassName
      )}
    >
      {/* Glassy Background */}
      <div
        className="absolute inset-[1.5px] bg-card/95 backdrop-blur-[24px] rounded-[10px] z-10 transition-colors group-hover:bg-card/90"
      ></div>

      {/* Animated Gradient Blob */}
      <div
        className="absolute top-1/2 left-1/2 w-[180px] h-[180px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        filter blur-[15px] z-0 animate-blob 
                        bg-gradient-to-r from-red-500 via-brand to-orange-500"
      ></div>

      {/* Inline keyframes animation */}
      <style>
        {`
            @keyframes blob {
              0% {
                transform: translate(-100%, -100%);
              }
              25% {
                transform: translate(0%, -100%);
              }
              50% {
                transform: translate(0%, 0%);
              }
              75% {
                transform: translate(-100%, 0%);
              }
              100% {
                transform: translate(-100%, -100%);
              }
            }

            .animate-blob {
              animation: blob 5s linear infinite;
            }
          `}
      </style>

      {/* Content wrapper */}
      <div className={cn("relative z-20 w-full h-full", className)}>
        {children}
      </div>
    </div>
  );
}
