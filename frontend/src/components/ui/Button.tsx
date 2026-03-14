import { type ButtonHTMLAttributes } from "react";
import Spinner from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "border border-glass-border hover:bg-glass-border",
  danger: "bg-neon-red text-white hover:opacity-90",
  ghost: "hover:bg-glass-border",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2 text-[13px]",
  lg: "px-6 py-2.5 text-[14px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{ color: variant === "secondary" || variant === "ghost" ? "var(--text-primary)" : undefined }}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}
