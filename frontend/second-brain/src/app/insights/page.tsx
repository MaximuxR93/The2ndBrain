"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit, Sparkles, Zap, Database, Shield,
  MessageSquare, FileText, Search, Code, ArrowRight,
} from "lucide-react";
import Link from "next/link";

const fade = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const FEATURES = [
  { icon: FileText,      color: "violet",  title: "Multi-Format Parsing",     desc: "PDF, DOCX, TXT, CSV, Markdown. Full content extracted — no truncation." },
  { icon: MessageSquare, color: "blue",    title: "Context-Aware Chat",       desc: "Every answer is grounded in your document. Hallucination is architecturally impossible." },
  { icon: Zap,           color: "amber",   title: "Client-Side RAG",          desc: "600-char chunks with 120-char overlap. Scored per query in the browser, no round-trip." },
  { icon: Database,      color: "emerald", title: "Persistent Knowledge Base",desc: "Docs and chat history survive refreshes via Zustand persist + localStorage." },
  { icon: Shield,        color: "blue",    title: "Honest Gap Detection",     desc: "When the document doesn't cover your question, the AI says so — no fabrication." },
  { icon: BrainCircuit,  color: "violet",  title: "Llama 3.3 70B via Groq",   desc: "State-of-the-art 70B reasoning at millisecond latency thanks to Groq inference." },
];

const STACK = [
  { name: "Next.js 14",    role: "Frontend",        color: "text-[#C4C5D0]" },
  { name: "TypeScript",    role: "Language",        color: "text-[#3B82F6]" },
  { name: "TailwindCSS",   role: "Styling",         color: "text-[#06B6D4]" },
  { name: "Zustand",       role: "State + Persist", color: "text-[#F59E0B]" },
  { name: "Framer Motion", role: "Animations",      color: "text-[#EC4899]" },
  { name: "Express.js",    role: "Backend API",     color: "text-[#7E8090]" },
  { name: "Groq SDK",      role: "AI Inference",    color: "text-[#9B7DFF]" },
  { name: "Llama 3.3 70B", role: "Language Model",  color: "text-[#22C55E]" },
  { name: "pdf-parse",     role: "PDF Extraction",  color: "text-[#EF4444]" },
  { name: "mammoth",       role: "DOCX Extraction", color: "text-[#F97316]" },
];

const ACCENT_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  violet:  { bg: "rgba(124,92,252,0.12)",  border: "rgba(124,92,252,0.22)",  text: "#9B7DFF" },
  blue:    { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.22)",  text: "#60A5FA" },
  amber:   { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.22)",  text: "#FCD34D" },
  emerald: { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.22)",   text: "#4ADE80" },
  pink:    { bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.22)",  text: "#F472B6" },
};

