import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
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
        <textarea
          ref={ref}
          className={`w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none resize-y min-h-[80px] transition-colors ${
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

TextArea.displayName = "TextArea";
export default TextArea;
