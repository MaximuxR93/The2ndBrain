<div align="center">

<img src="assets/screen5.png" alt="SecondBrain Banner" width="100%" style="border-radius: 12px;" />

<br />
<br />

<h1>🧠 SecondBrain</h1>

<p><strong>Chat with any document. Powered by multi-provider AI.</strong></p>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-the2nd--brain--28jk.vercel.app-6C63FF?style=for-the-badge&logoColor=white)](https://the2nd-brain-28jk.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-Node.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

<br />

> **Upload any document. Ask anything. Get instant AI-powered answers — grounded in your content.**

<br />

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Multi-format Upload** | PDF, DOCX, TXT, CSV, Markdown |
| 🤖 **Multi-provider AI** | Groq, OpenAI, Anthropic, OpenRouter, Grok (xAI) |
| 🔍 **RAG Engine** | Browser-side retrieval-augmented generation — no vector DB needed |
| ⚡ **Streaming Replies** | Word-by-word animated responses |
| 🧩 **Quick Actions** | Summarize, Key Insights, Extract Skills, Action Items, Data & Stats |
| 🔑 **Bring Your Own Key** | Switch AI providers and models from the settings panel |
| 💾 **Persistent Storage** | Chat history and documents saved locally via Zustand |
| 🌑 **Dark UI** | Sleek, minimal design built for focus |

---

## 🖥️ Screenshots

<div align="center">
<table>
  <tr>
    <td><img src="assets/screen1.png" width="400" alt="Dashboard" /></td>
    <td><img src="assets/screen2.png" width="400" alt="Chat" /></td>
  </tr>
  <tr>
    <td align="center"><em>Dashboard</em></td>
    <td align="center"><em>Document Chat</em></td>
  </tr>
  <tr>
    <td><img src="assets/screen3.png" width="400" alt="Upload" /></td>
    <td><img src="assets/screen4.png" width="400" alt="Settings" /></td>
  </tr>
  <tr>
    <td align="center"><em>Document Upload</em></td>
    <td align="center"><em>API Settings</em></td>
  </tr>
</table>
</div>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Next.js)                 │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Documents│  │   Chat   │  │ RAG Engine (JS)  │  │
│  │  Upload  │  │    UI    │  │ chunk → rank →   │  │
│  └──────────┘  └──────────┘  │ inject context   │  │
│                               └──────────────────┘  │
│              Zustand (persist)                       │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│                Express Backend (Node.js)              │
│                                                      │
│  POST /upload   →  pdf-parse / mammoth / raw text   │
│  POST /chat     →  Provider Router                  │
│                        ├── Groq (default)           │
│                        ├── OpenAI                   │
│                        ├── Anthropic                │
│                        ├── OpenRouter               │
│                        └── Grok (xAI)               │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Groq API key](https://console.groq.com/keys) (free)

### 1. Clone the repo
```bash
git clone https://github.com/MaximuxR93/The2ndBrain.git
cd The2ndBrain
```

### 2. Start the backend
```bash
cd backend
cp .env.example .env       # add your GROQ_API_KEY
npm install
node server.js
```

### 3. Start the frontend
```bash
cd frontend/second-brain
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Environment Variables

**Backend** (`backend/.env`):
```env
GROQ_API_KEY=your_groq_key_here
```

**Frontend** (`frontend/second-brain/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🤖 Supported AI Providers

| Provider | Models | Key Required |
|---|---|---|
| **Groq** | Llama 3.3 70B, Mixtral, Gemma | Yes (free) |
| **OpenAI** | GPT-4o, GPT-4o mini, GPT-3.5 | Yes |
| **Anthropic** | Claude Sonnet, Opus, Haiku | Yes |
| **OpenRouter** | 100+ models | Yes |
| **Grok (xAI)** | Grok-3, Grok-3 Mini | Yes |

Users can bring their own API keys via the in-app settings panel — no config files needed.

---

## 🛠️ Tech Stack

**Frontend**
- [Next.js 14](https://nextjs.org/) — App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) — state + persistence
- [React Markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)
- [Prism.js](https://prismjs.com/) — syntax highlighting

**Backend**
- [Express.js](https://expressjs.com/)
- [Groq SDK](https://github.com/groq/groq-typescript)
- [OpenAI SDK](https://github.com/openai/openai-node) — used for all OpenAI-compatible providers
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [pdf-parse](https://www.npmjs.com/package/pdf-parse), [mammoth](https://www.npmjs.com/package/mammoth) — document parsing
- [multer](https://www.npmjs.com/package/multer) — file upload

---

## 📦 Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |

---

## 📄 License

MIT © [MaximuxR93](https://github.com/MaximuxR93)

---

<div align="center">

**Built with ❤️ and way too much Llama 3.3**

[![Live Demo](https://img.shields.io/badge/🚀%20Try%20it%20Live-6C63FF?style=for-the-badge)](https://the2nd-brain-28jk.vercel.app/)

</div>
