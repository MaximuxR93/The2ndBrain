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

/* ════════════════════════════════════════════════════════════
   RAG helpers — runs entirely in the browser
════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════
   Quick actions
════════════════════════════════════════════════════════════ */
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
  violet:  "border-violet-500/25 hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-violet-300",
  amber:   "border-amber-500/25  hover:border-amber-400/60  hover:bg-amber-500/10  hover:text-amber-300",
  emerald: "border-emerald-500/25 hover:border-emerald-400/60 hover:bg-emerald-500/10 hover:text-emerald-300",
  blue:    "border-blue-500/25   hover:border-blue-400/60   hover:bg-blue-500/10   hover:text-blue-300",
  pink:    "border-pink-500/25   hover:border-pink-400/60   hover:bg-pink-500/10   hover:text-pink-300",
  teal:    "border-teal-500/25   hover:border-teal-400/60   hover:bg-teal-500/10   hover:text-teal-300",
};

const iconColor: Record<Color, string> = {
  violet: "text-violet-500", amber: "text-amber-500", emerald: "text-emerald-500",
  blue: "text-blue-500", pink: "text-pink-500", teal: "text-teal-500",
};

/* ════════════════════════════════════════════════════════════
   Copy button
════════════════════════════════════════════════════════════ */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded-md text-zinc-700 hover:text-zinc-300 hover:bg-white/5 transition-all"
      title="Copy"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   Main component
