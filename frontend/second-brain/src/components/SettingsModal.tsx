"use client";

import { useState } from "react";
import { useStore, ProviderId, PROVIDER_DEFAULTS } from "@/store/useStore";
import {
  X, Key, Check, ChevronDown, RotateCcw, ExternalLink, Eye, EyeOff, Zap,
} from "lucide-react";

const PROVIDER_META: Record<ProviderId, {
  color: string; accent: string; dotColor: string;
  docsUrl: string; keyPlaceholder: string; models: string[]; badge?: string;
}> = {
  groq: {
    color: "from-[#F59E0B] to-[#D97706]",
    accent: "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10",
    dotColor: "bg-[#F59E0B]",
    docsUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
    badge: "Default",
  },
  openai: {
    color: "from-[#22C55E] to-[#16A34A]",
    accent: "text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10",
    dotColor: "bg-[#22C55E]",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  anthropic: {
    color: "from-[#7C5CFC] to-[#4F46E5]",
    accent: "text-[#7C5CFC] border-[#7C5CFC]/30 bg-[#7C5CFC]/10",
    dotColor: "bg-[#7C5CFC]",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
    models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-4-5-20251001"],
  },
  openrouter: {
    color: "from-[#3B82F6] to-[#1D4ED8]",
    accent: "text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/10",
    dotColor: "bg-[#3B82F6]",
    docsUrl: "https://openrouter.ai/keys",
    keyPlaceholder: "sk-or-...",
    models: [
      "meta-llama/llama-3.3-70b-instruct",
      "google/gemini-2.0-flash-001",
      "deepseek/deepseek-r1",
      "mistralai/mistral-large",
    ],
  },
  grok: {
    color: "from-[#7E8090] to-[#5A5C6A]",
    accent: "text-[#B6B7C2] border-[#7E8090]/30 bg-[#7E8090]/10",
    dotColor: "bg-[#7E8090]",
    docsUrl: "https://console.x.ai",
    keyPlaceholder: "xai-...",
    models: ["grok-3-mini", "grok-3", "grok-2"],
  },
};

const PROVIDER_ORDER: ProviderId[] = ["groq", "openai", "anthropic", "openrouter", "grok"];

export default function SettingsModal() {
  const {
    settingsOpen, closeSettings,
    activeProvider, providers,
    setActiveProvider, updateProvider, resetProvider,
  } = useStore();

  const [tab, setTab]       = useState<ProviderId>("groq");
  const [showKey, setShowKey] = useState<Record<ProviderId, boolean>>({} as any);
  const [saved, setSaved]   = useState<ProviderId | null>(null);

  if (!settingsOpen || !providers) return null;

  const current = providers?.[tab];
  const meta    = PROVIDER_META[tab];
  if (!current) return null;

  function handleSave() {
    if (current.apiKey.trim()) {
      updateProvider(tab, { enabled: true });
      setActiveProvider(tab);
    }
    setSaved(tab);
    setTimeout(() => setSaved(null), 2000);
  }

  function handleClear() {
    updateProvider(tab, { apiKey: "", enabled: tab === "groq" });
    if (activeProvider === tab && tab !== "groq") setActiveProvider("groq");
  }

  return (
      <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)" }}
      onClick={(e) => e.target === e.currentTarget && closeSettings()}
    >
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden animate-fade-up"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.07) inset, 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,92,252,0.08)",
        }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#4F46E5] flex items-center justify-center shadow-lg shadow-[#7C5CFC]/25">
              <Key size={16} strokeWidth={1.8} className="text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white tracking-[-0.02em]">API Settings</h2>
              <p className="text-[12px] text-[#5A5C6A] mt-0.5">Manage your AI provider keys</p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#5A5C6A] hover:text-[#B6B7C2] transition-all border border-white/[0.05] hover:border-white/[0.10]"
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex min-h-0">
          {/* ── Provider Tabs ── */}
          <div className="w-48 shrink-0 p-3 space-y-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            {PROVIDER_ORDER.map((id) => {
              const p  = providers[id];
              const m  = PROVIDER_META[id];
              const isActive = activeProvider === id;
              const hasKey   = !!p.apiKey;

              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                    tab === id
                      ? "border border-white/[0.08]"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                  style={tab === id ? { background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" } : {}}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isActive && hasKey ? "bg-[#22C55E]" :
                    hasKey             ? "bg-[#3B82F6]" :
                    id === "groq"      ? m.dotColor :
                    "bg-[#444654]"
                  }`} />
                  <span className={`text-[12px] font-semibold flex-1 transition-colors ${
                    tab === id ? "text-[#B6B7C2]" : "text-[#5A5C6A] group-hover:text-[#7E8090]"
                  }`}>
                    {PROVIDER_DEFAULTS[id].label}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold text-[#22C55E] uppercase tracking-wider">ON</span>
                  )}
                </button>
              );
            })}

            {/* Legend */}
            <div className="pt-5 px-2 space-y-2">
              {[
                { color: "bg-[#22C55E]", label: "Active" },
                { color: "bg-[#3B82F6]", label: "Has key" },
                { color: "bg-[#444654]", label: "Not set" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  <span className="text-[10px] text-[#444654]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main Panel ── */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[480px]">

            {/* Provider header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg`}>
                  <Zap size={16} strokeWidth={1.8} className="text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-white tracking-[-0.02em]">{PROVIDER_DEFAULTS[tab].label}</p>
                  {meta.badge && (
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mt-0.5 ${meta.accent}`}>
                      {meta.badge}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={meta.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] text-[#5A5C6A] hover:text-[#B6B7C2] transition-colors"
              >
                Get API key <ExternalLink size={11} strokeWidth={1.8} />
              </a>
            </div>

            {/* Groq notice */}
            {tab === "groq" && (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-[#F59E0B]/[0.07] border border-[#F59E0B]/[0.15]">
                <span className="text-[#F59E0B] mt-0.5 text-[14px]">ℹ</span>
                <p className="text-[12px] text-[#F59E0B]/80 leading-relaxed">
                  Groq is the default provider — your backend's{" "}
                  <code className="text-[#F59E0B] text-[11px] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">.env</code>{" "}
                  key is used automatically. Add a key here only to override it.
                </p>
              </div>
            )}

            {/* API Key */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#7E8090] uppercase tracking-[0.1em]">API Key</label>
              <div className="relative">
                <input
                  type={showKey[tab] ? "text" : "password"}
                  value={current.apiKey}
                  onChange={(e) => updateProvider(tab, { apiKey: e.target.value })}
                  placeholder={meta.keyPlaceholder}
                  className="w-full h-12 rounded-xl px-4 pr-20 text-[13px] text-[#C4C5D0] placeholder:text-[#3A3C4A] font-mono outline-none transition-all glass-input"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setShowKey((p) => ({ ...p, [tab]: !p[tab] }))}
                    className="p-1.5 rounded-lg text-[#5A5C6A] hover:text-[#B6B7C2] hover:bg-white/[0.06] transition-all"
                  >
                    {showKey[tab] ? <EyeOff size={13} strokeWidth={1.8} /> : <Eye size={13} strokeWidth={1.8} />}
                  </button>
                  {current.apiKey && (
                    <button
                      onClick={handleClear}
                      className="p-1.5 rounded-lg text-[#5A5C6A] hover:text-[#EF4444] hover:bg-[#EF4444]/[0.08] transition-all"
                    >
                      <X size={13} strokeWidth={1.8} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-[#444654]">Stored locally in your browser. Never sent to our servers.</p>
            </div>

            {/* Model selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#7E8090] uppercase tracking-[0.1em]">Model</label>
              <div className="relative">
                <select
                  value={current.model}
                  onChange={(e) => updateProvider(tab, { model: e.target.value })}
                  className="w-full h-12 appearance-none rounded-xl px-4 pr-10 text-[13px] text-[#C4C5D0] outline-none cursor-pointer glass-input"
                >
                  {meta.models.map((m) => (
                    <option key={m} value={m} className="bg-[#0B0B10]">{m}</option>
                  ))}
                </select>
                <ChevronDown size={14} strokeWidth={1.8} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A5C6A] pointer-events-none" />
              </div>
              <button
                onClick={() => resetProvider(tab)}
                className="flex items-center gap-1.5 text-[11px] text-[#5A5C6A] hover:text-[#B6B7C2] transition-colors"
              >
                <RotateCcw size={11} strokeWidth={1.8} /> Reset to default model
              </button>
            </div>

            {/* Set as active */}
            {activeProvider !== tab && current.apiKey && (
              <button
                onClick={() => setActiveProvider(tab)}
                className={`w-full py-3 rounded-xl text-[13px] font-bold border transition-all hover:opacity-90 ${meta.accent}`}
              >
                Set as active provider
              </button>
            )}

            {/* Active indicator */}
            {activeProvider === tab && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#22C55E]/[0.07] border border-[#22C55E]/[0.15]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-[12px] text-[#22C55E] font-medium">This provider is currently active</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <p className="text-[11px] text-[#5A5C6A]">
            Active:{" "}
            <span className="text-[#B6B7C2] font-semibold">{PROVIDER_DEFAULTS[activeProvider].label}</span>
            <span className="mx-2 text-white/10">·</span>
            <span className="text-[#7E8090]">{providers[activeProvider].model}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={closeSettings}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold text-[#7E8090] hover:text-[#B6B7C2] hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/[0.08]"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-bold text-white"
            >
              {saved === tab ? (
                <><Check size={13} strokeWidth={2} /> Saved!</>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
