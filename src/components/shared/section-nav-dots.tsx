"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sections = [
  { id: "top", label: "Hero" },
  { id: "overview", label: "Overview" },
  { id: "capabilities", label: "Capabilities" },
  { id: "demo", label: "Demo" },
  { id: "gex", label: "GEX" },
  { id: "greeks", label: "Greeks" },
  { id: "strategy", label: "Strategy" },
  { id: "architecture", label: "Architecture" },
  { id: "commands", label: "Commands" },
  { id: "suite", label: "Suite" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export function SectionNavDots() {
  const [activeSection, setActiveSection] = useState<string>("top");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Pick the one with the highest intersection ratio
          const mostVisible = visibleEntries.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          setActiveSection(mostVisible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Small delay to ensure sections are rendered
    const timer = setTimeout(() => {
      sections.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) {
          observer.observe(el);
        }
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className="pointer-events-none fixed right-6 top-1/2 z-50 -translate-y-1/2 hidden lg:block"
    >
      <div className="pointer-events-auto flex flex-col items-center gap-0">
        {sections.map((section, i) => {
          const isActive = activeSection === section.id;
          const isHovered = hoveredSection === section.id;
          return (
            <div key={section.id} className="relative flex flex-col items-center">
              {/* Connecting line between dots */}
              {i > 0 && (
                <div className="h-4 w-px bg-white/10" aria-hidden />
              )}

              {/* Dot + tooltip */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <button
                  onClick={() => handleClick(section.id)}
                  className="relative flex items-center justify-center p-1"
                  aria-label={`Navigate to ${section.label} section`}
                >
                  <motion.span
                    className="rounded-full"
                    animate={{
                      width: isActive ? 10 : 6,
                      height: isActive ? 10 : 6,
                      backgroundColor: isActive
                        ? "rgba(52, 211, 153, 1)"
                        : "rgba(255, 255, 255, 0.3)",
                      boxShadow: isActive
                        ? "0 0 8px 2px rgba(52, 211, 153, 0.4), 0 0 20px 4px rgba(52, 211, 153, 0.15)"
                        : "0 0 0px 0px transparent",
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                  />
                </button>

                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[oklch(0.20_0.014_252)]/90 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-white/80 backdrop-blur-sm"
                    >
                      {section.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
