import { useThemeStore } from "../store/themeStore";
import { themes, type Theme } from "../config/theme";

export function useTheme(): Theme & { mode: "dark" | "light" } {
  const mode = useThemeStore((s) => s.mode);
  return { ...themes[mode], mode };
}
