interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{
        backgroundColor: "var(--color-divider)",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height || "16px",
      }}
    />
  );
}
