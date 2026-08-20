"use client";

import { useEffect } from "react";

/**
 * Document-level event delegation that powers the `.btn-ripple` CSS class.
 *
 * On pointerdown against any `.btn-ripple` element, we record the click
 * coordinates (relative to that element's bounding rect), write them to the
 * element's `--ripple-x` / `--ripple-y` custom properties, then add an
 * `is-rippling` class for 550ms so the `::after` keyframe fires.
 *
 * This is intentionally lightweight — no React state, no per-button refs.
 */
export function RippleController() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        ".btn-ripple"
      );
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty("--ripple-x", `${x}px`);
      target.style.setProperty("--ripple-y", `${y}px`);

      // Restart the animation by toggling the class.
      target.classList.remove("is-rippling");
      // Force reflow so the animation retriggers.
      void target.offsetWidth;
      target.classList.add("is-rippling");

      window.setTimeout(() => {
        target.classList.remove("is-rippling");
      }, 600);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return null;
}
