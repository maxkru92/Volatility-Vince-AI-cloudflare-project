"use client";

import { useCountUp, parseStatValue } from "@/hooks/use-count-up";

type Props = {
  value: string;
  className?: string;
};

/**
 * Renders a stat value with an animated count-up for the numeric portion.
 * Non-numeric prefixes/suffixes (like "<", "+", "s", "B", "K") are preserved.
 * Values with no parseable number (e.g. "Real-time") render statically.
 */
export function AnimatedStat({ value, className }: Props) {
  const parsed = parseStatValue(value);

  // Always call the hook (rules-of-hooks) — we just don't render the
  // animated value when the input is non-numeric (e.g. "Real-time").
  const { ref, value: animated } = useCountUp(parsed.numeric, {
    decimals: parsed.decimals,
  });

  // No numeric portion → render statically (e.g. "Real-time")
  if (parsed.numeric === 0 && parsed.suffix === value) {
    return <span className={className}>{value}</span>;
  }

  const display =
    parsed.decimals > 0
      ? animated.toFixed(parsed.decimals)
      : Math.round(animated).toLocaleString("en-US");

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {parsed.prefix}
      {display}
      {parsed.suffix}
    </span>
  );
}
