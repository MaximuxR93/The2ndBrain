"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
  UploadCloud, MessageSquare, FileText, ArrowRight,
  BrainCircuit, Zap, Hash, TrendingUp, Clock,
} from "lucide-react";

function Stat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className={`p-4 rounded-2xl border bg-gradient-to-br ${accent} flex flex-col gap-1.5`}>
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums leading-none">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { documents, messages, selectedDoc } = useStore();

  const totalWords    = documents.reduce((s, d) => s + (d.wordCount || 0), 0);
  const totalMessages = Object.values(messages).reduce((s, m) => s + m.length, 0);
  const activeDocs    = Object.keys(messages).filter((id) => (messages[id] || []).length > 0).length;

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

      {/* Hero */}
      <header>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/25">
            <BrainCircuit size={14} className="text-white" />
          </div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">SecondBrain AI</span>
        </div>
        <h1 className="text-[28px] font-bold text-white tracking-tight">{greeting} 👋</h1>
        <p className="text-zinc-600 text-[13px] mt-1">Your AI knowledge base is ready.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Documents"   value={documents.length}
          accent="from-violet-500/[0.07] to-transparent border-violet-500/[0.13]" />
        <Stat label="Words Indexed"
          value={totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
          accent="from-indigo-500/[0.07] to-transparent border-indigo-500/[0.13]" />
        <Stat label="AI Messages"  value={totalMessages}
          accent="from-emerald-500/[0.07] to-transparent border-emerald-500/[0.13]" />
        <Stat label="Active Chats" value={activeDocs}
          accent="from-amber-500/[0.07] to-transparent border-amber-500/[0.13]" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          {
            href: "/documents", icon: UploadCloud, iconBg: "bg-violet-500/10 border-violet-500/20 text-violet-400",
            arrow: "group-hover:text-violet-400",
            title: "Upload Document",
            desc: "Add PDFs, DOCX, TXT, CSV, or Markdown files to your knowledge base.",
            hover: "hover:border-violet-500/30 hover:bg-violet-500/[0.04]",
          },
          {
            href: "/chat", icon: MessageSquare, iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
            arrow: "group-hover:text-indigo-400",
            title: "Chat with Documents",
            desc: selectedDoc
              ? `Continue with "${selectedDoc.name.replace(/\.[^/.]+$/, "")}"`
              : "Select a document and ask it anything.",
            hover: "hover:border-indigo-500/30 hover:bg-indigo-500/[0.04]",
          },
        ].map(({ href, icon: Icon, iconBg, arrow, title, desc, hover }) => (
          <Link key={href} href={href}
            className={`group p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex items-start justify-between transition-all duration-200 ${hover}`}
          >
            <div>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-4 group-hover:scale-105 transition-transform ${iconBg}`}>
                <Icon size={17} />
              </div>
              <h2 className="text-[14px] font-semibold text-zinc-200 group-hover:text-white transition-colors">{title}</h2>
              <p className="text-[12px] text-zinc-600 mt-1 leading-relaxed">{desc}</p>
            </div>
            <ArrowRight size={15} className={`text-zinc-700 group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0 ${arrow}`} />
          </Link>
        ))}
      </div>

      {/* How it works */}
      <div>
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-4">How it works</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { step: "01", icon: UploadCloud, color: "text-violet-400 bg-violet-500/10", title: "Upload",     desc: "Full file content is extracted and stored — PDF, DOCX, TXT, CSV, MD." },
            { step: "02", icon: Zap,         color: "text-amber-400 bg-amber-500/10",   title: "RAG Retrieval", desc: "Per-query, the browser chunks and ranks document sections by relevance." },
            { step: "03", icon: BrainCircuit,color: "text-emerald-400 bg-emerald-500/10",title: "AI Answer", desc: "Llama 3.3 70B answers from your exact document context — no hallucination." },
          ].map(({ step, icon: Icon, color, title, desc }) => (
            <div key={step} className="flex items-start gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${color}`}>
                {step}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-zinc-300">{title}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent docs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Recent Documents</p>
          <Link href="/documents" className="text-[11px] text-violet-500 hover:text-violet-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/[0.06] rounded-2xl">
            <FileText size={22} className="text-zinc-800 mb-3" />
            <p className="text-[13px] text-zinc-600">No documents yet.</p>
            <Link href="/documents"
              className="mt-4 text-[12px] font-semibold px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors shadow-sm shadow-violet-900/30"
            >
              Upload your first document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.slice(0, 6).map((doc) => {
              const msgCount = messages[doc.id]?.length || 0;
              return (
                <Link href="/chat" key={doc.id}
                  onClick={() => useStore.getState().selectDoc(doc)}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/25 hover:bg-violet-500/[0.04] transition-all"
                >
                  <div className="p-2 bg-white/[0.04] border border-white/[0.06] rounded-xl shrink-0 group-hover:border-violet-500/20 transition-colors">
                    <FileText size={14} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-zinc-300 truncate group-hover:text-white transition-colors">
                      {doc.name.replace(/\.[^/.]+$/, "")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-700">
                      <span>{doc.wordCount >= 1000 ? `${(doc.wordCount / 1000).toFixed(1)}k` : doc.wordCount} words</span>
                      {msgCount > 0 && <><span>·</span><span className="text-violet-600">{msgCount} msg</span></>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}