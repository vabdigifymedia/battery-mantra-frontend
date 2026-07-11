import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer, type FooterGroup } from "./Footer";

const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: "Shop",
    links: [
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
      { label: "Home", to: "/" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer groups={FOOTER_GROUPS} />
    </div>
  );
}
