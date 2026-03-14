interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  glow?: "green" | "red" | "amber" | "accent";
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const glowMap = {
  green: "neon-glow-green",
  red: "neon-glow-red",
  amber: "neon-glow-amber",
  accent: "neon-glow-accent",
};

export default function GlassCard({
  children,
  className = "",
  hover = false,
  onClick,
  glow,
  padding = "md",
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${paddingMap[padding]} ${
        hover ? "hover:-translate-y-[1px] cursor-pointer" : ""
      } ${glow ? glowMap[glow] : ""} ${className}`}
    >
      {children}
    </div>
  );
}
