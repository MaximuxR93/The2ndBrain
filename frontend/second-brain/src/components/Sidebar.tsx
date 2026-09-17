"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useState } from "react";
import { toast } from "@/components/Toast";
import { API_URL } from "@/lib/api";
import {
  LayoutDashboard, FileText, MessageSquare,
  Lightbulb, BrainCircuit, Trash2, Settings,
  Search, Sparkles, ChevronRight,
  Cpu, X, Menu, Network,
} from "lucide-react";

const NAV_MAIN = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, desc: "Overview" },
  { name: "Documents", href: "/documents", icon: FileText,        desc: "Knowledge base" },
  { name: "AI Chat",   href: "/chat",       icon: MessageSquare,   desc: "Chat with docs" },
  { name: "Graph",     href: "/graph",      icon: Network,         desc: "Knowledge graph" },
  { name: "Insights",  href: "/insights",  icon: Lightbulb,       desc: "How it works" },
];

const NAV_TOOLS = [
  { name: "Search",    href: "/search", icon: Search,    desc: "Find anything" },
];

/** Quiet section divider — no caps, no bold, no tracking. Structure without shouting. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-normal text-white/25 px-3 mb-3">{children}</p>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { documents, selectedDoc, selectDoc, removeDocument, openSettings, activeProvider, providers } = useStore();
  const provider = providers[activeProvider];

  return (
    <div className="flex flex-col h-full">
      <div className="sidebar-orb-top" />
      <div className="sidebar-orb-bottom" />

      {/* ── Logo — font-display, same voice as the landing hero ── */}
      <div className="relative px-5 py-5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl blur-md opacity-50"
              style={{ background: "linear-gradient(135deg, #7C5CFC, #4F46E5)" }} />
            <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C5CFC 0%, #4F46E5 100%)", boxShadow: "0 4px 20px rgba(124,92,252,0.35), 0 1px 0 rgba(255,255,255,0.2) inset" }}>
              <BrainCircuit size={18} className="text-white" strokeWidth={1.6} />
            </div>
          </div>
          <div>
            <p className="font-display text-[16px] font-normal text-white tracking-[-0.02em] leading-none">SecondBrain</p>
            <p className="text-[10.5px] text-white/30 mt-1 font-normal">AI workspace</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-xl btn-glass flex items-center justify-center text-[#5A5C6A] hover:text-white transition-all">
            <X size={15} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* ── Main Nav ── */}
      <nav className="relative px-3 pt-5 space-y-0.5">
        <SectionLabel>Navigation</SectionLabel>
        {NAV_MAIN.map(({ name, href, icon: Icon, desc }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={name} href={href} onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 group ${
                active
                  ? "glass-accent text-white font-medium"
                  : "text-[#7E8090] font-normal hover:text-[#C4C5D0] border border-transparent hover:border-white/[0.05] hover:bg-white/[0.03]"
              }`}
            >
              {active && <span className="nav-active-bar" />}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                active
                  ? "bg-[#7C5CFC]/20 text-[#9B7DFF]"
                  : "bg-white/[0.04] text-[#5A5C6A] group-hover:bg-white/[0.07] group-hover:text-[#9B9CAA]"
              }`}>
                <Icon size={14} strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block leading-none">{name}</span>
                <span className={`text-[10.5px] font-normal mt-0.5 block ${
                  active ? "text-[#7C5CFC]/60" : "text-white/25 group-hover:text-white/35"
                }`}>{desc}</span>
              </div>
              {active && <ChevronRight size={12} className="text-[#7C5CFC]/40 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Tools ── */}
      <nav className="relative px-3 pt-5 space-y-0.5">
        <SectionLabel>Tools</SectionLabel>
        {NAV_TOOLS.map(({ name, href, icon: Icon, desc }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link key={name} href={href} onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 group ${
                active
                  ? "glass-accent text-white font-medium"
                  : "text-[#7E8090] font-normal hover:text-[#C4C5D0] border border-transparent hover:border-white/[0.05] hover:bg-white/[0.03]"
              }`}
            >
              {active && <span className="nav-active-bar" />}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] text-[#5A5C6A] group-hover:bg-white/[0.07] group-hover:text-[#9B9CAA] transition-all">
                <Icon size={14} strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block leading-none">{name}</span>
                <span className="text-[10.5px] font-normal mt-0.5 block text-white/25 group-hover:text-white/35">{desc}</span>
              </div>
              <span className="text-[9.5px] font-normal text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-white/[0.04]">Live</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Recent Files ── */}
      {documents.length > 0 && (
        <div className="relative px-3 pt-5 flex-1 min-h-0 flex flex-col overflow-hidden">
          <SectionLabel>Recent files</SectionLabel>
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {documents.slice(0, 8).map((doc) => {
              const sel = selectedDoc?.id === doc.id;
              return (
                <div key={doc.id} onClick={() => { selectDoc(doc); onClose?.(); }}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    sel ? "glass-accent" : "hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05]"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${sel ? "bg-[#7C5CFC]" : "bg-[#3A3C4A] group-hover:bg-[#7E8090]"}`} />
                  <span className={`text-[11.5px] truncate flex-1 leading-none font-normal transition-colors ${sel ? "text-[#C4C5D0]" : "text-white/40 group-hover:text-white/60"}`}>
                    {doc.name.replace(/\.[^/.]+$/, "")}
                  </span>
                  <button onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await fetch(`${API_URL}/documents/${doc.id}`, { method: "DELETE" });
                      if (!res.ok) throw new Error("Failed to delete");
                      removeDocument(doc.id);
                    } catch {
                      toast.error("Could not delete document");
                    }
                  }}
                    className="opacity-0 group-hover:opacity-100 text-[#3A3C4A] hover:text-[#EF4444] transition-all p-0.5 rounded">
                    <Trash2 size={10} strokeWidth={1.8} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* ── Model Selector ── */}
      <div className="relative px-3 pb-3">
        <button onClick={openSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl glass btn-glass group transition-all duration-200 hover:border-[#7C5CFC]/20"
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(124,92,252,0.10)", border: "1px solid rgba(124,92,252,0.18)" }}>
            <Cpu size={13} strokeWidth={1.6} className="text-[#7C5CFC]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[11.5px] font-normal text-white/50 group-hover:text-white/70 transition-colors leading-none">
              {provider?.label ?? "Groq"}
            </p>
            <p className="text-[10px] text-white/25 group-hover:text-white/35 transition-colors mt-0.5 truncate">
              {provider?.model?.split("/").pop() ?? "gpt-oss-120b"}
            </p>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
        </button>
      </div>

      {/* ── User Profile ── */}
      <div className="relative px-4 py-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-medium text-white"
              style={{ background: "linear-gradient(135deg, #7C5CFC 0%, #4F46E5 100%)" }}>
              R
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-[#0A0A12]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white/80 leading-none">Rayan</p>
            <p className="text-[10.5px] text-white/30 mt-0.5 flex items-center gap-1">
              <Sparkles size={9} strokeWidth={1.6} className="text-[#7C5CFC]/70" />
              Pro plan
            </p>
          </div>
          <button onClick={openSettings}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#5A5C6A] hover:text-[#C4C5D0] transition-all btn-glass">
            <Settings size={13} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col h-screen sticky top-0 z-20 glass-deep relative overflow-hidden">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] glass-deep overflow-hidden animate-slide-left">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-20 left-4 z-40 w-11 h-11 rounded-2xl btn-primary flex items-center justify-center text-white shadow-lg"
        style={{ boxShadow: "0 8px 24px rgba(124,92,252,0.35)" }}
      >
        <Menu size={18} strokeWidth={2} />
      </button>
    </>
  );
}