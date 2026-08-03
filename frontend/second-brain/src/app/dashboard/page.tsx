"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
  UploadCloud, MessageSquare, FileText, ArrowRight,
  BrainCircuit, Zap, Hash, TrendingUp, Search,
  Sparkles, Clock, Activity, ChevronRight,
} from "lucide-react";

function MetricCard({
  label, value, sub, icon: Icon, iconStyle, barColor, delay,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; iconStyle: React.CSSProperties;
  barColor: string; delay: string;
}) {
  return (
    <div className={`card-premium p-4 sm:p-5 opacity-0 animate-fade-up ${delay}`}
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={iconStyle}>
          <Icon size={15} strokeWidth={1.8} />
        </div>
        <TrendingUp size={11} strokeWidth={1.8} className="text-[#22C55E] opacity-50" />
      </div>
      <p className="text-[24px] sm:text-[28px] font-bold text-white tracking-[-0.04em] leading-none tabular-nums">{value}</p>
      <p className="text-[12px] sm:text-[13px] font-semibold text-[#C4C5D0] mt-1.5 leading-none">{label}</p>
      <p className="text-[10px] sm:text-[11px] text-[#5A5C6A] mt-1 hidden sm:block">{sub}</p>
      <div className="mt-3 sm:mt-4 h-0.5 rounded-full opacity-30" style={{ background: barColor }} />
    </div>
  );
}

