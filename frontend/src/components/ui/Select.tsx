import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
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
        <select
          ref={ref}
          className={`w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors ${
            error ? "border-neon-red" : "border-glass-border focus:border-accent"
          } ${className}`}
          style={{
            backgroundColor: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
          {...props}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-neon-red text-[11px]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
