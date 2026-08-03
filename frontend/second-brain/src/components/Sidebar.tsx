"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useState } from "react";
import {
  LayoutDashboard, FileText, MessageSquare,
  Lightbulb, BrainCircuit, Trash2, Settings,
  Search, BarChart3, Sparkles, ChevronRight,
  Cpu, X, Menu,
} from "lucide-react";

const NAV_MAIN = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, desc: "Overview" },
  { name: "Documents", href: "/documents", icon: FileText,        desc: "Knowledge base" },
  { name: "AI Chat",   href: "/chat",       icon: MessageSquare,   desc: "Chat with docs" },
  { name: "Insights",  href: "/insights",  icon: Lightbulb,       desc: "How it works" },
];

const NAV_TOOLS = [
  { name: "Search",    href: "/dashboard", icon: Search,    desc: "Find anything" },
  { name: "Analytics", href: "/dashboard", icon: BarChart3, desc: "Usage stats" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { documents, selectedDoc, selectDoc, removeDocument, openSettings, activeProvider, providers } = useStore();
  const provider = providers[activeProvider];

  return (
    <div className="flex flex-col h-full">
      {/* Decorative orbs */}
      <div className="sidebar-orb-top" />
      <div className="sidebar-orb-bottom" />

      {/* ── Logo ── */}
      <div className="relative px-5 py-5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl blur-md opacity-60"
              style={{ background: "linear-gradient(135deg, #7C5CFC, #4F46E5)" }} />
            <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C5CFC 0%, #4F46E5 100%)", boxShadow: "0 4px 20px rgba(124,92,252,0.4), 0 1px 0 rgba(255,255,255,0.2) inset" }}>
              <BrainCircuit size={18} className="text-white" strokeWidth={1.8} />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-[#0A0A12]"
              style={{ boxShadow: "0 0 8px rgba(34,197,94,0.6)" }} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white tracking-[-0.03em] leading-none">SecondBrain</p>
            <p className="text-[10px] text-[#5A5C6A] tracking-[0.14em] uppercase mt-1 font-medium">AI Workspace</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-xl btn-glass flex items-center justify-center text-[#5A5C6A] hover:text-white transition-all">
            <X size={15} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* ── Main Nav ── */}
      <nav className="relative px-3 pt-5 space-y-0.5">
        <p className="text-[9px] font-bold text-[#3A3C4A] uppercase tracking-[0.16em] px-3 mb-3">Navigation</p>
        {NAV_MAIN.map(({ name, href, icon: Icon, desc }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={name} href={href} onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                active
                  ? "glass-accent text-white"
                  : "text-[#7E8090] hover:text-[#C4C5D0] border border-transparent hover:border-white/[0.05] hover:bg-white/[0.03]"
              }`}
            >
              {active && <span className="nav-active-bar" />}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                active
                  ? "bg-[#7C5CFC]/25 text-[#9B7DFF]"
                  : "bg-white/[0.04] text-[#5A5C6A] group-hover:bg-white/[0.07] group-hover:text-[#9B9CAA]"
              }`}>
                <Icon size={14} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block leading-none">{name}</span>
                <span className={`text-[10px] font-normal mt-0.5 block ${
                  active ? "text-[#7C5CFC]/60" : "text-[#3A3C4A] group-hover:text-[#5A5C6A]"
                }`}>{desc}</span>
              </div>
              {active && <ChevronRight size={12} className="text-[#7C5CFC]/40 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Tools ── */}
      <nav className="relative px-3 pt-5 space-y-0.5">
        <p className="text-[9px] font-bold text-[#3A3C4A] uppercase tracking-[0.16em] px-3 mb-3">Tools</p>
        {NAV_TOOLS.map(({ name, href, icon: Icon, desc }) => (
          <Link key={name} href={href} onClick={onClose}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#7E8090] hover:text-[#C4C5D0] border border-transparent hover:border-white/[0.05] hover:bg-white/[0.03] transition-all duration-200 group"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] text-[#5A5C6A] group-hover:bg-white/[0.07] group-hover:text-[#9B9CAA] transition-all">
              <Icon size={14} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block leading-none">{name}</span>
              <span className="text-[10px] font-normal mt-0.5 block text-[#3A3C4A] group-hover:text-[#5A5C6A]">{desc}</span>
            </div>
            <span className="text-[9px] font-bold text-[#3A3C4A] bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-white/[0.04]">Soon</span>
          </Link>
        ))}
      </nav>

      {/* ── Recent Files ── */}
      {documents.length > 0 && (
        <div className="relative px-3 pt-5 flex-1 min-h-0 flex flex-col overflow-hidden">
          <p className="text-[9px] font-bold text-[#3A3C4A] uppercase tracking-[0.16em] px-3 mb-3">Recent Files</p>
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {documents.slice(0, 8).map((doc) => {
              const sel = selectedDoc?.id === doc.id;
              return (
                <div key={doc.id} onClick={() => { selectDoc(doc); onClose?.(); }}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    sel ? "glass-accent" : "hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05]"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${sel ? "bg-[#7C5CFC]" : "bg-[#3A3C4A] group-hover:bg-[#7E8090]"}`}
                    style={sel ? { boxShadow: "0 0 6px rgba(124,92,252,0.8)" } : {}} />
                  <span className={`text-[11px] truncate flex-1 leading-none font-medium transition-colors ${sel ? "text-[#C4C5D0]" : "text-[#5A5C6A] group-hover:text-[#9B9CAA]"}`}>
                    {doc.name.replace(/\.[^/.]+$/, "")}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}
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
            style={{ background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.2)" }}>
            <Cpu size={13} strokeWidth={1.8} className="text-[#7C5CFC]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[11px] font-semibold text-[#7E8090] group-hover:text-[#C4C5D0] transition-colors leading-none">
              {provider?.label ?? "Groq"}
            </p>
            <p className="text-[10px] text-[#3A3C4A] group-hover:text-[#5A5C6A] transition-colors mt-0.5 truncate">
              {provider?.model?.split("/").pop() ?? "llama-3.3-70b"}
            </p>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0 animate-pulse"
            style={{ boxShadow: "0 0 6px rgba(34,197,94,0.7)" }} />
        </button>
      </div>

      {/* ── User Profile ── */}
      <div className="relative px-4 py-4 border-t border-white/[0.05]">
        <div className="absolute top-0 left-4 right-4 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,92,252,0.15), transparent)" }} />
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7C5CFC 0%, #4F46E5 100%)", boxShadow: "0 4px 14px rgba(124,92,252,0.35), 0 1px 0 rgba(255,255,255,0.15) inset" }}>
              R
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-[#0A0A12]"
              style={{ boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#C4C5D0] leading-none">Rayan</p>
            <p className="text-[10px] text-[#5A5C6A] mt-0.5 flex items-center gap-1">
              <Sparkles size={9} strokeWidth={1.8} className="text-[#7C5CFC]" />
              Pro Plan
            </p>
          </div>
          <button onClick={openSettings}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#5A5C6A] hover:text-[#C4C5D0] transition-all btn-glass">
            <Settings size={13} strokeWidth={1.8} />
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
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col h-screen sticky top-0 z-20 glass-deep relative overflow-hidden">
        <SidebarContent />
      </aside>

      {/* ── Mobile hamburger trigger (rendered in Topbar via context, but we expose a button here too) ── */}
      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] glass-deep overflow-hidden animate-slide-left">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Mobile menu button — floats bottom-left, only on mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-20 left-4 z-40 w-11 h-11 rounded-2xl btn-primary flex items-center justify-center text-white shadow-lg"
        style={{ boxShadow: "0 8px 24px rgba(124,92,252,0.4)" }}
      >
        <Menu size={18} strokeWidth={2} />
      </button>
    </>
  );
}
