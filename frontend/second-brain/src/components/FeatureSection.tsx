"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  index: string;        // "01", "02", "03"
  label: string;        // "INGEST", "ASK", "SEE"
  title: string;        // heading (supports line breaks via \n)
  body: string;
  side: "left" | "right";
  accent?: string;
}

/**
 * One alternating feature beat. Fades + slides in from its own side when it
 * enters the viewport, then stays put until the next section pushes it away.
 * `side="left"`  → text sits on the left half,  right half is breathing room.
 * `side="right"` → mirrored.
 */
export default function FeatureSection({
  index, label, title, body, side, accent = "#7C5CFC",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25, rootMargin: "-10% 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isLeft = side === "left";

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center px-6 sm:px-10 lg:px-20"
    >
      <div
        className={`w-full max-w-5xl mx-auto flex ${
          isLeft ? "justify-start" : "justify-end"
        }`}
      >
        <div
          className="max-w-xl will-change-transform transition-all duration-[900ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translate3d(0, 0, 0)"
              : `translate3d(${isLeft ? "-40px" : "40px"}, 24px, 0)`,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <p
            className="font-mono text-[11px] tracking-[0.15em] mb-5"
            style={{ color: accent }}
          >
            [ {index} — {label} ]
          </p>
          <h2 className="font-display font-light text-[34px] sm:text-[52px] lg:text-[64px] leading-[1.08] tracking-[-0.03em] text-white">
            {title.split("\n").map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h2>
          <p className="text-[14px] sm:text-[16px] text-white/50 mt-6 max-w-lg font-light leading-[1.7]">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}