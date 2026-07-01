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
    <AppProviders>
      <AppShell>
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
      </AppShell>
    </AppProviders>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <AppProviders>
      <AppShell>
        <div className="container-app py-24">
          <ErrorState
            title="This page didn't load"
            description="Something went wrong on our end. You can try refreshing or head back home."
            onRetry={() => {
              router.invalidate();
              reset();
            }}
          />
        </div>
      </AppShell>
    </AppProviders>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#dc2626" },
      { title: `${APP.name} — ${APP.tagline}` },
      { name: "description", content: APP.tagline },
      { name: "author", content: APP.name },
      { property: "og:title", content: APP.name },
      { property: "og:description", content: APP.tagline },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP.name },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
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
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800&display=swap",
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
