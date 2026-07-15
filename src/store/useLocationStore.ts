import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CityDto } from "@/types/dto";

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
    }
  )
);
