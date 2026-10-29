import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { useLocationStore } from "@/store/useLocationStore";
import { useAuth } from "@/providers/AuthProvider";
import { useModalStore } from "@/store/useModalStore";
import { LocationModal } from "@/components/location/LocationModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { isBrowser } from "@/lib/utils/env";

// Timings calibrated for high engagement without spamming
const INITIAL_LOCATION_DELAY_MS = 6 * 1000; // 6 seconds for first look
const LOCATION_RECHECK_INTERVAL_MS = 3.5 * 60 * 1000; // 3.5 minutes if dismissed

const INITIAL_LOGIN_DELAY_MS = 45 * 1000; // 45 seconds for active visitor
const LOGIN_RECHECK_INTERVAL_MS = 6 * 60 * 1000; // 6 minutes if dismissed

const EXCLUDED_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/checkout",
  "/account",
  "/kalkaji",
];

const STORAGE_KEYS = {
  LAST_LOC_PROMPT: "bm_last_loc_prompt",
  LAST_LOGIN_PROMPT: "bm_last_login_prompt",
};

export function AutoEngagementManager() {
  const { pathname } = useLocation();
  const { pincode, city, hasHydrated } = useLocationStore();
  const { status } = useAuth();
  const {
    isLocationModalOpen,
    isLoginModalOpen,
    openLocationModal,
    openLoginModal,
  } = useModalStore();

  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const hasLocation = Boolean(pincode || (city && city.cityName));
  const isUnauthenticated = status === "unauthenticated";

  // Ref to track mount time
  const sessionStartTime = useRef<number>(Date.now());

  // 1. Auto-Prompt Location Selection
  useEffect(() => {
    if (!isBrowser || !hasHydrated || isExcluded || hasLocation) return;
    if (isLocationModalOpen || isLoginModalOpen) return;

    const checkLocationPrompt = () => {
      const now = Date.now();
      const lastPromptStr = sessionStorage.getItem(STORAGE_KEYS.LAST_LOC_PROMPT);
      const lastPrompt = lastPromptStr ? parseInt(lastPromptStr, 10) : null;

      if (!lastPrompt) {
        // First time on site: trigger after initial delay
        const timeSinceLand = now - sessionStartTime.current;
        if (timeSinceLand >= INITIAL_LOCATION_DELAY_MS) {
          sessionStorage.setItem(STORAGE_KEYS.LAST_LOC_PROMPT, String(now));
          openLocationModal();
        }
      } else {
        // Subsequent periodic check
        if (now - lastPrompt >= LOCATION_RECHECK_INTERVAL_MS) {
          sessionStorage.setItem(STORAGE_KEYS.LAST_LOC_PROMPT, String(now));
          openLocationModal();
        }
      }
    };

    // Run quick initial check and poll on interval
    const timeout = setTimeout(checkLocationPrompt, INITIAL_LOCATION_DELAY_MS);
    const interval = setInterval(checkLocationPrompt, 15 * 1000); // Check every 15s

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [hasHydrated, isExcluded, hasLocation, isLocationModalOpen, isLoginModalOpen, openLocationModal]);

  // 2. Auto-Prompt Login (Only if Location is either set or not currently prompting)
  useEffect(() => {
    if (!isBrowser || isExcluded || !isUnauthenticated) return;
    if (isLocationModalOpen || isLoginModalOpen) return;

    const checkLoginPrompt = () => {
      // Don't interrupt if location modal is currently open
      if (useModalStore.getState().isLocationModalOpen) return;

      const now = Date.now();
      const lastPromptStr = sessionStorage.getItem(STORAGE_KEYS.LAST_LOGIN_PROMPT);
      const lastPrompt = lastPromptStr ? parseInt(lastPromptStr, 10) : null;

      if (!lastPrompt) {
        const timeSinceLand = now - sessionStartTime.current;
        if (timeSinceLand >= INITIAL_LOGIN_DELAY_MS) {
          sessionStorage.setItem(STORAGE_KEYS.LAST_LOGIN_PROMPT, String(now));
          openLoginModal();
        }
      } else {
        if (now - lastPrompt >= LOGIN_RECHECK_INTERVAL_MS) {
          sessionStorage.setItem(STORAGE_KEYS.LAST_LOGIN_PROMPT, String(now));
          openLoginModal();
        }
      }
    };

    const timeout = setTimeout(checkLoginPrompt, INITIAL_LOGIN_DELAY_MS);
    const interval = setInterval(checkLoginPrompt, 20 * 1000); // Check every 20s

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isExcluded, isUnauthenticated, isLocationModalOpen, isLoginModalOpen, openLoginModal]);

  return (
    <>
      <LocationModal />
      <LoginModal />
    </>
  );
}
