export const GA_TRACKING_ID = "G-BBDZD3KEND";

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Sends custom events to Google Analytics
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
  }
}

/**
 * Track route / page changes for SPA navigation
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }
}

/**
 * Track Add to Cart event
 */
export function trackAddToCart(product: {
  productId?: string;
  productName?: string;
  brandName?: string;
  productPrice?: number;
}) {
  trackEvent("add_to_cart", {
    currency: "INR",
    value: product.productPrice,
    items: [
      {
        item_id: product.productId,
        item_name: product.productName,
        item_brand: product.brandName,
        price: product.productPrice,
        quantity: 1,
      },
    ],
  });
}

/**
 * Track Purchase event
 */
export function trackPurchase(order: {
  orderId: string;
  totalAmount: number;
  items?: any[];
}) {
  trackEvent("purchase", {
    transaction_id: order.orderId,
    value: order.totalAmount,
    currency: "INR",
    items: (order.items || []).map((i: any) => ({
      item_id: i.productId || i.id,
      item_name: i.productName || i.name,
      price: i.productPrice || i.price,
      quantity: i.quantity || 1,
    })),
  });
}
