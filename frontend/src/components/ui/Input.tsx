import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            className="block text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors ${
            error ? "border-neon-red" : "border-glass-border focus:border-accent"
          } ${className}`}
          style={{
            backgroundColor: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
          {...props}
        />
        {error && <p className="text-neon-red text-[11px]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