════════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const {
    selectedDoc, getMessages, addMessage, clearMessages,
    activeProvider, providers, openSettings,
  } = useStore();

  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showDown, setShowDown] = useState(false);

  const scrollRef   = useRef<HTMLDivElement>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const API      = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
  const messages = selectedDoc ? getMessages(selectedDoc.id) : [];

  // Active provider info for display + request
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

  // Auto-resize textarea
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
          message: text,
          context,
          docName: selectedDoc.name,
          conversationHistory: history,
          // ── Provider config ──────────────────────────────
          provider: activeProvider,
          apiKey:   providerCfg?.apiKey ?? "",
          model:    providerCfg?.model  ?? "llama-3.3-70b-versatile",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      // Word-by-word streaming simulation
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

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#080810] relative overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/[0.18] flex items-center justify-center">
            <BrainCircuit size={18} className="text-violet-400" />
            {loading && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-violet-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-white flex items-center gap-2">
              Document Intelligence
              <span className="text-[8px] uppercase tracking-widest font-bold bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full border border-violet-500/[0.18]">
                RAG v2
              </span>
            </h1>
            <p className="text-[11px] text-zinc-600 flex items-center gap-1.5 mt-0.5">
              <FileText size={10} />
              {selectedDoc
                ? <>{selectedDoc.name}<span className="text-zinc-800 mx-1">·</span>{selectedDoc.wordCount?.toLocaleString()} words</>
                : "No document selected"
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Provider badge — click to open settings */}
          <button
            onClick={openSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] transition-all group"
            title="Change AI provider"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium">
              {providerLabel}
            </span>
            <span className="text-zinc-800 text-[10px]">·</span>
            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors max-w-[120px] truncate">
              {modelLabel}
            </span>
            <Settings size={10} className="text-zinc-700 group-hover:text-zinc-400 transition-colors ml-0.5" />
          </button>

          {messages.length > 0 && selectedDoc && (
            <button
              onClick={() => clearMessages(selectedDoc.id)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-700 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/5 transition-all"
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="shrink-0 flex gap-1.5 px-5 py-2.5 border-b border-white/[0.04] bg-[#090912] overflow-x-auto scrollbar-none">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => send(a.prompt)}
              disabled={!selectedDoc || loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border text-zinc-500 whitespace-nowrap transition-all disabled:opacity-25 disabled:cursor-not-allowed ${btnColor[a.color as Color]}`}
            >
              <Icon size={12} className={iconColor[a.color as Color]} />
              {a.label}
            </button>
          );
        })}
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/[0.18] flex items-center justify-center">
              <BrainCircuit size={28} className="text-violet-400/70" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-300">
                {selectedDoc ? "Ready to analyze" : "No document selected"}
              </h3>
              <p className="text-[12px] text-zinc-600 mt-1 max-w-xs leading-relaxed">
                {selectedDoc
                  ? `Use a quick action or ask your own question about "${selectedDoc.name.replace(/\.[^/.]+$/, "")}".`
                  : "Upload and select a document from the Documents page."}
              </p>
            </div>
            {selectedDoc && (
              <div className="grid grid-cols-2 gap-2 mt-2 max-w-xs w-full">
                {[
                  "What is this document about?",
                  "What are the key takeaways?",
                  "Summarize in 5 bullet points",
                  "What problems does this address?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-[11px] text-zinc-600 hover:text-violet-300 bg-white/[0.02] hover:bg-violet-500/8 border border-white/[0.05] hover:border-violet-500/20 px-3 py-2.5 rounded-xl text-left transition-all leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 group ${msg.role === "user" ? "flex-row-reverse" : ""}`}>

            {/* Avatar */}
            <div className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center mt-0.5 ${
              msg.role === "user"
                ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                : "bg-[#111118] border border-white/[0.07]"
            }`}>
              {msg.role === "user"
                ? <User size={13} className="text-white" />
                : <Bot size={13} className="text-violet-400" />
              }
            </div>

            {/* Bubble */}
            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600/[0.18] text-zinc-100 border border-violet-500/[0.22] rounded-tr-sm"
                  : "bg-[#111118] text-zinc-200 border border-white/[0.07] rounded-tl-sm shadow-xl shadow-black/20"
              }`}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className={`
                    prose prose-invert prose-sm max-w-none
                    prose-p:leading-relaxed prose-p:mb-3 prose-p:last:mb-0
                    prose-headings:font-semibold prose-headings:text-white prose-headings:tracking-tight
                    prose-h2:text-[14px] prose-h2:mt-5 prose-h2:mb-2.5
                    prose-h3:text-[13px] prose-h3:mt-4 prose-h3:mb-2
                    prose-ul:pl-4 prose-ul:space-y-1.5 prose-ul:my-2.5
                    prose-ol:pl-4 prose-ol:space-y-1.5 prose-ol:my-2.5
                    prose-li:text-zinc-300 prose-li:marker:text-zinc-600
                    prose-strong:text-violet-200 prose-strong:font-semibold
                    prose-em:text-zinc-400
                    prose-blockquote:border-l-2 prose-blockquote:border-violet-500/40 prose-blockquote:pl-3 prose-blockquote:text-zinc-400 prose-blockquote:italic prose-blockquote:my-3
                    prose-code:bg-violet-500/[0.12] prose-code:text-violet-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:border prose-code:border-violet-500/[0.18] prose-code:font-normal
                    prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-3
                    prose-hr:border-white/[0.07] prose-hr:my-4
                    prose-table:text-[11px] prose-th:border prose-th:border-white/[0.08] prose-th:px-3 prose-th:py-2 prose-th:text-zinc-300 prose-th:font-semibold prose-td:border prose-td:border-white/[0.06] prose-td:px-3 prose-td:py-2 prose-td:text-zinc-400
                    prose-a:text-violet-400 prose-a:no-underline hover:prose-a:text-violet-300
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
                                margin: 0, borderRadius: "0.75rem",
                                border: "1px solid rgba(255,255,255,0.06)",
                                background: "#080810", fontSize: "11.5px", padding: "0.9rem",
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

              {/* Hover actions */}
              {msg.role === "assistant" && msg.content && (
                <div className="flex items-center gap-0.5 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyBtn text={msg.content} />
                  <button
                    onClick={() => send("Please expand on your last answer with more detail and examples.")}
                    className="p-1 rounded-md text-zinc-700 hover:text-zinc-300 hover:bg-white/5 transition-all"
                    title="Expand"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-xl bg-[#111118] border border-white/[0.07] flex items-center justify-center mt-0.5">
              <Bot size={13} className="text-violet-400" />
            </div>
            <div className="bg-[#111118] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 140, 280].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll down button */}
      {showDown && (
        <button
          onClick={scrollBottom}
          className="absolute bottom-[5.5rem] right-5 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg flex items-center justify-center transition-colors z-10"
        >
          <ChevronDown size={15} />
        </button>
      )}

      {/* ── Input area ── */}
      <div className="shrink-0 px-5 py-4 border-t border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl">
        {!selectedDoc && (
          <div className="mb-3 text-[11px] text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/[0.15] rounded-xl px-4 py-2 text-center">
            ← Select a document from Documents to enable chat
          </div>
        )}
        <div className="flex items-end gap-2.5 bg-[#111118] border border-white/[0.07] rounded-2xl px-1 py-1 focus-within:border-violet-500/40 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all">
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
            className="flex-1 bg-transparent text-[13px] text-zinc-200 placeholder-zinc-700 outline-none resize-none px-3 py-2.5 max-h-44 leading-relaxed disabled:cursor-not-allowed"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || !selectedDoc || loading}
            className="shrink-0 mb-1 mr-0.5 w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-25 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95 shadow-md shadow-violet-900/30"
          >
            {loading
              ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              : <Send size={14} className="translate-x-px" />
            }
          </button>
        </div>
        {/* Dynamic provider footer */}
        <p className="text-center text-[10px] text-zinc-800 mt-2">
          Powered by <button onClick={openSettings} className="hover:text-zinc-600 transition-colors">{providerLabel} · {modelLabel}</button> · Answers grounded in your document
        </p>
      </div>
    </div>
  );
}