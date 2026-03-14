import { useThemeStore } from "../../store/themeStore";

export default function ThemeToggle() {
  const { mode, toggle } = useThemeStore();
  const isDark = mode === "dark";

  return (
    <button
      onClick={toggle}
      className="relative w-[40px] h-[22px] rounded-full transition-colors duration-300 cursor-pointer"
      style={{
        backgroundColor: isDark ? "rgba(74, 158, 255, 0.2)" : "rgba(255, 184, 0, 0.2)",
      }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span
        className="absolute top-[3px] w-[16px] h-[16px] rounded-full transition-all duration-300"
        style={{
          left: isDark ? "3px" : "21px",
          backgroundColor: isDark ? "#4A9EFF" : "#FFB800",
          boxShadow: isDark
            ? "0 0 8px rgba(74, 158, 255, 0.6)"
            : "0 0 8px rgba(255, 184, 0, 0.6)",
        }}
      />
    </button>
  );
}
