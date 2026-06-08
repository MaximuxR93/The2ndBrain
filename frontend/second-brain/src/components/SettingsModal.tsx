"use client";

import { useState } from "react";
import { useStore, ProviderId, PROVIDER_DEFAULTS } from "@/store/useStore";
import {
  X, Key, Check, ChevronDown, RotateCcw, ExternalLink, Eye, EyeOff, Zap,
} from "lucide-react";

const PROVIDER_META: Record<ProviderId, {
  color: string;
  accent: string;
  docsUrl: string;
  keyPlaceholder: string;
  models: string[];
  badge?: string;
}> = {
  groq: {
    color: "from-orange-500 to-amber-500",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    docsUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
    badge: "Default",
  },
  openai: {
    color: "from-emerald-500 to-teal-500",
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  anthropic: {
    color: "from-violet-500 to-purple-500",
    accent: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
    models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-4-5-20251001"],
  },
  openrouter: {
    color: "from-blue-500 to-indigo-500",
    accent: "text-blue-400 border-blue-500/30 bg-blue-500/10",
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
    color: "from-zinc-400 to-zinc-600",
    accent: "text-zinc-300 border-zinc-500/30 bg-zinc-500/10",
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

  const [tab, setTab] = useState<ProviderId>("groq");
  const [showKey, setShowKey] = useState<Record<ProviderId, boolean>>({} as any);
  const [saved, setSaved] = useState<ProviderId | null>(null);

  if (!settingsOpen || !providers) return null;

  const current = providers?.[tab];
  const meta = PROVIDER_META[tab];

  if (!current) return null;

  function handleSave() {
    // If key was entered, enable this provider and make it active
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && closeSettings()}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-[#0d0d14] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Key size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">API Settings</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Manage your AI provider keys</p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex min-h-0">
          {/* Provider tabs (left column) */}
          <div className="w-44 shrink-0 border-r border-white/[0.06] p-3 space-y-0.5">
            {PROVIDER_ORDER.map((id) => {
              const p = providers[id];
              const m = PROVIDER_META[id];
              const isActive = activeProvider === id;
              const hasKey = !!p.apiKey;

              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group ${
                    tab === id
                      ? "bg-white/[0.06] border border-white/[0.08]"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isActive && hasKey
                      ? "bg-emerald-400"
                      : hasKey
                      ? "bg-blue-400"
                      : id === "groq"
                      ? "bg-amber-500"
                      : "bg-zinc-700"
                  }`} />
                  <span className={`text-[12px] font-medium flex-1 ${tab === id ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                    {PROVIDER_DEFAULTS[id].label}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">ON</span>
                  )}
                </button>
              );
            })}

            {/* Legend */}
            <div className="pt-4 px-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-zinc-600">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[10px] text-zinc-600">Has key</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <span className="text-[10px] text-zinc-600">Not set</span>
              </div>
            </div>
          </div>

          {/* Main panel */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[460px]">

            {/* Provider header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg`}>
                  <Zap size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{PROVIDER_DEFAULTS[tab].label}</p>
                  {meta.badge && (
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${meta.accent}`}>
                      {meta.badge}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={meta.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Get API key
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Groq notice */}
            {tab === "groq" && (
              <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/[0.15]">
                <span className="text-amber-400 mt-0.5">ℹ</span>
                <p className="text-[12px] text-amber-300/80 leading-relaxed">
                  Groq is the default provider — your backend's <code className="text-amber-300 text-[11px] bg-amber-500/10 px-1 py-0.5 rounded">.env</code> key is used automatically.
                  Add a key here only if you want to override it or use a different account.
                </p>
              </div>
            )}

            {/* API Key field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">API Key</label>
              <div className="relative">
                <input
                  type={showKey[tab] ? "text" : "password"}
                  value={current.apiKey}
                  onChange={(e) => updateProvider(tab, { apiKey: e.target.value })}
                  placeholder={meta.keyPlaceholder}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 pr-20 text-[13px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setShowKey((p) => ({ ...p, [tab]: !p[tab] }))}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
                    title={showKey[tab] ? "Hide" : "Show"}
                  >
                    {showKey[tab] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  {current.apiKey && (
                    <button
                      onClick={handleClear}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
                      title="Clear key"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-zinc-600">Stored locally in your browser. Never sent to our servers.</p>
            </div>

            {/* Model selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Model</label>
              <div className="relative">
                <select
                  value={current.model}
                  onChange={(e) => updateProvider(tab, { model: e.target.value })}
                  className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 pr-9 text-[13px] text-zinc-200 focus:outline-none focus:border-violet-500/50 transition-all cursor-pointer"
                >
                  {meta.models.map((m) => (
                    <option key={m} value={m} className="bg-[#0d0d14]">{m}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
              <button
                onClick={() => resetProvider(tab)}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <RotateCcw size={10} />
                Reset to default model
              </button>
            </div>

            {/* Set as active */}
            {activeProvider !== tab && current.apiKey && (
              <button
                onClick={() => { setActiveProvider(tab); }}
                className={`w-full py-2.5 rounded-xl text-[12px] font-medium border transition-all ${meta.accent} hover:opacity-80`}
              >
                Set as active provider
              </button>
            )}

            {/* Current active info */}
            {activeProvider === tab && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/[0.15]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[12px] text-emerald-300">This provider is currently active</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
          <p className="text-[11px] text-zinc-600">
            Active: <span className="text-zinc-400 font-medium">{PROVIDER_DEFAULTS[activeProvider].label}</span>
            <span className="mx-1.5 text-zinc-700">·</span>
            <span className="text-zinc-500">{providers[activeProvider].model}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={closeSettings}
              className="px-4 py-2 rounded-xl text-[12px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-all"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/20"
            >
              {saved === tab ? (
                <><Check size={13} /> Saved!</>
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