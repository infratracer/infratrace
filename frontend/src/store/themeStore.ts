import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  mode: "dark" | "light";
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      toggle: () =>
        set((s) => ({ mode: s.mode === "dark" ? "light" : "dark" })),
    }),
    { name: "infratrace-theme" }
  )
);
