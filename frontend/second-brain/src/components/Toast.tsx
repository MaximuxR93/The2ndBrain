"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toast: Omit<Toast, "id">) => void;
const listeners: Listener[] = [];

export const toast = {
  success: (message: string) => emit("success", message),
  error:   (message: string) => emit("error",   message),
  warning: (message: string) => emit("warning", message),
  info:    (message: string) => emit("info",    message),
};

function emit(type: ToastType, message: string) {
  listeners.forEach((fn) => fn({ type, message }));
}

const STYLES: Record<ToastType, { border: string; bg: string; icon: string; Icon: React.ElementType }> = {
  success: { border: "rgba(34,197,94,0.30)",  bg: "rgba(34,197,94,0.08)",  icon: "#22C55E", Icon: CheckCircle2   },
  error:   { border: "rgba(239,68,68,0.30)",  bg: "rgba(239,68,68,0.08)",  icon: "#EF4444", Icon: XCircle        },
  warning: { border: "rgba(245,158,11,0.30)", bg: "rgba(245,158,11,0.08)", icon: "#F59E0B", Icon: AlertTriangle  },
  info:    { border: "rgba(124,92,252,0.30)", bg: "rgba(124,92,252,0.08)", icon: "#9B7DFF", Icon: Info           },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const fn: Listener = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { ...t, id }]);
      setTimeout(() => remove(id), 4000);
    };
    listeners.push(fn);
    return () => { listeners.splice(listeners.indexOf(fn), 1); };
  }, [remove]);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium text-white animate-fade-up max-w-[340px]"
            style={{
              background: `rgba(7,7,12,0.92)`,
              backdropFilter: "blur(32px) saturate(200%)",
              border: `1px solid ${s.border}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${s.bg} inset`,
            }}
          >
            <s.Icon size={15} strokeWidth={2} style={{ color: s.icon, flexShrink: 0 }} />
            <span className="flex-1 leading-snug text-[#C4C5D0]">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-[#5A5C6A] hover:text-[#B6B7C2] transition-colors shrink-0"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
