import { useRef, useEffect } from "react";
import { toast } from "sonner";
import type { OrderResponse } from "@/types/dto";

/**
 * Detects genuinely new orders in the provided array and plays a subtle
 * 2-tone chime + shows a Sonner toast for each one.
 *
 * On the **first** render the hook silently seeds its known-set so that
 * existing orders never trigger a notification.
 */
export function useNewOrderAlert(orders: OrderResponse[]) {
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  const hasNewOrders = useRef(false);

  useEffect(() => {
    if (!orders.length) return;

    const currentIds = new Set(orders.map((o) => o.orderId));

    if (isInitialLoad.current) {
      // First load — just record existing orders, don't alert
      knownOrderIds.current = currentIds;
      isInitialLoad.current = false;
      return;
    }

    // Find genuinely new orders (not in our known set) that are actionable
    const newOrders = orders.filter(
      (o) =>
        !knownOrderIds.current.has(o.orderId) &&
        (o.orderStatus === "PENDING" || o.orderStatus === "CONFIRMED"),
    );

    if (newOrders.length > 0) {
      hasNewOrders.current = true;
      playNewOrderChime();

      newOrders.forEach((order) => {
        toast.info("⚡ New Order Assigned!", {
          description: `Order #${order.orderId.split("-")[0]} — ${order.customerName || "Customer"} — ₹${order.totalAmount.toLocaleString()}`,
          duration: 8000,
        });
      });
    }

    // Update known set
    knownOrderIds.current = currentIds;
  }, [orders]);

  return { hasNewOrders: hasNewOrders.current };
}

// ---------------------------------------------------------------------------
// Audio — subtle 2-tone chime via Web Audio API (no external files needed)
// ---------------------------------------------------------------------------
function playNewOrderChime() {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // First tone — D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second tone — A5 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.15, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.4);
  } catch {
    // Audio not available (e.g. autoplay policy), silently ignore
  }
}
