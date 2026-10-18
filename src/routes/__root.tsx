import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

import { AppProviders } from "@/providers/AppProviders";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { APP } from "@/constants/app";

const THEME_INIT_SCRIPT = `
(function(){try{var t=localStorage.getItem('bm.theme')||'light';var m=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;var r=document.documentElement;r.classList.toggle('dark',m==='dark');r.style.colorScheme=m;}catch(e){}})();
`.trim();

function NotFoundComponent() {
  return (
    <div className="container-app py-24">
      <EmptyState
        title="404 — Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <Button asChild variant="brand">
            <Link to="/">Go home</Link>
          </Button>
        }
      />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    if (error?.message?.includes("Failed to fetch dynamically imported module") || error?.message?.includes("Importing a module script failed")) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="container-app py-24">
      <ErrorState
        title="This page didn't load"
        description="Something went wrong on our end. You can try refreshing or head back home."
        onRetry={() => {
          if (error?.message?.includes("Failed to fetch dynamically imported module") || error?.message?.includes("Importing a module script failed")) {
            window.location.reload();
          } else {
            router.invalidate();
            reset();
          }
        }}
      />
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#dc2626", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#991b1b", media: "(prefers-color-scheme: dark)" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: `${APP.name} — ${APP.tagline}` },
      { name: "description", content: APP.tagline },
      { name: "author", content: APP.name },
      { property: "og:title", content: APP.name },
      { property: "og:description", content: APP.tagline },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP.name },
      { property: "og:image", content: "https://batterymantra.com/logo.png" },
      { property: "og:image:secure_url", content: "https://batterymantra.com/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@batterymantra" },
      { name: "twitter:image", content: "https://batterymantra.com/logo.png" },
    ],
    links: [
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800&family=Dancing+Script:wght@400..700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-BBDZD3KEND" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-BBDZD3KEND');
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Track SPA route changes in Google Analytics (client-only)
  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("config", "G-BBDZD3KEND", {
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
      });
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <AppShell>
          {/* Required: nested routes render here. */}
          <Outlet />
        </AppShell>
      </AppProviders>
    </QueryClientProvider>
  );
}
