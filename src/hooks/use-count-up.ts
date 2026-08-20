"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up hook. Returns the current displayed value.
 * Triggers when the element scrolls into view (uses IntersectionObserver).
 */
export function useCountUp(
  target: number,
  options: { duration?: number; decimals?: number; once?: boolean } = {}
) {
  const { duration = 1600, decimals = 0, once = true } = options;
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!once || !startedRef.current)) {
            startedRef.current = true;
            const start = performance.now();
            const animate = (now: number) => {
              const elapsed = now - start;
              const t = Math.min(1, elapsed / duration);
              // easeOutCubic
              const eased = 1 - Math.pow(1 - t, 3);
              const next = target * eased;
              setValue(Number(next.toFixed(decimals)));
              if (t < 1) requestAnimationFrame(animate);
              else setValue(target);
            };
            requestAnimationFrame(animate);
          } else if (!once && !entry.isIntersecting) {
            startedRef.current = false;
            setValue(0);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration, decimals, once]);

  return { ref, value };
}

/**
 * Parses a value like "100+", "<2s", "1.84B", "~50,000" into a numeric
 * target + suffix string so we can animate the numeric portion.
 */
export function parseStatValue(raw: string): { numeric: number; prefix: string; suffix: string; decimals: number } {
  const match = raw.match(/^([~<>]?\s*)([\d.,]+)(.*)$/);
  if (!match) return { numeric: 0, prefix: "", suffix: raw, decimals: 0 };
  const [, prefix, numStr, suffix] = match;
  const cleaned = numStr.replace(/,/g, "");
  const numeric = parseFloat(cleaned);
  const decimals = cleaned.includes(".") ? cleaned.split(".")[1].length : 0;
  return { numeric, prefix: prefix || "", suffix: suffix || "", decimals };
}
