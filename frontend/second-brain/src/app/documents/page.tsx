"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import {
  UploadCloud, FileText, CheckCircle2, ArrowRight,
  Loader2, Trash2, MessageSquare, Clock, Hash, AlertTriangle,
} from "lucide-react";

const ALLOWED = [".pdf", ".docx", ".txt", ".csv", ".md"] as const;
const MAX_MB   = 20;

const EXT_STYLE: Record<string, string> = {
  ".pdf":  "bg-red-500/10    text-red-400    border-red-500/20",
  ".docx": "bg-blue-500/10   text-blue-400   border-blue-500/20",
  ".txt":  "bg-zinc-500/10   text-zinc-400   border-zinc-500/20",
  ".csv":  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ".md":   "bg-amber-500/10  text-amber-400  border-amber-500/20",
};

function ext(name: string) { return name.slice(name.lastIndexOf(".")).toLowerCase(); }
function fmtDate(ts: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
}
function fmtWords(n?: number) {
  if (!n) return "0";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function DocumentsPage() {
  const { documents, addDocument, selectDoc, selectedDoc, removeDocument } = useStore();
  const router = useRouter();
  const [loading,   setLoading]   = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [error,     setError]     = useState("");
  const [progress,  setProgress]  = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

  const processFile = useCallback(async (file: File) => {
    setError("");
    setProgress("");

    const e = ext(file.name);
    if (!ALLOWED.includes(e as any)) { setError(`"${e}" not supported. Use: ${ALLOWED.join(", ")}`); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File exceeds ${MAX_MB} MB limit.`); return; }
    if (documents.some((d) => d.name === file.name)) { setError(`"${file.name}" is already uploaded.`); return; }

    setLoading(true);
    setProgress("Uploading…");

    const form = new FormData();
    form.append("file", file);

    try {
      const res  = await fetch(`${API}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const content = (data.text || "").trim();
      if (!content) { setError("No readable text found in this file."); setLoading(false); setProgress(""); return; }

      setProgress("Indexing…");
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      addDocument({
        id:        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name:      file.name,
        content,            // ← full content, never truncated
        wordCount,
        charCount: content.length,
        fileType:  e,
      });
      setProgress("");
    } catch (err: any) {
      setError(err.message || "Upload failed. Is the backend running?");
    }

    setLoading(false);
  }, [documents, addDocument, API]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* Header */}
      <header className="mb-7">
        <h1 className="text-2xl font-bold text-white tracking-tight">Documents</h1>
        <p className="text-zinc-600 text-[13px] mt-1">
          Full document content is stored and used for RAG retrieval — no truncation.
        </p>
      </header>

      {/* Drop zone */}
      <label
        htmlFor="file-input"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        className={`flex flex-col items-center justify-center w-full h-44 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 mb-3 select-none ${
          loading   ? "opacity-50 pointer-events-none border-white/10 bg-white/[0.01]" :
          dragOver  ? "border-violet-500/70 bg-violet-500/[0.07] shadow-[0_0_40px_rgba(139,92,246,0.12)]" :
                      "border-white/[0.08] bg-white/[0.01] hover:border-violet-500/40 hover:bg-violet-500/[0.04]"
        }`}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          {loading ? (
            <>
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
              <p className="text-[13px] text-zinc-500">{progress}</p>
            </>
          ) : (
            <>
              <div className={`p-3.5 rounded-2xl border transition-all ${dragOver ? "bg-violet-500/15 border-violet-500/30" : "bg-white/[0.04] border-white/[0.07]"}`}>
                <UploadCloud size={22} className={dragOver ? "text-violet-400" : "text-zinc-600"} />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-zinc-400">
                  <span className="text-violet-400 font-semibold">Click to upload</span> or drag & drop
                </p>
                <p className="text-[11px] text-zinc-700 mt-1">PDF · DOCX · TXT · CSV · MD · Max {MAX_MB} MB</p>
              </div>
            </>
          )}
        </div>
        <input id="file-input" type="file" className="hidden"
          accept={ALLOWED.join(",")}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
          disabled={loading}
        />
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/[0.07] border border-red-500/[0.18] rounded-xl px-4 py-2.5 mb-5">
          <AlertTriangle size={13} className="shrink-0" /> {error}
        </div>
      )}

      {/* List */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
            Your Files
            <span className="px-2 py-0.5 bg-white/[0.04] text-zinc-600 rounded-full border border-white/[0.06] font-semibold tabular-nums">
              {documents.length}
            </span>
          </h2>
          {documents.length > 0 && (
            <p className="text-[11px] text-zinc-700">
              {documents.reduce((s, d) => s + (d.wordCount || 0), 0).toLocaleString()} total words indexed
            </p>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 border border-dashed border-white/[0.06] rounded-2xl text-center">
            <FileText size={28} className="text-zinc-800 mb-3" />
            <p className="text-[13px] font-medium text-zinc-600">No documents yet</p>
            <p className="text-[11px] text-zinc-700 mt-1">Upload your first file above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((doc) => {
              const selected = selectedDoc?.id === doc.id;
              const e = ext(doc.name);
              return (
                <div
                  key={doc.id}
                  className={`group p-4 rounded-2xl border transition-all duration-200 ${
                    selected
                      ? "bg-violet-500/[0.07] border-violet-500/[0.25] shadow-[0_0_24px_rgba(139,92,246,0.07)]"
                      : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-3.5">
                    <div className={`p-2 rounded-xl border shrink-0 ${EXT_STYLE[e] || EXT_STYLE[".txt"]}`}>
                      <FileText size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] font-semibold text-zinc-200 truncate leading-tight"
                        title={doc.name}
                      >
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-700">
                        <span className="flex items-center gap-1"><Hash size={9} />{fmtWords(doc.wordCount)} words</span>
                        <span className="flex items-center gap-1"><Clock size={9} />{fmtDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                    {selected && <CheckCircle2 size={15} className="text-violet-400 shrink-0 mt-0.5" />}
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05]">
                    <button
                      onClick={() => selectDoc(doc)}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                        selected
                          ? "bg-violet-600 text-white shadow-sm shadow-violet-900/30"
                          : "bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200"
                      }`}
                    >
                      {selected ? "✓ Selected" : "Select"}
                    </button>
                    <button
                      onClick={() => { selectDoc(doc); router.push("/chat"); }}
                      className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-violet-300 px-3 py-1.5 rounded-xl hover:bg-violet-500/8 transition-colors"
                    >
                      <MessageSquare size={12} /> Chat
                    </button>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="p-1.5 rounded-xl text-zinc-800 hover:text-red-400 hover:bg-red-500/[0.07] transition-all"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}