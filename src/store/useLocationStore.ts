import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { CityDto } from "@/types/dto";
import { cookies } from "@/lib/storage/cookies";

const cookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return cookies.get(name) || null;
  },
  setItem: (name: string, value: string): void => {
    cookies.set(name, value, { days: 365, secure: true, sameSite: "Lax", path: "/" });
  },
  removeItem: (name: string): void => {
    cookies.remove(name);
  },
};

interface LocationState {
  pincode: string | null;
  city: CityDto | null;
  isServiceable: boolean;
  locationPermissionGranted: boolean | null;
  hasHydrated: boolean;
  
  setLocation: (pincode: string, isServiceable: boolean, city?: CityDto | null) => void;
  clearLocation: () => void;
  setPermission: (granted: boolean) => void;
  setHasHydrated: (val: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      pincode: null,
      city: null,
      isServiceable: false,
      locationPermissionGranted: null,
      hasHydrated: false,
      
      setLocation: (pincode, isServiceable, city = null) => 
        set({ pincode, isServiceable, city }),
        
      clearLocation: () => 
        set({ pincode: null, city: null, isServiceable: false }),
        
      setPermission: (granted) =>
        set({ locationPermissionGranted: granted }),

      setHasHydrated: (hasHydrated) =>
        set({ hasHydrated }),
    }),
    {
      name: "battery-mantra-location",
      storage: createJSONStorage(() => cookieStorage),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useLocationStore.setState({ hasHydrated: true });
      },
    }
  )
);

if (typeof window !== "undefined") {
  // Delay hydration until after the first render to match SSR
  setTimeout(() => {
    useLocationStore.persist.rehydrate();
    useLocationStore.setState({ hasHydrated: true });
  }, 0);
}
