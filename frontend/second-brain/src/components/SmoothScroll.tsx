// src/components/SmoothScroll.tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      syncTouch: false,
    });

    // ── Sync Lenis with GSAP ScrollTrigger ──
    // Without these two lines, Lenis and ScrollTrigger fight each other and
    // the morph timing drifts (chapters arrive with the wrong formation).
    lenis.on("scroll", ScrollTrigger.update);
    const tickerFn = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    // Smooth anchor links (e.g. "See how it works" → #growth)
    const onAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a[href^='#']");
      if (!target) return;
      const id = target.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el, { offset: 0, duration: 1.4 });
      }
    };
    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}