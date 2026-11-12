import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer, type FooterGroup } from "./Footer";
import { FeatureStrip } from "./FeatureStrip";
import { MobileBottomNav } from "./MobileBottomNav";
import { EmergencyFAB } from "./EmergencyFAB";
import { AutoEngagementManager } from "@/components/engagement/AutoEngagementManager";
import { CampaignAnnouncementBar } from "@/components/campaign/CampaignAnnouncementBar";

const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: "Shop",
    links: [
      { label: "All Categories", to: "/categories" },
      { label: "All Batteries", to: "/products" },
      { label: "Vehicle Finder", to: "/vehicle-finder" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", to: "/login" },
      { label: "Create account", to: "/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about-us" },
      { label: "Blog & Guides", to: "/blog" },
      { label: "Reels & Guides", to: "/reels" },
      { label: "Contact Us", to: "/contact-us" },
      { label: "Home", to: "/" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Shipping & Return", to: "/shipping-return" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms-conditions" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isDashboardPage = pathname.startsWith("/kalkaji") || pathname.startsWith("/account");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  const isStandalonePage = pathname.startsWith("/staff-privacy-policy");
  const isPdpPage = pathname.startsWith("/product/");
  const isCheckoutPage = pathname.startsWith("/checkout");

  if (isDashboardPage || isAuthPage || isStandalonePage) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main id="main" className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <CampaignAnnouncementBar className={isPdpPage ? "hidden sm:flex" : undefined} />
      <Navbar className={isPdpPage ? "hidden sm:block" : undefined} />
      <main id="main" className="flex-1 flex flex-col pb-16 sm:pb-0">
        {children}
      </main>
      <FeatureStrip />
      <Footer groups={FOOTER_GROUPS} />
      {!isPdpPage && !isCheckoutPage && <MobileBottomNav />}
      <EmergencyFAB />
      <AutoEngagementManager />
    </div>
  );
}
