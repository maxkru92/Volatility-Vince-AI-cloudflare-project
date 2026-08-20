"use client";

import { useEffect, useRef } from "react";

// Characters: mix of digits and Greek letters for quant finance flair
const CHARS = "0123456789\u0394\u0393\u03A3\u03C3\u03BC";

interface Column {
  x: number;
  y: number;
  speed: number; // frames per character advance (1-4)
  charIndex: number;
  frameCount: number;
}

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const columnsRef = useRef<Column[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const COL_WIDTH = 20;
    const FONT_SIZE = 14;

    function initColumns() {
      if (!canvas) return;
      // Use the viewport directly: this canvas is a fixed global layer, not a
      // section-local decoration whose size can collapse with its parent.
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;

      const numCols = Math.floor(w / COL_WIDTH);
      columnsRef.current = Array.from({ length: numCols }, (_, i) => ({
        x: i * COL_WIDTH,
        y: Math.random() * h * -1, // start above the viewport at random offset
        speed: 1 + Math.floor(Math.random() * 4), // 1-4
        charIndex: Math.floor(Math.random() * CHARS.length),
        frameCount: 0,
      }));
    }

    function draw() {
      if (!canvas || !ctx) return;

      // Fade previous frame while keeping the page background visible beneath the canvas.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";

      const h = canvas.height;
      const opacity = 0.10 + Math.random() * 0.10; // 0.10-0.20: readable ambient signal across the full page

      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.fillStyle = `rgba(52, 211, 153, ${opacity})`;

      frameRef.current++;

      // Skip every other frame on mobile for performance
      if (isMobile && frameRef.current % 2 !== 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      for (const col of columnsRef.current) {
        col.frameCount++;
        if (col.frameCount >= col.speed) {
          col.frameCount = 0;
          // Draw current character
          const char = CHARS[col.charIndex];
          ctx.fillText(char, col.x, col.y);

          // Advance
          col.y += FONT_SIZE;
          col.charIndex = (col.charIndex + 1) % CHARS.length;

          // Reset when off screen
          if (col.y > h + FONT_SIZE) {
            col.y = Math.random() * -100;
            col.speed = 1 + Math.floor(Math.random() * 4);
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    initColumns();
    // Start transparent so the global theme and grid remain visible beneath the rain.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rafRef.current = requestAnimationFrame(draw);

    // Handle resize
    const handleResize = () => {
      initColumns();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none block"
      aria-hidden="true"
    />
  );
}
