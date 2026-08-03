"use client";

import { useStore } from "@/store/useStore";
import { FileText, MessageSquare, UploadCloud, Bell, Command } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Dashboard",  sub: "Your AI knowledge overview" },
  "/documents": { title: "Documents",  sub: "Manage your knowledge base" },
  "/chat":      { title: "AI Chat",    sub: "Chat with your documents" },
  "/insights":  { title: "Insights",   sub: "How SecondBrain works" },
};

export default function Topbar() {
  const { documents, selectedDoc } = useStore();
  const pathname = usePathname();
  const totalWords = documents.reduce((s, d) => s + (d.wordCount || 0), 0);
  const page = PAGE_TITLES[pathname] ?? { title: "SecondBrain", sub: "AI Workspace" };

  return (
    <header
      className="h-14 shrink-0 sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 relative"
      style={{
        background: "rgba(7,7,12,0.80)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top line glow */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(124,92,252,0.25) 30%, rgba(59,130,246,0.15) 70%, transparent 100%)" }} />

      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold text-white tracking-[-0.02em] leading-none truncate">{page.title}</h2>
          <p className="text-[11px] text-[#5A5C6A] mt-0.5 leading-none hidden sm:block">{page.sub}</p>
        </div>

        {selectedDoc && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0"
            style={{ background: "rgba(124,92,252,0.10)", border: "1px solid rgba(124,92,252,0.20)", backdropFilter: "blur(12px)" }}>
            <FileText size={10} className="text-[#7C5CFC] shrink-0" strokeWidth={1.8} />
            <span className="text-[11px] text-[#9B7DFF] font-medium max-w-[140px] truncate">
              {selectedDoc.name.replace(/\.[^/.]+$/, "")}
            </span>
            <span className="text-[10px] text-[#7C5CFC]/50 hidden lg:inline">
              {selectedDoc.wordCount?.toLocaleString()}w
            </span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Corpus stats — large screens only */}
        {documents.length > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-[#5A5C6A] px-3 py-1.5 rounded-lg btn-glass">
            <span className="text-[#C4C5D0] font-semibold tabular-nums">{documents.length}</span>
            <span>doc{documents.length !== 1 ? "s" : ""}</span>
            <span className="text-white/10 mx-1">·</span>
            <span className="text-[#C4C5D0] font-semibold tabular-nums">
              {totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
            </span>
            <span>words</span>
          </div>
        )}

        {/* Search — medium+ */}
        <button className="hidden md:flex items-center gap-2 text-[11px] text-[#5A5C6A] hover:text-[#C4C5D0] px-3 py-1.5 rounded-lg btn-glass transition-all">
          <Command size={11} strokeWidth={1.8} />
          <span className="hidden lg:inline">Search</span>
          <kbd className="text-[9px] bg-white/[0.05] px-1.5 py-0.5 rounded font-mono text-[#3A3C4A] hidden lg:inline">⌘K</kbd>
        </button>

        {/* Bell */}
        <button className="relative w-8 h-8 rounded-lg btn-glass flex items-center justify-center text-[#5A5C6A] hover:text-[#C4C5D0] transition-all">
          <Bell size={13} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#7C5CFC] rounded-full"
            style={{ boxShadow: "0 0 6px rgba(124,92,252,0.8)" }} />
        </button>

        {/* Upload — small+ */}
        <Link href="/documents"
          className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-[#7E8090] hover:text-[#C4C5D0] px-3 py-1.5 rounded-lg btn-glass transition-all">
          <UploadCloud size={13} strokeWidth={1.8} />
          <span className="hidden md:inline">Upload</span>
        </Link>

        {/* Chat CTA */}
        <Link href="/chat"
          className="btn-primary flex items-center gap-1.5 text-white text-[12px] font-bold px-3 md:px-4 py-1.5 rounded-[10px]">
          <MessageSquare size={13} strokeWidth={1.8} />
          <span className="hidden sm:inline">Chat</span>
        </Link>
      </div>
    </header>
  );
}
