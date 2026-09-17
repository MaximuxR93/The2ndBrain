"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { API_URL, mapServerDocument } from "@/lib/api";

/** Keep the client document list in sync with the server on every load. */
export default function DocumentsHydrator() {
  const setDocuments = useStore((s) => s.setDocuments);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/documents`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.documents)) {
          setDocuments(data.documents.map(mapServerDocument));
        }
      } catch {
        // Offline / cold backend — local persisted list stays as a fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setDocuments]);

  return null;
}
