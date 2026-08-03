"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot, User, Sparkles, Send, BrainCircuit,
  FileText, Trash2, Copy, Check, ChevronDown,
  Zap, BookOpen, BarChart3, RefreshCw, Hash, Settings,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

/* ── RAG helpers ── */
function chunkDoc(text: string, size = 600, overlap = 120): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
  }
  return chunks;
}

function scoreChunk(chunk: string, query: string): number {
  const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const lower = chunk.toLowerCase();
  return keywords.reduce((score, kw) => {
    const hits = (lower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    return score + hits;
  }, 0);
}

function buildContext(content: string, query: string): string {
  if (!content?.trim()) return "";
  const chunks = chunkDoc(content);
  if (!chunks.length) return "";
  const ranked = chunks
    .map((c, i) => ({ c, score: scoreChunk(c, query) + (i === 0 ? 0.5 : 0) }))
    .sort((a, b) => b.score - a.score);
  const topSet = new Set<string>();
  const top: string[] = [];
  [ranked[0].c, ...ranked.slice(0, 3).map((r) => r.c)].forEach((c) => {
    if (!topSet.has(c)) { topSet.add(c); top.push(c); }
  });
  return top.join("\n\n---\n\n");
}

/* ── Quick actions ── */
const ACTIONS = [
  { label: "Summarize",      icon: Sparkles,    color: "violet",  prompt: "Write a detailed summary of this document with the key points organized under clear headings." },
  { label: "Key Insights",   icon: Zap,         color: "amber",   prompt: "What are the 5 most important insights or findings in this document? Use numbered headings." },
  { label: "Extract Skills", icon: BrainCircuit, color: "emerald", prompt: "Extract and categorize all skills, technologies, tools, and competencies mentioned in this document." },
  { label: "Action Items",   icon: BookOpen,    color: "blue",    prompt: "List all action items, next steps, tasks, or recommendations mentioned in this document." },
  { label: "Data & Stats",   icon: BarChart3,   color: "pink",    prompt: "Extract all numbers, statistics, percentages, metrics, and quantitative data. Present them in a table." },
  { label: "Key Entities",   icon: Hash,        color: "teal",    prompt: "Identify and list the key people, organizations, locations, dates, and concepts mentioned." },
] as const;

type Color = "violet" | "amber" | "emerald" | "blue" | "pink" | "teal";

const btnColor: Record<Color, string> = {
  violet:  "border-[#7C5CFC]/20 hover:border-[#7C5CFC]/50 hover:bg-[#7C5CFC]/10 hover:text-[#8A68FF]",
  amber:   "border-[#F59E0B]/20 hover:border-[#F59E0B]/50 hover:bg-[#F59E0B]/10 hover:text-[#F59E0B]",
  emerald: "border-[#22C55E]/20 hover:border-[#22C55E]/50 hover:bg-[#22C55E]/10 hover:text-[#22C55E]",
  blue:    "border-[#3B82F6]/20 hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/10 hover:text-[#3B82F6]",
  pink:    "border-[#EC4899]/20 hover:border-[#EC4899]/50 hover:bg-[#EC4899]/10 hover:text-[#EC4899]",
  teal:    "border-[#14B8A6]/20 hover:border-[#14B8A6]/50 hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]",
};

const iconColor: Record<Color, string> = {
  violet: "text-[#7C5CFC]", amber: "text-[#F59E0B]", emerald: "text-[#22C55E]",
  blue: "text-[#3B82F6]", pink: "text-[#EC4899]", teal: "text-[#14B8A6]",
};

/* ── Copy button ── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg text-[#5A5C6A] hover:text-[#B6B7C2] hover:bg-white/[0.06] transition-all"
      title="Copy"
    >
      {copied ? <Check size={12} strokeWidth={2} className="text-[#22C55E]" /> : <Copy size={12} strokeWidth={1.8} />}
    </button>
  );
}

/* ── Main ── */
export default function ChatPage() {
  const { selectedDoc, getMessages, addMessage, clearMessages, activeProvider, providers, openSettings } = useStore();

  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showDown, setShowDown] = useState(false);

  const scrollRef   = useRef<HTMLDivElement>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const API           = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
  const messages      = selectedDoc ? getMessages(selectedDoc.id) : [];
  const providerCfg   = providers[activeProvider];
  const providerLabel = providerCfg?.label ?? "Groq";
  const modelLabel    = providerCfg?.model?.split("/").pop() ?? "llama-3.3-70b-versatile";

  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollBottom(); }, [messages.length, loading, scrollBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = () => setShowDown(el.scrollHeight - el.scrollTop > el.clientHeight + 300);
    el.addEventListener("scroll", fn);
    return () => el.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const send = async (override?: string) => {
    if (!selectedDoc) return;
    const text = (override ?? input).trim();
    if (!text) return;

    const context = buildContext(selectedDoc.content, text);
    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

    addMessage(selectedDoc.id, { role: "user", content: text });
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text, context, docName: selectedDoc.name,
          conversationHistory: history,
          provider: activeProvider,
          apiKey: providerCfg?.apiKey ?? "",
          model: providerCfg?.model ?? "llama-3.3-70b-versatile",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      addMessage(selectedDoc.id, { role: "assistant", content: "" });
      const words = data.reply.split(" ");
      let built = "";
      for (let i = 0; i < words.length; i++) {
        built += (i === 0 ? "" : " ") + words[i];
        useStore.getState().updateLastMessage(selectedDoc.id, built);
        await new Promise((r) => setTimeout(r, words.length > 300 ? 6 : 15));
      }
    } catch (err: any) {
      addMessage(selectedDoc.id, {
        role: "assistant",
        content: `**⚠ Error:** ${err.message || "Could not reach the backend."}\n\nMake sure the server is running:\n\`\`\`\ncd backend && node server.js\n\`\`\``,
      });
    }
    setLoading(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)] relative overflow-hidden" style={{ background: "#07070C" }}>

      {/* ── Chat Header ── */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4" style={{ background: "rgba(7,7,12,0.85)", backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.055)", boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset" }}>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.22)", boxShadow: "0 0 20px rgba(124,92,252,0.10)" }}>
            <BrainCircuit size={18} strokeWidth={1.8} className="text-[#7C5CFC]" />
            {loading && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#7C5CFC] rounded-full animate-pulse shadow-lg shadow-[#7C5CFC]/50" />
            )}
          </div>
          <div>
            <h1 className="text-[13px] sm:text-[15px] font-bold text-white tracking-[-0.02em] flex items-center gap-2">
              Document Intelligence
              <span className="text-[9px] uppercase tracking-[0.1em] font-bold bg-[#7C5CFC]/15 text-[#7C5CFC] px-2 py-0.5 rounded-full border border-[#7C5CFC]/20">
                RAG v2
              </span>
            </h1>
            <p className="text-[11px] text-[#5A5C6A] flex items-center gap-1.5 mt-0.5">
              <FileText size={10} strokeWidth={1.8} />
              {selectedDoc
                ? <>{selectedDoc.name}<span className="text-white/10 mx-1">·</span>{selectedDoc.wordCount?.toLocaleString()} words</>
                : "No document selected"
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openSettings}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/[0.10] transition-all group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse shrink-0" />
            <span className="text-[11px] text-[#7E8090] group-hover:text-[#B6B7C2] transition-colors font-medium hidden sm:inline">
              {providerLabel}
            </span>
            <span className="text-white/10 text-[10px] hidden sm:inline">·</span>
            <span className="text-[10px] text-[#5A5C6A] group-hover:text-[#7E8090] transition-colors max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">
              {modelLabel}
            </span>
            <Settings size={10} strokeWidth={1.8} className="text-[#444654] group-hover:text-[#7E8090] transition-colors" />
          </button>

          {messages.length > 0 && selectedDoc && (
            <button
              onClick={() => clearMessages(selectedDoc.id)}
              className="flex items-center gap-1.5 text-[11px] text-[#5A5C6A] hover:text-[#EF4444] px-2.5 py-2 rounded-xl hover:bg-[#EF4444]/[0.06] transition-all border border-transparent hover:border-[#EF4444]/20"
            >
              <Trash2 size={12} strokeWidth={1.8} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Quick Actions Bar ── */}
      <div className="shrink-0 flex gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 overflow-x-auto scrollbar-none" style={{ background: "rgba(7,7,12,0.6)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => send(a.prompt)}
              disabled={!selectedDoc || loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border text-[#7E8090] whitespace-nowrap transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed ${btnColor[a.color as Color]}`}
            >
              <Icon size={12} strokeWidth={1.8} className={iconColor[a.color as Color]} />
              {a.label}
            </button>
          );
        })}
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-10">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center animate-glow-pulse" style={{ background: "rgba(124,92,252,0.10)", border: "1px solid rgba(124,92,252,0.20)", boxShadow: "0 0 40px rgba(124,92,252,0.12)" }}>
              <BrainCircuit size={32} strokeWidth={1.5} className="text-[#7C5CFC]/70" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#B6B7C2] tracking-[-0.02em]">
                {selectedDoc ? "Ready to analyze" : "No document selected"}
              </h3>
              <p className="text-[13px] text-[#5A5C6A] mt-2 max-w-sm leading-relaxed">
                {selectedDoc
                  ? `Ask anything about "${selectedDoc.name.replace(/\.[^/.]+$/, "")}" or use a quick action above.`
                  : "Upload and select a document from the Documents page to start chatting."}
              </p>
            </div>
            {selectedDoc && (
              <div className="grid grid-cols-2 gap-2 mt-2 max-w-sm w-full">
                {[
                  "What is this document about?",
                  "What are the key takeaways?",
                  "Summarize in 5 bullet points",
                  "What problems does this address?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-[12px] text-[#7E8090] hover:text-[#B6B7C2] bg-white/[0.02] hover:bg-[#7C5CFC]/[0.08] border border-white/[0.05] hover:border-[#7C5CFC]/20 px-4 py-3 rounded-xl text-left transition-all duration-200 leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 group animate-fade-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}>

            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
              msg.role === "user"
                ? "bg-gradient-to-br from-[#7C5CFC] to-[#4F46E5] shadow-md shadow-[#7C5CFC]/20"
                : "bg-[#111116] border border-white/[0.07]"
            }`}>
              {msg.role === "user"
                ? <User size={14} strokeWidth={1.8} className="text-white" />
                : <Bot size={14} strokeWidth={1.8} className="text-[#7C5CFC]" />
              }
            </div>

            {/* Bubble */}
            <div className={`flex flex-col gap-1.5 max-w-[88%] sm:max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-3.5 rounded-2xl text-[13px] leading-relaxed ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
              style={msg.role === "user" ? {
                background: "linear-gradient(135deg, rgba(124,92,252,0.18) 0%, rgba(124,92,252,0.10) 100%)",
                border: "1px solid rgba(124,92,252,0.28)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 1px 0 rgba(124,92,252,0.15) inset, 0 4px 20px rgba(0,0,0,0.3)",
                color: "#E8E8F0",
              } : {
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.35)",
                color: "#C4C5D0",
              }}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className={`
                    prose prose-invert prose-sm max-w-none
                    prose-p:leading-relaxed prose-p:mb-3 prose-p:last:mb-0 prose-p:text-[#B6B7C2]
                    prose-headings:font-bold prose-headings:text-white prose-headings:tracking-tight
                    prose-h2:text-[14px] prose-h2:mt-5 prose-h2:mb-2.5
                    prose-h3:text-[13px] prose-h3:mt-4 prose-h3:mb-2
                    prose-ul:pl-4 prose-ul:space-y-1.5 prose-ul:my-2.5
                    prose-ol:pl-4 prose-ol:space-y-1.5 prose-ol:my-2.5
                    prose-li:text-[#B6B7C2] prose-li:marker:text-[#5A5C6A]
                    prose-strong:text-[#E8E8F0] prose-strong:font-semibold
                    prose-em:text-[#7E8090]
                    prose-blockquote:border-l-2 prose-blockquote:border-[#7C5CFC]/40 prose-blockquote:pl-3 prose-blockquote:text-[#7E8090] prose-blockquote:italic prose-blockquote:my-3
                    prose-code:bg-[#7C5CFC]/[0.12] prose-code:text-[#A78BFA] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:border prose-code:border-[#7C5CFC]/[0.18] prose-code:font-normal
                    prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-3
                    prose-hr:border-white/[0.07] prose-hr:my-4
                    prose-table:text-[11px] prose-th:border prose-th:border-white/[0.08] prose-th:px-3 prose-th:py-2 prose-th:text-[#B6B7C2] prose-th:font-semibold prose-td:border prose-td:border-white/[0.06] prose-td:px-3 prose-td:py-2 prose-td:text-[#7E8090]
                    prose-a:text-[#7C5CFC] prose-a:no-underline hover:prose-a:text-[#8A68FF]
                  `}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const lang = /language-(\w+)/.exec(className || "")?.[1];
                          return !inline && lang ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus as any}
                              language={lang}
                              PreTag="div"
                              customStyle={{
                                margin: 0, borderRadius: "0.875rem",
                                border: "1px solid rgba(255,255,255,0.06)",
                                background: "#09090B", fontSize: "11.5px", padding: "1rem",
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>{children}</code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Message actions */}
              {msg.role === "assistant" && msg.content && (
                <div className="flex items-center gap-0.5 pl-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <CopyBtn text={msg.content} />
                  <button
                    onClick={() => send("Please expand on your last answer with more detail and examples.")}
                    className="p-1.5 rounded-lg text-[#5A5C6A] hover:text-[#B6B7C2] hover:bg-white/[0.06] transition-all"
                    title="Expand"
                  >
                    <RefreshCw size={12} strokeWidth={1.8} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
              <Bot size={14} strokeWidth={1.8} className="text-[#7C5CFC]" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC] typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC] typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC] typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll down */}
      {showDown && (
        <button
          onClick={scrollBottom}
          className="absolute bottom-24 right-6 w-9 h-9 rounded-full btn-primary text-white shadow-lg flex items-center justify-center z-10"
        >
          <ChevronDown size={16} strokeWidth={2} />
        </button>
      )}

      {/* ── Input Area ── */}
      <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-5" style={{ background: "rgba(7,7,12,0.92)", backdropFilter: "blur(32px) saturate(180%)", WebkitBackdropFilter: "blur(32px) saturate(180%)", borderTop: "1px solid rgba(255,255,255,0.055)" }}>
        {!selectedDoc && (
          <div className="mb-3 text-[12px] text-[#F59E0B]/80 bg-[#F59E0B]/[0.06] border border-[#F59E0B]/[0.15] rounded-xl px-4 py-2.5 text-center">
            ← Select a document from Documents to enable chat
          </div>
        )}
        <div className="flex items-end gap-3 rounded-2xl px-2 py-2 transition-all duration-200" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              selectedDoc
                ? "Ask anything about your document…  (Shift+Enter for new line)"
                : "Select a document first…"
            }
            disabled={!selectedDoc || loading}
            rows={1}
            className="flex-1 bg-transparent text-[13px] text-[#B6B7C2] placeholder-[#444654] outline-none resize-none px-3 py-2.5 max-h-44 leading-relaxed disabled:cursor-not-allowed"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || !selectedDoc || loading}
            className="shrink-0 mb-0.5 w-9 h-9 rounded-xl btn-primary disabled:opacity-25 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin-smooth" />
              : <Send size={15} strokeWidth={2} className="translate-x-px" />
            }
          </button>
        </div>
        <p className="text-center text-[10px] text-[#444654] mt-2.5">
          Powered by{" "}
          <button onClick={openSettings} className="hover:text-[#7E8090] transition-colors">
            {providerLabel} · {modelLabel}
          </button>
          {" "}· Answers grounded in your document
        </p>
      </div>
    </div>
  );
}
