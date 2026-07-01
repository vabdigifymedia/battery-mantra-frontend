import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";

/**
 * Composes app-wide providers. QueryClientProvider is mounted in __root.tsx
 * because the QueryClient comes from the router context.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="light"
          toastOptions={{ className: "font-sans" }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
