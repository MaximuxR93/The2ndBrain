"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { API_URL } from "@/lib/api";
import { Search, FileText, Loader2, ArrowRight } from "lucide-react";

type SearchResult = {
  documentId: string;
  documentName: string;
  text: string;
  score: number;
};

export default function SearchPage() {
  const { documents, selectDoc } = useStore();
  const router = useRouter();

  const [query, setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults((data.results || []).filter((r: SearchResult) => r.score > 0.02));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not reach the backend.";
      setError(msg);
      setResults(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 400);
  };

  const openInChat = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (doc) selectDoc(doc);
    router.push("/chat");
  };

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-[28px] sm:text-[36px] font-bold text-white tracking-[-0.04em] leading-[1.1]">
          Search everything
        </h1>
        <p className="text-[13px] sm:text-[15px] text-[#7E8090] mt-2 leading-[1.6]">
          Semantic search across every document — finds the meaning of what you&apos;re asking, not just the exact words.
        </p>
      </header>

      <div className="relative mb-6">
        <Search size={16} strokeWidth={1.8} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5C6A]" />
        <input
          autoFocus
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What are you looking for?"
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-[14px] text-[#E8E8F0] placeholder-[#444654] outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
        />
        {loading && (
          <Loader2 size={16} strokeWidth={1.8} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7C5CFC] animate-spin-smooth" />
        )}
      </div>

      {error && (
        <div className="text-[12px] text-[#EF4444] rounded-xl px-4 py-3 mb-5"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
          {error}
        </div>
      )}

      {!query && (
        <p className="text-[13px] text-[#5A5C6A] text-center py-16">
          Start typing to search across {documents.length} document{documents.length !== 1 ? "s" : ""}.
        </p>
      )}

      {query && !loading && results?.length === 0 && (
        <p className="text-[13px] text-[#5A5C6A] text-center py-16">
          Nothing matched &quot;{query}&quot; closely enough. Try rephrasing.
        </p>
      )}

      <div className="space-y-3">
        {results?.map((r, i) => (
          <button
            key={`${r.documentId}-${i}`}
            onClick={() => openInChat(r.documentId)}
            className="w-full text-left card-premium p-4 sm:p-5 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#C4C5D0]">
                <FileText size={12} strokeWidth={1.8} className="text-[#7C5CFC]" />
                {r.documentName}
              </div>
              <span className="text-[10px] font-mono text-[#5A5C6A]">{Math.round(r.score * 100)}% match</span>
            </div>
            <p className="text-[13px] text-[#7E8090] leading-relaxed line-clamp-3">{r.text}</p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7C5CFC] group-hover:text-[#9B7DFF] transition-colors mt-3 opacity-0 group-hover:opacity-100">
              Open in chat <ArrowRight size={11} strokeWidth={2} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
