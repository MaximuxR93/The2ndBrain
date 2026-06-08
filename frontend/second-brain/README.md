# NeuralDoc — AI Research Suite

> Chat with any document. Powered by Anthropic, OpenAI, Groq, or Google Gemini.

A full-stack AI document assistant built for your resume portfolio — distinctive design, multi-provider AI, and support for every major document format.

---

## Features

- **Multi-provider AI** — Switch between Anthropic Claude, OpenAI GPT-4o, Groq Llama 3, and Google Gemini from the Settings UI. Add your own API keys; they're stored locally and never sent to any server of ours.
- **Universal document parsing** — PDF, DOCX, TXT, CSV, Markdown, XLSX, PPTX, images. Drag-and-drop or click to upload.
- **Context-aware chat** — Relevance-ranked chunking surfaces the right document sections for each query.
- **Smart quick actions** — One-click Summarize, Key Insights, Action Items, Explain Simply.
- **Streaming responses** — Token-by-token word streaming for a fast, alive feel.
- **Persistent library** — Documents and chat history survive page refreshes (Zustand + localStorage).
- **Collapsible sidebar** — Clean navigation that gets out of the way.
- **Configurable behaviour** — Temperature and max tokens sliders in Settings.

---

## Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | Next.js 14, React, TypeScript, Tailwind CSS |
| State     | Zustand (persisted) |
| UI        | Lucide icons, `DM Sans` + `Syne` fonts, `react-markdown`, `react-syntax-highlighter` |
| Backend   | Express.js (Node) |
| AI        | Anthropic SDK · OpenAI SDK · Groq SDK · Google Generative AI |
| Parsing   | `pdf-parse`, `mammoth` |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in at least one API key
```

### 3. Run everything

```bash
# Terminal 1 — Next.js frontend
npm run dev

# Terminal 2 — Express backend
npm run server
```

Or use `npm run dev:all` if you have `concurrently` installed.

Open [http://localhost:3000](http://localhost:3000).

---

## File Structure

```
/
├── app/
│   ├── layout.tsx          ← Root layout (sidebar + topbar)
│   ├── dashboard/page.tsx  ← Overview with stats
│   ├── documents/page.tsx  ← Upload + library
│   ├── chat/page.tsx       ← AI chat interface
│   └── settings/page.tsx   ← API keys + model selector
├── components/
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── Chat.tsx
│   ├── Documents.tsx
│   ├── Dashboard.tsx
│   └── SettingsPage.tsx
├── store/
│   └── useStore.ts         ← Zustand store
├── server.js               ← Multi-provider Express backend
├── globals.css
└── tailwind.config.js
```

---

## Adding a New AI Provider

1. Install the SDK: `npm install <provider-sdk>`
2. Add a `provider` block in `server.js` under the `/chat` route
3. Add the provider config in `components/SettingsPage.tsx` `PROVIDERS` array
4. Done — the UI automatically shows it

---

## Supported File Formats

| Format | Parsing |
|--------|---------|
| PDF    | `pdf-parse` — full text extraction |
| DOCX   | `mammoth` — raw text extraction |
| TXT / MD / CSV | Native UTF-8 buffer read |
| XLSX   | Install `xlsx` package for full support |
| PPTX   | Install `pptx-parser` for full support |
| Images | Metadata shown; add vision API call for OCR |

---

## Design System

- **Primary font**: `DM Sans` (body) + `Syne` (headings)  
- **Monospace**: `JetBrains Mono`
- **Accent**: `#6C63FF` indigo-purple
- **Background**: `#0A0A0B` near-black
- No gradients on UI chrome — only subtle ambient glows
- `rgba` borders at 6–10% opacity for glass-like layering

---

## Deployment

### Frontend (Vercel)
```bash
vercel deploy
# Set NEXT_PUBLIC_API_URL to your backend URL
```

### Backend (Railway / Render / Fly.io)
```bash
# Set all provider API keys as environment variables
# Start command: node server.js
```