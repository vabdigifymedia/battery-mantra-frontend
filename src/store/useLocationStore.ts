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
  
  setLocation: (pincode: string, isServiceable: boolean, city?: CityDto | null) => void;
  clearLocation: () => void;
  setPermission: (granted: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      pincode: null,
      city: null,
      isServiceable: false,
      locationPermissionGranted: null,
      
      setLocation: (pincode, isServiceable, city = null) => 
        set({ pincode, isServiceable, city }),
        
      clearLocation: () => 
        set({ pincode: null, city: null, isServiceable: false }),
        
      setPermission: (granted) =>
        set({ locationPermissionGranted: granted }),
    }),
    {
      name: "battery-mantra-location",
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);
