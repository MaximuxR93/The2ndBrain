"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import {
  UploadCloud, FileText, CheckCircle2,
  Loader2, Trash2, MessageSquare, Clock, Hash, AlertTriangle,
} from "lucide-react";

const ALLOWED = [".pdf", ".docx", ".txt", ".csv", ".md"] as const;
const MAX_MB   = 20;

const EXT_INLINE: Record<string, { text: string; bg: string; border: string }> = {
  ".pdf":  { text: "#EF4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.20)" },
  ".docx": { text: "#3B82F6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.20)" },
  ".txt":  { text: "#7E8090", bg: "rgba(126,128,144,0.10)",border: "rgba(126,128,144,0.20)" },
  ".csv":  { text: "#22C55E", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.20)" },
  ".md":   { text: "#F59E0B", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)" },
};

function getExt(name: string) { return name.slice(name.lastIndexOf(".")).toLowerCase(); }
function fmtDate(ts: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
}
function fmtWords(n?: number) {
  if (!n) return "0";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function DocumentsPage() {
  // NOTE: `content` is no longer part of the Document shape anywhere in the
  // frontend — the server holds document text + chunks + embeddings.
  //
  // Document hydration also no longer happens here — <DocumentsHydrator />
  // in the root layout fetches GET /documents once, globally, on app load,
  // so every page (including Dashboard) sees populated documents without
  // each page re-fetching independently.
  const { documents, addDocument, selectDoc, selectedDoc, removeDocument } = useStore();
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error,    setError]    = useState("");
  const [progress, setProgress] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

  const processFile = useCallback(async (file: File) => {
    setError(""); setProgress("");
    const e = getExt(file.name);
    if (!ALLOWED.includes(e as any)) { setError(`"${e}" not supported. Use: ${ALLOWED.join(", ")}`); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File exceeds ${MAX_MB} MB limit.`); return; }
    if (documents.some((d) => d.name === file.name)) { setError(`"${file.name}" is already uploaded.`); return; }

    setLoading(true); setProgress("Uploading…");
    const form = new FormData();
    form.append("file", file);

    try {
      const res  = await fetch(`${API}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Backend now does chunking + embedding server-side and returns metadata
      // only — no raw `text` field anymore, and nothing left for the client to index.
      setProgress("Indexed");
      addDocument({
        id: data.id,
        name: data.name,
        wordCount: data.wordCount,
        charCount: data.charCount,
        fileType: data.fileType,
        uploadedAt: data.uploadedAt,
      });
      toast.success(`"${file.name}" uploaded — ${data.wordCount.toLocaleString()} words, ${data.chunkCount} chunks embedded`);
      setProgress("");
    } catch (err: any) {
      const msg = err.message || "Upload failed. Is the backend running?";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  }, [documents, addDocument, API]);

  const handleDelete = useCallback(async (doc: { id: string; name: string }) => {
    try {
      const res = await fetch(`${API}/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete on server");
      removeDocument(doc.id);
      toast.info(`"${doc.name}" removed`);
    } catch (err: any) {
      toast.error(err.message || "Could not delete document");
    }
  }, [API, removeDocument]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

      {/* ── Header ── */}
      <header className="mb-6 sm:mb-8 opacity-0 animate-fade-up delay-0">
        <h1 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-white tracking-[-0.04em] leading-[1.1]">
          Documents
        </h1>
        <p className="text-[13px] sm:text-[15px] lg:text-[16px] text-[#7E8090] mt-2 sm:mt-3 leading-[1.6]">
          Documents are parsed, chunked, and embedded server-side — this device is just a view into it.
        </p>
      </header>

      {/* ── Drop Zone ── */}
      <div className="opacity-0 animate-fade-up delay-75 mb-4">
        <label
          htmlFor="file-input"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
          className={`flex flex-col items-center justify-center w-full h-40 sm:h-48 lg:h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 select-none relative overflow-hidden ${
            loading  ? "opacity-50 pointer-events-none border-white/[0.06]" :
            dragOver ? "border-[#7C5CFC]/50" :
                       "border-white/[0.07] hover:border-[#7C5CFC]/35"
          }`}
          style={dragOver
            ? { background: "rgba(124,92,252,0.06)", backdropFilter: "blur(20px)" }
            : { background: "rgba(255,255,255,0.02)", backdropFilter: "blur(16px)" }}
        >
          <div className="flex flex-col items-center gap-3 sm:gap-4 pointer-events-none px-4 text-center">
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#7C5CFC] animate-spin-smooth" strokeWidth={1.5} />
                <p className="text-[12px] sm:text-[13px] text-[#7E8090]">{progress}</p>
              </>
            ) : (
              <>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300"
                  style={dragOver
                    ? { background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.30)" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <UploadCloud size={20} strokeWidth={1.5} className={dragOver ? "text-[#9B7DFF]" : "text-[#5A5C6A]"} />
                </div>
                <div>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#7E8090]">
                    <span className="text-[#9B7DFF]">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-[11px] sm:text-[12px] text-[#5A5C6A] mt-1">
                    PDF · DOCX · TXT · CSV · MD · Max {MAX_MB} MB
                  </p>
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
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start sm:items-center gap-2.5 text-[12px] text-[#EF4444] rounded-xl px-4 py-3 mb-5 sm:mb-6 animate-fade-in"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <AlertTriangle size={14} strokeWidth={1.8} className="shrink-0 mt-0.5 sm:mt-0" /> {error}
        </div>
      )}

      {/* ── File List ── */}
      <div className="mt-6 sm:mt-8 opacity-0 animate-fade-up delay-150">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-[16px] sm:text-[20px] font-bold text-white tracking-[-0.03em] flex items-center gap-2 sm:gap-3">
              Your Files
              <span className="text-[11px] sm:text-[12px] font-bold text-[#7E8090] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg tabular-nums"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {documents.length}
              </span>
            </h2>
            {documents.length > 0 && (
              <p className="text-[11px] sm:text-[13px] text-[#5A5C6A] mt-1">
                {documents.reduce((s, d) => s + (d.wordCount || 0), 0).toLocaleString()} total words indexed
              </p>
            )}
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="card-premium flex flex-col items-center justify-center py-14 sm:py-20 text-center px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-5"
              style={{ background: "rgba(124,92,252,0.10)", border: "1px solid rgba(124,92,252,0.20)" }}>
              <FileText size={22} strokeWidth={1.5} className="text-[#7C5CFC]/60" />
            </div>
            <p className="text-[14px] sm:text-[15px] font-bold text-[#C4C5D0] tracking-[-0.02em]">No documents yet</p>
            <p className="text-[12px] sm:text-[13px] text-[#5A5C6A] mt-2">Upload your first file above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {documents.map((doc) => {
              const selected = selectedDoc?.id === doc.id;
              const e = getExt(doc.name);
              const c = EXT_INLINE[e] || EXT_INLINE[".txt"];
              return (
                <div key={doc.id} className="card-premium p-4 sm:p-5"
                  style={selected ? { background: "rgba(124,92,252,0.10)", boxShadow: "0 0 30px rgba(124,92,252,0.12), 0 8px 32px rgba(0,0,0,0.4)" } : {}}>

                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-2.5 rounded-xl shrink-0"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      <FileText size={14} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] sm:text-[13px] font-bold text-[#C4C5D0] truncate leading-tight" title={doc.name}>
                        {doc.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-[10px] text-[#5A5C6A]">
                        <span className="flex items-center gap-1"><Hash size={9} strokeWidth={1.8} />{fmtWords(doc.wordCount)} words</span>
                        <span className="flex items-center gap-1 hidden sm:flex"><Clock size={9} strokeWidth={1.8} />{fmtDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                    {selected && <CheckCircle2 size={15} strokeWidth={1.8} className="text-[#7C5CFC] shrink-0 mt-0.5" />}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 sm:pt-4 border-t border-white/[0.05]">
                    <button onClick={() => selectDoc(doc)}
                      className={`flex-1 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-[12px] font-bold transition-all duration-200 ${
                        selected
                          ? "btn-primary text-white"
                          : "text-[#7E8090] hover:text-[#C4C5D0] hover:bg-white/[0.08]"
                      }`}
                      style={!selected ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" } : {}}>
                      {selected ? "✓ Selected" : "Select"}
                    </button>
                    <button onClick={() => { selectDoc(doc); router.push("/chat"); }}
                      className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-semibold text-[#7E8090] hover:text-[#9B7DFF] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all border border-transparent hover:border-[#7C5CFC]/20 hover:bg-[#7C5CFC]/[0.08]">
                      <MessageSquare size={12} strokeWidth={1.8} />
                      <span className="hidden sm:inline">Chat</span>
                    </button>
                    <button onClick={() => handleDelete(doc)}
                      className="p-1.5 sm:p-2 rounded-xl text-[#444654] hover:text-[#EF4444] transition-all border border-transparent hover:border-[#EF4444]/20 hover:bg-[#EF4444]/[0.07]"
                      title="Delete">
                      <Trash2 size={13} strokeWidth={1.8} />
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