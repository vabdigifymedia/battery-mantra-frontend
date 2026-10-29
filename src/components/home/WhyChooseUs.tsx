"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Truck, BadgeIndianRupee, Recycle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Genuine Warranty",
    desc: "Every battery ships with the manufacturer's full warranty cover.",
  },
  {
    icon: Truck,
    title: "Free Installation",
    desc: "Doorstep delivery and free fitment by certified engineers.",
  },
  {
    icon: BadgeIndianRupee,
    title: "Best Price Promise",
    desc: "Transparent pricing with exchange benefits on old batteries.",
  },
  {
    icon: Recycle,
    title: "Eco Recycling",
    desc: "Safe, regulated disposal of your old battery — every time.",
  },
];

export function WhyChooseUs() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ITEMS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Premium Animated View */}
      <div className="block sm:hidden relative h-[240px] w-full max-w-[340px] mx-auto px-1">
        <AnimatePresence mode="popLayout">
          {(() => {
            const ActiveIcon = ITEMS[activeIndex].icon;
            return (
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 px-2"
              >
                <div className="flex flex-col items-center justify-center h-[200px] rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] text-center ring-1 ring-white/50 dark:ring-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ActiveIcon className="w-24 h-24" />
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary mb-3 shadow-inner relative z-10">
                    <ActiveIcon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display text-xl font-bold text-foreground relative z-10 leading-tight">
                    {ITEMS[activeIndex].title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-[260px] relative z-10 leading-relaxed">
                    {ITEMS[activeIndex].desc}
                  </p>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-center items-center gap-2">
          {ITEMS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 ease-out",
                activeIndex === idx ? "w-6 bg-primary" : "w-1.5 bg-primary/20 hover:bg-primary/40"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card p-5 shadow-product transition-transform hover:-translate-y-1 hover:shadow-lg duration-300"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
