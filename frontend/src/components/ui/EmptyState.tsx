import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={40} style={{ color: "var(--text-muted)" }} className="mb-4" />
      <h3 className="text-[15px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-[12px] max-w-[300px]" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
