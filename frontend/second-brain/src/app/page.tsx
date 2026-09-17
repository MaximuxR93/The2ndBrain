// src/app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ParticleUniverse, { UniverseHandle } from "@/components/ParticleUniverse";

gsap.registerPlugin(ScrollTrigger);

const CHAPTERS = [
  { id: "hero",      label: "Intro" },
  { id: "results",   label: "Results" },
  { id: "growth",    label: "Growth" },
  { id: "statement", label: "Statement" },
  { id: "ecosystem", label: "Ecosystem" },
  { id: "finale",    label: "Finale" },
];

export default function LandingPage() {
  const router = useRouter();
  const handleRef = useRef<UniverseHandle | null>(null);
  const formationRef = useRef(0);
  const pairRef = useRef({ from: 0, to: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const handle = handleRef.current;
    if (!handle) return;

    const triggers: ScrollTrigger[] = [];

    CHAPTERS.forEach((_, i) => {
      if (i === 0) return;
      const section = document.getElementById(CHAPTERS[i].id);
      if (!section) return;

      triggers.push(
        ScrollTrigger.create({
          trigger: section,
          // FIX: was "top bottom" — the morph only began once the next
          // chapter's top hit the viewport bottom, so its own copy was
          // already becoming readable before the background caught up
          // ("shows the PREVIOUS formation while its copy is on screen").
          // Starting 30% of a viewport earlier gives the morph room to
          // finish settling before the chapter is actually being read.
          start: "top 130%",
          end: "top top",
          onUpdate: (self) => {
            if (pairRef.current.from !== i - 1 || pairRef.current.to !== i) {
              pairRef.current = { from: i - 1, to: i };
              handle.setFormation(i - 1, i);
            }
            handle.setMorph(self.progress);
            formationRef.current = self.progress >= 0.5 ? i : i - 1;
          },
        })
      );
    });

    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [loaded]);

  return (
    <div className="relative bg-[#050508] text-white">
      {/* Soft radial backdrop — gives the additive particles something to sit on */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(124,92,252,0.10) 0%, rgba(124,92,252,0.03) 40%, transparent 70%)",
        }}
      />

      <ParticleUniverse handleRef={handleRef} formationRef={formationRef} />

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#FF3D7F]" />
          <span className="font-display text-[15px] tracking-[-0.02em] font-medium">SecondBrain</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Results", "Growth", "Ecosystem"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-[13px] text-white/60 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-5 py-2 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors"
        >
          Get started
        </button>
      </nav>

      {/* ── 1. Hero ── */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm mb-8">
          <Sparkles size={12} className="text-white/70" />
          <span className="text-[12px] text-white/70 tracking-wide">Welcome to a new era of memory</span>
        </div>

        <h1 className="font-display font-light text-[44px] sm:text-[72px] lg:text-[96px] leading-[1.0] tracking-[-0.04em] max-w-5xl">
          Your knowledge, given{" "}
          <em
            className="italic"
            style={{
              background: "linear-gradient(135deg, #FF3D7F 0%, #7C5CFC 50%, #22D3EE 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            form
          </em>
        </h1>

        <p className="text-[15px] sm:text-[18px] text-white/50 mt-8 max-w-2xl font-light leading-[1.6]">
          We build systems at the meeting point of documents, energy and intent — where raw information becomes something that answers.
        </p>

        <div className="flex items-center gap-3 mt-10">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-[14px] font-medium hover:bg-white/90 transition-all"
          >
            Get started
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href="#growth"
            className="px-6 py-3 rounded-full border border-white/15 text-white text-[14px] font-medium hover:bg-white/[0.06] transition-all"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* ── 2. Results ── */}
      <section
        id="results"
        className="relative min-h-screen flex flex-col items-center justify-center px-6 z-10"
      >
        <p className="font-mono text-[11px] tracking-[0.15em] text-[#FF3D7F] mb-4">[ RESULTS ]</p>
        <h2 className="font-display font-light text-[36px] sm:text-[56px] leading-[1.08] tracking-[-0.03em] text-center max-w-3xl mb-16">
          Numbers that move.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full">
          {[
            { value: "68%",    label: "Faster retrieval", sub: "vs. traditional search" },
            { value: "3.2×",   label: "More coverage",    sub: "of your knowledge base" },
            { value: "2,400+", label: "Teams onboard",    sub: "in the last 12 months" },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative rounded-2xl p-6 border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm"
              style={{ transform: `perspective(1000px) rotateY(${i === 0 ? 4 : i === 2 ? -4 : 0}deg)` }}
            >
              <p className="font-display text-[40px] font-light text-white leading-none">{stat.value}</p>
              <p className="text-[14px] text-white/80 mt-3 font-medium">{stat.label}</p>
              <p className="text-[12px] text-white/40 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Growth ── */}
      <section
        id="growth"
        className="relative min-h-screen flex items-center px-6 sm:px-10 lg:px-20 z-10"
      >
        <div className="max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.15em] text-[#FF3D7F] mb-4">[ GROWTH ]</p>
          <h2 className="font-display font-light text-[36px] sm:text-[52px] leading-[1.1] tracking-[-0.03em]">
            Scale without<br />losing the thread.
          </h2>
          <p className="text-[15px] text-white/50 mt-6 leading-[1.7] max-w-md">
            Every document you add makes the system smarter, not noisier. The graph stays legible because the model does the sorting — you just keep adding.
          </p>
        </div>
      </section>

      {/* ── 4. Statement ── */}
      <section
        id="statement"
        className="relative min-h-screen flex items-center justify-center px-6 z-10"
      >
        <div className="text-center max-w-3xl">
          <p className="font-mono text-[11px] tracking-[0.15em] text-[#7C5CFC] mb-6">[ THE VOID ]</p>
          <h2 className="font-display font-light text-[40px] sm:text-[64px] leading-[1.1] tracking-[-0.03em]">
            What you know,<br />in one place.
          </h2>
          <p className="text-[15px] text-white/50 mt-8 max-w-lg mx-auto leading-[1.7]">
            No folders. No tabs. No &ldquo;I&apos;ll find it later.&rdquo; Just your knowledge, indexed and answerable.
          </p>
        </div>
      </section>

      {/* ── 5. Ecosystem ── */}
      <section
        id="ecosystem"
        className="relative min-h-screen flex items-end px-6 sm:px-10 lg:px-20 pb-24 z-10"
      >
        <div className="max-w-lg">
          <p className="font-mono text-[11px] tracking-[0.15em] text-[#22D3EE] mb-4">[ ECOSYSTEM ]</p>
          <h2 className="font-display font-light text-[36px] sm:text-[52px] leading-[1.1] tracking-[-0.03em]">
            A galaxy of<br />your own making.
          </h2>
          <p className="text-[15px] text-white/50 mt-6 leading-[1.7] max-w-md">
            Connect your tools, your notes, your papers. SecondBrain pulls them into one orbit and keeps them in motion.
          </p>
        </div>
      </section>

      {/* ── 6. Finale ── */}
      <section
        id="finale"
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 z-10"
      >
        <p className="font-mono text-[11px] tracking-[0.15em] text-[#FF3D7F] mb-5">[ READY ]</p>
        <h2 className="font-display font-light text-[40px] sm:text-[64px] leading-[1.05] tracking-[-0.03em] max-w-3xl">
          Let&apos;s put it to work.
        </h2>
        <p className="text-[15px] text-white/50 mt-6 max-w-md">
          Upload something real and ask it a question you actually need answered.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="group flex items-center gap-2.5 mt-10 px-7 py-3.5 rounded-full text-[14px] font-semibold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #FF3D7F 0%, #7C5CFC 100%)",
            boxShadow: "0 0 40px rgba(255,61,127,0.35)",
          }}
        >
          Let&apos;s chat
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="relative py-12 px-6 z-10 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#FF3D7F]" />
            <span className="font-display text-[14px]">SecondBrain</span>
          </div>
          <p className="text-[12px] text-white/30">Your knowledge, given form.</p>
        </div>
      </footer>

    </div>
  );
}