import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

type PriceState = {
  price: number | null;
  setPrice: (price: number | null) => void;
};

export const usePriceStore = create<PriceState>()(
  devtools(
    persist(
      (set, _) => ({
        price: null,
        setPrice: (price) => set({ price }),
      }),
      {
        name: "fundsolvr-price-storage",
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);
