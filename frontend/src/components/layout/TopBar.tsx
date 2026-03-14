import { Menu, Bell } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-glass-border"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: "var(--bg-sidebar)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1 rounded-lg hover:bg-glass-border transition-colors cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
        >
          <Menu size={20} />
        </button>
        <h1
          className="text-[17px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button
          className="relative p-1.5 rounded-lg hover:bg-glass-border transition-colors cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
