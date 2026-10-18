import type { CSSProperties } from "react";

/**
 * AgriPulse mark: four rising bars (data + growth) with a liquid gradient
 * sweep. The palette stays within the existing brand blues and greens.
 */
export function LiquidLogoMark({
  size = 44,
  animated = false,
}: {
  size?: number;
  animated?: boolean;
}) {
  const heights = [13, 21, 28, 17];
  const style: CSSProperties = { width: size, height: size };
  return (
    <span
      className={`liquid-mark ${animated ? "liquid-mark-animated" : ""}`}
      style={style}
      role="img"
      aria-label="AgriPulse"
    >
      {heights.map((h, i) => (
        <span key={i} className="liquid-mark-bar" style={{ height: `${(h / 34) * 100}%` }} />
      ))}
    </span>
  );
}
