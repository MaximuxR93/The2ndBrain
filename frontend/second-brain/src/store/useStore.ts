import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Document {
  id: string;
  name: string;
  content: string;
  wordCount: number;
  charCount: number;
  fileType: string;
  uploadedAt: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type ProviderId = "groq" | "openai" | "anthropic" | "openrouter" | "grok";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  apiKey: string;
  model: string;
  defaultModel: string;
  baseUrl: string;
  enabled: boolean;
}

export const PROVIDER_DEFAULTS: Record<ProviderId, Omit<ProviderConfig, "apiKey" | "enabled">> = {
  groq: {
    id: "groq",
    label: "Groq",
    model: "llama-3.3-70b-versatile",
    defaultModel: "llama-3.3-70b-versatile",
    baseUrl: "https://api.groq.com/openai/v1",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    model: "gpt-4o",
    defaultModel: "gpt-4o",
    baseUrl: "https://api.openai.com/v1",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    model: "claude-sonnet-4-20250514",
    defaultModel: "claude-sonnet-4-20250514",
    baseUrl: "https://api.anthropic.com/v1",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    model: "meta-llama/llama-3.3-70b-instruct",
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
    baseUrl: "https://openrouter.ai/api/v1",
  },
  grok: {
    id: "grok",
    label: "Grok (xAI)",
    model: "grok-3-mini",
    defaultModel: "grok-3-mini",
    baseUrl: "https://api.x.ai/v1",
  },
};

const buildDefaultProviders = (): Record<ProviderId, ProviderConfig> =>
  Object.fromEntries(
    Object.entries(PROVIDER_DEFAULTS).map(([id, defaults]) => [
      id,
      { ...defaults, apiKey: "", enabled: id === "groq" },
    ])
  ) as Record<ProviderId, ProviderConfig>;

interface Store {
  documents: Document[];
  selectedDoc: Document | null;
  messages: Record<string, Message[]>;

  // Settings
  activeProvider: ProviderId;
  providers: Record<ProviderId, ProviderConfig>;
  settingsOpen: boolean;

  addDocument:        (doc: Omit<Document, "uploadedAt">) => void;
  removeDocument:     (id: string) => void;
  selectDoc:          (doc: Document | null) => void;
  getMessages:        (docId: string) => Message[];
  addMessage:         (docId: string, msg: Omit<Message, "timestamp">) => void;
  updateLastMessage:  (docId: string, content: string) => void;
  clearMessages:      (docId: string) => void;

  // Settings actions
  setActiveProvider:  (id: ProviderId) => void;
  updateProvider:     (id: ProviderId, patch: Partial<ProviderConfig>) => void;
  resetProvider:      (id: ProviderId) => void;
  openSettings:       () => void;
  closeSettings:      () => void;
  getActiveProvider:  () => ProviderConfig;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      documents: [],
      selectedDoc: null,
      messages: {},

      activeProvider: "groq",
      providers: buildDefaultProviders(),
      settingsOpen: false,

      addDocument: (doc) =>
        set((s) => ({
          documents: [
            { ...doc, uploadedAt: Date.now() },
            ...s.documents.filter((d) => d.id !== doc.id),
          ],
        })),

      removeDocument: (id) =>
        set((s) => {
          const msgs = { ...s.messages };
          delete msgs[id];
          return {
            documents: s.documents.filter((d) => d.id !== id),
            selectedDoc: s.selectedDoc?.id === id ? null : s.selectedDoc,
            messages: msgs,
          };
        }),

      selectDoc: (doc) => set({ selectedDoc: doc }),

      getMessages: (docId) => get().messages[docId] || [],

      addMessage: (docId, msg) =>
        set((s) => ({
          messages: {
            ...s.messages,
            [docId]: [...(s.messages[docId] || []), { ...msg, timestamp: Date.now() }],
          },
        })),

      updateLastMessage: (docId, content) =>
        set((s) => {
          const msgs = [...(s.messages[docId] || [])];
          if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          return { messages: { ...s.messages, [docId]: msgs } };
        }),

      clearMessages: (docId) =>
        set((s) => ({ messages: { ...s.messages, [docId]: [] } })),

      setActiveProvider: (id) => set({ activeProvider: id }),

      updateProvider: (id, patch) =>
        set((s) => ({
          providers: {
            ...s.providers,
            [id]: { ...s.providers[id], ...patch },
          },
        })),

      resetProvider: (id) =>
        set((s) => ({
          providers: {
            ...s.providers,
            [id]: {
              ...PROVIDER_DEFAULTS[id],
              apiKey: s.providers[id].apiKey,
              enabled: s.providers[id].enabled,
            },
          },
        })),

      openSettings:  () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),

      getActiveProvider: () => {
        const s = get();
        return s.providers[s.activeProvider];
      },
    }),
    {
      name: "secondbrain-v3",
      partialize: (s) => ({
        documents:      s.documents,
        selectedDoc:    s.selectedDoc,
        messages:       s.messages,
        activeProvider: s.activeProvider,
        providers:      s.providers,
      }),
    }
  )
);