"use client";

import { useStore } from "@/store/useStore";
import { FileText, MessageSquare, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function Topbar() {
  const { documents, selectedDoc } = useStore();
  const totalWords = documents.reduce((s, d) => s + (d.wordCount || 0), 0);

  return (
    <header className="h-13 shrink-0 sticky top-0 z-30 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl">
      {/* Left: doc status */}
      <div className="flex items-center gap-3">
        {selectedDoc ? (
          <div className="flex items-center gap-2 bg-violet-500/[0.08] border border-violet-500/[0.18] px-3 py-1.5 rounded-full">
            <FileText size={11} className="text-violet-400 shrink-0" />
            <span className="text-[11px] text-violet-300 font-medium max-w-[180px] truncate">
              {selectedDoc.name.replace(/\.[^/.]+$/, "")}
            </span>
            <span className="text-[10px] text-violet-700">
              {selectedDoc.wordCount?.toLocaleString()}w
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-700">No document selected</span>
        )}
      </div>

      {/* Right: actions + stats */}
      <div className="flex items-center gap-2">
        {/* corpus stats */}
        {documents.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-700 bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-lg">
            <span className="text-zinc-400 font-semibold tabular-nums">{documents.length}</span>
            <span>doc{documents.length !== 1 ? "s" : ""}</span>
            <span className="text-zinc-800 mx-1">·</span>
            <span className="text-zinc-400 font-semibold tabular-nums">
              {totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
            </span>
            <span>words</span>
          </div>
        )}

        <Link
          href="/documents"
          className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/[0.08]"
        >
          <UploadCloud size={13} /> Upload
        </Link>

        <Link
          href="/chat"
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-violet-900/40"
        >
          <MessageSquare size={13} /> Chat
        </Link>
      </div>
    </header>
  );
}