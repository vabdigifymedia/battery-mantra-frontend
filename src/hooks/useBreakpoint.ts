import { BREAKPOINTS, type Breakpoint } from "@/constants/breakpoints";
import { useMediaQuery } from "./useMediaQuery";

export function useBreakpoint(bp: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[bp]}px)`);
}

export function useIsMobile(): boolean {
  return !useBreakpoint("md");
}
