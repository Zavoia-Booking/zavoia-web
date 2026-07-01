export interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 24, color = "var(--p-500)" }: SpinnerProps) {
  return (
    <svg
      className="zv-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color, display: "block" }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="40 60"
      />
    </svg>
  );
}
