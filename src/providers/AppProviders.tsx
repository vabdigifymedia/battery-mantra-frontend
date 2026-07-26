import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { WishlistProvider } from "./WishlistProvider";

/**
 * Composes app-wide providers. QueryClientProvider is mounted in __root.tsx
 * because the QueryClient comes from the router context.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <WishlistProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="light"
            toastOptions={{ className: "font-sans" }}
          />
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
