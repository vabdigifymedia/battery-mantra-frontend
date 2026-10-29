import { create } from "zustand";

interface ModalState {
  isLocationModalOpen: boolean;
  isLoginModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isLocationModalOpen: false,
  isLoginModalOpen: false,
  openLocationModal: () => set({ isLocationModalOpen: true, isLoginModalOpen: false }),
  closeLocationModal: () => set({ isLocationModalOpen: false }),
  openLoginModal: () => set({ isLoginModalOpen: true, isLocationModalOpen: false }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
}));