export default function InsightsPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-14 sm:space-y-16 lg:space-y-20">

      {/* ── Hero ── */}
      <motion.section initial="hidden" animate="visible" variants={stagger} className="text-center">
        <motion.div variants={fade}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] mb-8"
          style={{
            background: "rgba(124,92,252,0.08)",
            border: "1px solid rgba(124,92,252,0.20)",
            backdropFilter: "blur(12px)",
            color: "#9B7DFF",
          }}
        >
          <Sparkles size={12} strokeWidth={1.8} /> How SecondBrain Works
        </motion.div>

        <motion.h1 variants={fade}
          className="text-[32px] sm:text-[42px] md:text-[52px] font-bold text-white tracking-[-0.04em] leading-[1.1] mb-4 sm:mb-5"
        >
          Your documents,{" "}
          <span style={{
            background: "linear-gradient(135deg, #9B7DFF 0%, #7C5CFC 50%, #60A5FA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            intelligently searched
          </span>
        </motion.h1>

        <motion.p variants={fade} className="text-[#7E8090] max-w-2xl mx-auto text-[14px] sm:text-[15px] lg:text-[16px] leading-[1.6] mb-8 sm:mb-10">
          SecondBrain uses Retrieval-Augmented Generation to ground every AI answer in your actual document content.
          Zero hallucination. Full transparency.
        </motion.p>

        <motion.div variants={fade} className="flex items-center justify-center gap-3">
          <Link href="/documents"
            className="btn-primary flex items-center gap-2 px-6 py-3 text-white text-[14px] font-bold rounded-xl"
          >
            Get Started <ArrowRight size={14} strokeWidth={2} />
          </Link>
          <Link href="/chat"
            className="px-6 py-3 text-[#C4C5D0] text-[14px] font-semibold rounded-xl transition-all duration-200 btn-glass"
          >
            Open Chat
          </Link>
        </motion.div>
      </motion.section>

      {/* ── Features ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.div variants={fade} className="text-center mb-8">
          <p className="text-[11px] font-bold text-[#3A3C4A] uppercase tracking-[0.12em] mb-2">Core Capabilities</p>
          <h2 className="text-[28px] font-bold text-white tracking-[-0.03em]">Built for precision</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <motion.div key={title} variants={fade} className="card-premium p-6 group">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3"
                style={{
                  background: ACCENT_STYLE[color].bg,
                  border: `1px solid ${ACCENT_STYLE[color].border}`,
                  color: ACCENT_STYLE[color].text,
                  boxShadow: `0 0 20px ${ACCENT_STYLE[color].bg}`,
                }}
              >
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <h3 className="text-[15px] font-bold text-white tracking-[-0.02em] mb-2">{title}</h3>
              <p className="text-[13px] text-[#7E8090] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Architecture ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.div variants={fade} className="text-center mb-8">
          <p className="text-[11px] font-bold text-[#3A3C4A] uppercase tracking-[0.12em] mb-2">Under the Hood</p>
          <h2 className="text-[28px] font-bold text-white tracking-[-0.03em]">The architecture</h2>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

          <motion.div variants={fade} className="card-premium p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.22)", color: "#9B7DFF" }}>
                <Search size={16} strokeWidth={1.8} />
              </div>
              <h3 className="text-[15px] font-bold text-white tracking-[-0.02em]">RAG Pipeline (Client-Side)</h3>
            </div>
            <p className="text-[13px] text-[#7E8090] leading-relaxed mb-5">
              On every message, the frontend splits the full document into 600-char chunks (120-char overlap).
              Each chunk is keyword-scored against your query. The top 4 chunks are injected as context.
            </p>
            <div className="rounded-xl p-4 font-mono text-[11.5px] space-y-1.5 text-[#5A5C6A]"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
              <div><span className="text-[#9B7DFF]">1.</span> chunks = split(doc, size=600, overlap=120)</div>
              <div><span className="text-[#9B7DFF]">2.</span> scored = rank(chunks, query)</div>
              <div><span className="text-[#9B7DFF]">3.</span> context = top_k(scored, k=4)</div>
              <div><span className="text-[#9B7DFF]">4.</span> prompt  = system + context + query</div>
              <div><span className="text-[#9B7DFF]">5.</span> history = last_6_messages</div>
              <div className="pt-1"><span className="text-[#4ADE80]">→</span> <span className="text-[#4ADE80]">grounded_answer</span></div>
            </div>
          </motion.div>

          <motion.div variants={fade} className="card-premium p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.22)", color: "#60A5FA" }}>
                <Code size={16} strokeWidth={1.8} />
              </div>
              <h3 className="text-[15px] font-bold text-white tracking-[-0.02em]">System Prompt Design</h3>
            </div>
            <p className="text-[13px] text-[#7E8090] leading-relaxed mb-5">
              The model is strictly instructed: context-only answers, rich Markdown, specific citations,
              honest gap detection. Temperature 0.35 for precision.
            </p>
            <div className="rounded-xl p-4 font-mono text-[11.5px] space-y-1.5"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
              <div className="text-[#3A3C4A]">{"// inference config"}</div>
              <div><span className="text-[#A78BFA]">model:</span>        <span className="text-[#93C5FD]">"llama-3.3-70b-versatile"</span></div>
              <div><span className="text-[#A78BFA]">temperature:</span>  <span className="text-[#FCD34D]">0.35</span></div>
              <div><span className="text-[#A78BFA]">max_tokens:</span>   <span className="text-[#FCD34D]">2048</span></div>
              <div><span className="text-[#A78BFA]">context_only:</span> <span className="text-[#4ADE80]">true</span></div>
              <div><span className="text-[#A78BFA]">hallucinate:</span>  <span className="text-[#EF4444]">false</span></div>
              <div><span className="text-[#A78BFA]">history:</span>      <span className="text-[#FCD34D]">last_6_turns</span></div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Tech Stack ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.div variants={fade} className="text-center mb-8">
          <p className="text-[11px] font-bold text-[#3A3C4A] uppercase tracking-[0.12em] mb-2">Tech Stack</p>
          <h2 className="text-[28px] font-bold text-white tracking-[-0.03em]">Built with the best</h2>
        </motion.div>
        <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {STACK.map(({ name, role, color }) => (
            <div key={name} className="card-premium p-4 flex flex-col gap-1.5">
              <p className={`text-[13px] font-bold ${color}`}>{name}</p>
              <p className="text-[10px] text-[#3A3C4A] uppercase tracking-[0.08em] font-semibold">{role}</p>
            </div>
          ))}
        </motion.div>
      </motion.section>

    </div>
  );
}