function ActionCard({
  href, icon: Icon, iconStyle, title, desc, badge, delay,
}: {
  href: string; icon: React.ElementType; iconStyle: React.CSSProperties;
  title: string; desc: string; badge?: string; delay: string;
}) {
  return (
    <Link href={href}
      className={`card-premium p-5 sm:p-6 flex flex-col gap-3 sm:gap-4 group opacity-0 animate-fade-up ${delay}`}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={iconStyle}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
        {badge && (
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full"
            style={{ color: "#9B7DFF", background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.22)" }}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-[-0.02em]">{title}</h3>
        <p className="text-[11px] sm:text-[12px] text-[#7E8090] mt-1 sm:mt-1.5 leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-[#7C5CFC] group-hover:text-[#9B7DFF] transition-colors mt-auto">
        Get started
        <ArrowRight size={12} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-200" />
      </div>
    </Link>
  );
}

function DocCard({ doc, onSelect }: { doc: any; onSelect: () => void }) {
  const extColors: Record<string, { text: string; bg: string; border: string }> = {
    ".pdf":  { text: "#EF4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.20)" },
    ".docx": { text: "#3B82F6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.20)" },
    ".txt":  { text: "#7E8090", bg: "rgba(126,128,144,0.10)",border: "rgba(126,128,144,0.20)" },
    ".csv":  { text: "#22C55E", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.20)" },
    ".md":   { text: "#F59E0B", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)" },
  };
  const ext = doc.name.slice(doc.name.lastIndexOf(".")).toLowerCase();
  const c = extColors[ext] || extColors[".txt"];

  return (
    <Link href="/chat" onClick={onSelect} className="card-premium p-4 flex items-start gap-3 group">
      <div className="p-2 sm:p-2.5 rounded-xl shrink-0 transition-all duration-200 group-hover:scale-105"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
        <FileText size={13} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] sm:text-[13px] font-semibold text-[#C4C5D0] truncate group-hover:text-white transition-colors leading-tight">
          {doc.name.replace(/\.[^/.]+$/, "")}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#5A5C6A]">
          <span className="flex items-center gap-1">
            <Hash size={9} strokeWidth={1.8} />
            {doc.wordCount >= 1000 ? `${(doc.wordCount / 1000).toFixed(1)}k` : doc.wordCount}w
          </span>
          <span className="text-white/10">·</span>
          <span className="flex items-center gap-1">
            <Clock size={9} strokeWidth={1.8} />
            {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(doc.uploadedAt))}
          </span>
        </div>
      </div>
      <ChevronRight size={12} strokeWidth={1.8}
        className="text-[#3A3C4A] group-hover:text-[#7C5CFC] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
    </Link>
  );
}

export default function DashboardPage() {
  const { documents, messages, selectedDoc } = useStore();

  const totalWords    = documents.reduce((s, d) => s + (d.wordCount || 0), 0);
  const totalMessages = Object.values(messages).reduce((s, m) => s + m.length, 0);
  const activeDocs    = Object.keys(messages).filter((id) => (messages[id] || []).length > 0).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const emoji    = hour < 12 ? "☀️" : hour < 18 ? "👋" : "🌙";

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-8 sm:space-y-10 lg:space-y-12">

      {/* ── Hero ── */}
      <header className="opacity-0 animate-fade-up delay-0">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.25)" }}>
            <Activity size={12} strokeWidth={1.8} className="text-[#7C5CFC]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#7C5CFC] uppercase tracking-[0.12em]">
            {documents.length} documents · {totalMessages} messages
          </span>
        </div>
        <h1 className="text-[32px] sm:text-[40px] lg:text-[44px] font-bold text-white tracking-[-0.04em] leading-[1.1]">
          {greeting} {emoji}
        </h1>
        <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#7E8090] mt-2 sm:mt-3 leading-[1.6] max-w-xl">
          Welcome back to your AI Knowledge Workspace. Your second brain is ready.
        </p>
      </header>

      {/* ── Metric Cards ── */}
      <section>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard label="Documents" value={documents.length}
            sub="Files in knowledge base" icon={FileText} delay="delay-75"
            barColor="linear-gradient(90deg, #7C5CFC, transparent)"
            iconStyle={{ background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.25)", color: "#9B7DFF" }}
          />
          <MetricCard label="Words Indexed"
            value={totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
            sub="Total words processed" icon={Hash} delay="delay-150"
            barColor="linear-gradient(90deg, #3B82F6, transparent)"
            iconStyle={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#60A5FA" }}
          />
          <MetricCard label="AI Messages" value={totalMessages}
            sub="Conversations generated" icon={MessageSquare} delay="delay-225"
            barColor="linear-gradient(90deg, #22C55E, transparent)"
            iconStyle={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ADE80" }}
          />
          <MetricCard label="Active Chats" value={activeDocs}
            sub="Documents with history" icon={Zap} delay="delay-300"
            barColor="linear-gradient(90deg, #F59E0B, transparent)"
            iconStyle={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D" }}
          />
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-[17px] sm:text-[20px] font-bold text-white tracking-[-0.03em]">Quick Actions</h2>
            <p className="text-[12px] sm:text-[13px] text-[#5A5C6A] mt-0.5">Jump right in</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <ActionCard href="/documents" icon={UploadCloud} badge="New" delay="delay-75"
            title="Upload Document"
            desc="Add PDFs, DOCX, TXT, CSV, or Markdown to your knowledge base."
            iconStyle={{ background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.25)", color: "#9B7DFF" }}
          />
          <ActionCard href="/chat" icon={MessageSquare} delay="delay-150"
            title="Chat with AI"
            desc={selectedDoc ? `Continue with "${selectedDoc.name.replace(/\.[^/.]+$/, "")}"` : "Select a document and ask it anything."}
            iconStyle={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#60A5FA" }}
          />
          <ActionCard href="/dashboard" icon={Search} delay="delay-225"
            title="Search Knowledge"
            desc="Instantly search across all your documents and conversations."
            iconStyle={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ADE80" }}
          />
          <ActionCard href="/insights" icon={Sparkles} delay="delay-300"
            title="Generate Summary"
            desc="Get AI-powered summaries, insights, and key takeaways."
            iconStyle={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D" }}
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="opacity-0 animate-fade-up delay-300">
        <h2 className="text-[17px] sm:text-[20px] font-bold text-white tracking-[-0.03em] mb-4 sm:mb-5">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { step: "01", icon: UploadCloud, title: "Upload",
              desc: "Full file content is extracted — PDF, DOCX, TXT, CSV, MD. No truncation.",
              iconStyle: { background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.25)", color: "#9B7DFF" } },
            { step: "02", icon: Zap, title: "RAG Retrieval",
              desc: "The browser chunks and ranks document sections by relevance per query.",
              iconStyle: { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D" } },
            { step: "03", icon: BrainCircuit, title: "AI Answer",
              desc: "Llama 3.3 70B answers from your exact document context — no hallucination.",
              iconStyle: { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ADE80" } },
          ].map(({ step, icon: Icon, iconStyle, title, desc }) => (
            <div key={step} className="card-premium p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={iconStyle}>
                <Icon size={15} strokeWidth={1.8} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#3A3C4A] tracking-[0.1em]">{step}</span>
                  <p className="text-[13px] sm:text-[14px] font-bold text-white tracking-[-0.02em]">{title}</p>
                </div>
                <p className="text-[11px] sm:text-[12px] text-[#7E8090] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent Documents ── */}
      <section className="opacity-0 animate-fade-up delay-375">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-[17px] sm:text-[20px] font-bold text-white tracking-[-0.03em]">Recent Documents</h2>
            <p className="text-[11px] sm:text-[13px] text-[#5A5C6A] mt-0.5">
              {documents.length} file{documents.length !== 1 ? "s" : ""} in your knowledge base
            </p>
          </div>
          <Link href="/documents"
            className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-semibold text-[#7C5CFC] hover:text-[#9B7DFF] transition-colors">
            View all <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="card-premium flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 animate-glow-pulse"
              style={{ background: "rgba(124,92,252,0.10)", border: "1px solid rgba(124,92,252,0.20)" }}>
              <FileText size={22} strokeWidth={1.5} className="text-[#7C5CFC]/60" />
            </div>
            <p className="text-[14px] sm:text-[15px] font-bold text-[#C4C5D0] tracking-[-0.02em]">No documents yet</p>
            <p className="text-[12px] sm:text-[13px] text-[#5A5C6A] mt-2 max-w-xs leading-relaxed">
              Upload your first document to start building your AI knowledge base.
            </p>
            <Link href="/documents"
              className="btn-primary mt-5 sm:mt-6 text-[12px] sm:text-[13px] font-bold text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl">
              Upload your first document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.slice(0, 6).map((doc) => (
              <DocCard key={doc.id} doc={doc}
                onSelect={() => useStore.getState().selectDoc(doc)} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
