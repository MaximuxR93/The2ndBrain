"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit, Sparkles, Zap, Database, Shield,
  MessageSquare, FileText, Search, Code, ArrowRight,
} from "lucide-react";
import Link from "next/link";

const fade = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const FEATURES = [
  { icon: FileText,      color: "violet",  title: "Multi-Format Parsing",    desc: "PDF, DOCX, TXT, CSV, Markdown. Full content extracted — no truncation." },
  { icon: MessageSquare, color: "indigo",  title: "Context-Aware Chat",      desc: "Every answer is grounded in your document. Hallucination is architecturally impossible." },
  { icon: Zap,           color: "amber",   title: "Client-Side RAG",         desc: "600-char chunks with 120-char overlap. Scored per query in the browser, no round-trip." },
  { icon: Database,      color: "emerald", title: "Persistent Knowledge Base",desc: "Docs and chat history survive refreshes via Zustand persist + localStorage." },
  { icon: Shield,        color: "blue",    title: "Honest Gap Detection",    desc: "When the document doesn't cover your question, the AI says so — no fabrication." },
  { icon: BrainCircuit,  color: "pink",    title: "Llama 3.3 70B via Groq",  desc: "State-of-the-art 70B reasoning at millisecond latency thanks to Groq inference." },
];

const STACK = [
  { name: "Next.js 14",     role: "Frontend",        color: "text-zinc-300" },
  { name: "TypeScript",     role: "Language",        color: "text-blue-400" },
  { name: "TailwindCSS",    role: "Styling",         color: "text-cyan-400" },
  { name: "Zustand",        role: "State + Persist", color: "text-amber-400" },
  { name: "Framer Motion",  role: "Animations",      color: "text-pink-400" },
  { name: "Express.js",     role: "Backend API",     color: "text-zinc-400" },
  { name: "Groq SDK",       role: "AI Inference",    color: "text-violet-400" },
  { name: "Llama 3.3 70B",  role: "Language Model",  color: "text-emerald-400" },
  { name: "pdf-parse",      role: "PDF Extraction",  color: "text-red-400" },
  { name: "mammoth",        role: "DOCX Extraction", color: "text-orange-400" },
];

const ACCENT: Record<string, string> = {
  violet:  "bg-violet-500/10  text-violet-400  border-violet-500/20  group-hover:bg-violet-500/15",
  indigo:  "bg-indigo-500/10  text-indigo-400  border-indigo-500/20  group-hover:bg-indigo-500/15",
  amber:   "bg-amber-500/10   text-amber-400   border-amber-500/20   group-hover:bg-amber-500/15",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/15",
  blue:    "bg-blue-500/10    text-blue-400    border-blue-500/20    group-hover:bg-blue-500/15",
  pink:    "bg-pink-500/10    text-pink-400    border-pink-500/20    group-hover:bg-pink-500/15",
};

export default function InsightsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-20">

      {/* Hero */}
      <motion.section initial="hidden" animate="visible" variants={stagger} className="text-center">
        <motion.div variants={fade}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/[0.08] border border-violet-500/[0.18] text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-6"
        >
          <Sparkles size={12} /> How SecondBrain Works
        </motion.div>
        <motion.h1 variants={fade} className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
          Your documents,{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            intelligently searched
          </span>
        </motion.h1>
        <motion.p variants={fade} className="text-zinc-500 max-w-xl mx-auto text-[14px] leading-relaxed mb-8">
          SecondBrain uses Retrieval-Augmented Generation to ground every AI answer in your actual document content.
          Zero hallucination. Full transparency.
        </motion.p>
        <motion.div variants={fade} className="flex items-center justify-center gap-3">
          <Link href="/documents"
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30"
          >
            Get Started <ArrowRight size={13} />
          </Link>
          <Link href="/chat"
            className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] text-zinc-300 text-[13px] font-semibold rounded-xl border border-white/[0.08] transition-colors"
          >
            Open Chat
          </Link>
        </motion.div>
      </motion.section>

      {/* Features grid */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.p variants={fade} className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest text-center mb-6">
          Core Capabilities
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <motion.div key={title} variants={fade}
              className="group p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-violet-500/25 hover:bg-violet-500/[0.03] transition-all"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 transition-colors ${ACCENT[color]}`}>
                <Icon size={20} />
              </div>
              <h3 className="text-[13px] font-semibold text-zinc-200 mb-1.5">{title}</h3>
              <p className="text-[12px] text-zinc-600 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Architecture */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.p variants={fade} className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest text-center mb-6">
          Under the Hood
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* RAG pipeline */}
          <motion.div variants={fade} className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
                <Search size={15} />
              </div>
              <h3 className="text-[13px] font-semibold text-zinc-200">RAG Pipeline (Client-Side)</h3>
            </div>
            <p className="text-[12px] text-zinc-600 leading-relaxed mb-4">
              On every message, the frontend splits the full document into 600-char chunks (120-char overlap).
              Each chunk is keyword-scored against your query. The top 4 chunks are injected as context.
            </p>
            <div className="bg-[#080810] rounded-xl border border-white/[0.05] p-4 font-mono text-[11px] space-y-1 text-zinc-500">
              <div><span className="text-violet-400">1.</span> chunks = split(doc, size=600, overlap=120)</div>
              <div><span className="text-violet-400">2.</span> scored = rank(chunks, query)</div>
              <div><span className="text-violet-400">3.</span> context = top_k(scored, k=4)</div>
              <div><span className="text-violet-400">4.</span> prompt  = system + context + query</div>
              <div><span className="text-violet-400">5.</span> history = last_6_messages</div>
              <div className="pt-1"><span className="text-emerald-400">→</span> <span className="text-emerald-300">grounded_answer</span></div>
            </div>
          </motion.div>

          {/* System prompt */}
          <motion.div variants={fade} className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Code size={15} />
              </div>
              <h3 className="text-[13px] font-semibold text-zinc-200">System Prompt Design</h3>
            </div>
            <p className="text-[12px] text-zinc-600 leading-relaxed mb-4">
              The model is strictly instructed: context-only answers, rich Markdown, specific citations,
              honest gap detection. Temperature 0.35 for precision.
            </p>
            <div className="bg-[#080810] rounded-xl border border-white/[0.05] p-4 font-mono text-[11px] space-y-1">
              <div className="text-zinc-700">{"// inference config"}</div>
              <div><span className="text-purple-400">model:</span>        <span className="text-blue-300">"llama-3.3-70b-versatile"</span></div>
              <div><span className="text-purple-400">temperature:</span>  <span className="text-amber-300">0.35</span></div>
              <div><span className="text-purple-400">max_tokens:</span>   <span className="text-amber-300">2048</span></div>
              <div><span className="text-purple-400">context_only:</span> <span className="text-emerald-300">true</span></div>
              <div><span className="text-purple-400">hallucinate:</span>  <span className="text-red-400">false</span></div>
              <div><span className="text-purple-400">history:</span>      <span className="text-amber-300">last_6_turns</span></div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Tech stack */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
        <motion.p variants={fade} className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest text-center mb-6">
          Tech Stack
        </motion.p>
        <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {STACK.map(({ name, role, color }) => (
            <div key={name} className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col gap-1">
              <p className={`text-[12px] font-semibold ${color}`}>{name}</p>
              <p className="text-[9px] text-zinc-700 uppercase tracking-wider font-semibold">{role}</p>
            </div>
          ))}
        </motion.div>
      </motion.section>

    </div>
  );
}