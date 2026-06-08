"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import {
  LayoutDashboard, FileText, MessageSquare,
  Lightbulb, BrainCircuit, Trash2, ChevronRight, Settings,
} from "lucide-react";

const NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Chat",      href: "/chat",      icon: MessageSquare },
  { name: "Insights",  href: "/insights",  icon: Lightbulb },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { documents, selectedDoc, selectDoc, removeDocument, openSettings, activeProvider, providers } = useStore();

  const provider = providers[activeProvider];

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0a0a0f]">

      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <BrainCircuit size={17} className="text-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0a0f]" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-white tracking-tight leading-none">SecondBrain</p>
          <p className="text-[10px] text-zinc-600 tracking-widest uppercase mt-0.5">AI Knowledge</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 pt-5 space-y-0.5">
        <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-2 mb-2">Menu</p>
        {NAV.map(({ name, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${
                active
                  ? "bg-violet-500/[0.12] text-violet-300 border border-violet-500/[0.18]"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-r-full" />
              )}
              <Icon size={15} className={active ? "text-violet-400" : "text-zinc-600 group-hover:text-zinc-400 transition-colors"} />
              {name}
              {active && <ChevronRight size={11} className="ml-auto text-violet-600" />}
            </Link>
          );
        })}
      </nav>

      {/* Recent docs */}
      {documents.length > 0 && (
        <div className="px-3 pt-5 flex-1 min-h-0 flex flex-col overflow-hidden">
          <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-2 mb-2">Recent</p>
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {documents.slice(0, 10).map((doc) => {
              const sel = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => selectDoc(doc)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                    sel
                      ? "bg-indigo-500/[0.1] border border-indigo-500/[0.18]"
                      : "hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sel ? "bg-indigo-400" : "bg-zinc-700"}`} />
                  <span className={`text-[11px] truncate flex-1 leading-none ${sel ? "text-indigo-300" : "text-zinc-600 group-hover:text-zinc-300"}`}>
                    {doc.name.replace(/\.[^/.]+$/, "")}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active provider pill */}
      <div className="px-3 pt-3">
        <button
          onClick={openSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.10] transition-all group"
          title="API Settings"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 truncate flex-1 text-left transition-colors">
            {provider?.label ?? "Groq"} · {provider?.model?.split("/").pop() ?? ""}
          </span>
          <Settings size={11} className="text-zinc-700 group-hover:text-zinc-400 shrink-0 transition-colors" />
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06] mt-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            R
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-zinc-300 leading-none">Rayan</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Free plan</p>
          </div>
          <button
            onClick={openSettings}
            className="ml-auto w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-all"
            title="Settings"
          >
            <Settings size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}