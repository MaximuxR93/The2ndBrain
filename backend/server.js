require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const multer      = require("multer");
const { randomUUID } = require("crypto");
const pdfParse    = require("pdf-parse");
const mammoth     = require("mammoth");
const rateLimit   = require("express-rate-limit");
const OpenAI      = require("openai");
const Anthropic   = require("@anthropic-ai/sdk");

const db  = require("./db");
const rag = require("./rag");
const { buildGraph } = require("./graph");

const app = express();

// ── CORS: locked to your actual frontend(s), not "*" ─────────
// FRONTEND_ORIGIN accepts a comma-separated list so you can allow both
// your production Vercel domain and preview-deployment URLs at once, e.g.:
// FRONTEND_ORIGIN=https://secondbrain.vercel.app,https://secondbrain-git-dev-you.vercel.app
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin(origin, callback) {
    // Allow no-origin requests (curl, server-to-server health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
app.use(express.json({ limit: "10mb" }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Rate limiting on the expensive routes ───────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — slow down and try again in a minute." },
});
app.use(["/chat", "/search", "/upload"], aiLimiter);

// ── File upload (memory, max 20 MB) ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ── Provider factory ─────────────────────────────────────────
// SECURITY: no apiKey is ever accepted from the client anymore.
// Every key comes from server-side env vars only.
const ENV_KEYS = {
  groq:       process.env.GROQ_API_KEY,
  openai:     process.env.OPENAI_API_KEY,
  openrouter: process.env.OPENROUTER_API_KEY,
  grok:       process.env.XAI_API_KEY,
  anthropic:  process.env.ANTHROPIC_API_KEY,
};

const BASE_URLS = {
  groq:       "https://api.groq.com/openai/v1",
  openai:     "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  grok:       "https://api.x.ai/v1",
};

// ── Groq model allowlist / fallback ──────────────────────────
// llama-3.3-70b-versatile, llama-3.1-8b-instant, and gemma2-9b-it have all
// been decommissioned by Groq. This is the current default + fallback chain
// so a single deprecated model name can never take the whole route down again.
const GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b";
const GROQ_FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
];
const KNOWN_DEPRECATED_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "gemma-7b-it",
]);

function requireKey(provider) {
  const key = ENV_KEYS[provider];
  if (!key) throw new Error(`Server is not configured with an API key for "${provider}".`);
  return key;
}

/**
 * Streams a chat completion, invoking onToken(text) for each piece as it
 * arrives. Returns the full assembled reply at the end.
 *
 * For provider === "groq", if the requested model is a known-deprecated
 * model (or Groq rejects it as decommissioned/unavailable at request time),
 * this automatically retries with the next model in GROQ_FALLBACK_MODELS
 * instead of surfacing a 404 to the caller.
 */
async function streamProvider({ provider, model, messages, onToken }) {
  if (provider === "anthropic") {
    const client = new Anthropic.Anthropic({ apiKey: requireKey("anthropic") });
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const convo  = messages.filter((m) => m.role !== "system");

    let full = "";
    await new Promise((resolve, reject) => {
      const stream = client.messages.stream({ model, max_tokens: 2048, system, messages: convo });
      stream.on("text", (text) => { full += text; onToken(text); });
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    return full;
  }

  const client = new OpenAI.OpenAI({ apiKey: requireKey(provider), baseURL: BASE_URLS[provider] });

  const candidates = provider === "groq"
    ? [...new Set([model, ...GROQ_FALLBACK_MODELS])].filter((m) => !KNOWN_DEPRECATED_MODELS.has(m))
    : [model];

  let lastErr;
  for (const candidateModel of candidates) {
    try {
      const completion = await client.chat.completions.create({
        model: candidateModel,
        max_tokens: 2048,
        temperature: 0.35,
        top_p: 0.9,
        messages,
        stream: true,
      });

      let full = "";
      for await (const part of completion) {
        const token = part.choices?.[0]?.delta?.content ?? "";
        if (token) { full += token; onToken(token); }
      }
      if (candidateModel !== model) {
        console.warn(`[streamProvider] "${model}" unavailable — served with fallback "${candidateModel}" instead.`);
      }
      return full;
    } catch (err) {
      const isModelError = err?.status === 404 || /decommission|does not exist|no longer supported/i.test(err?.message || "");
      if (!isModelError) throw err; // don't mask real errors (auth, rate limit, etc.)
      lastErr = err;
      console.warn(`[streamProvider] model "${candidateModel}" unavailable, trying next fallback...`);
    }
  }
  throw lastErr;
}

// ── Health ────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ status: "ok", version: "4.0.1", info: "SecondBrain backend — real embeddings, persisted storage" })
);

// ── UPLOAD: parse → chunk → embed → persist ──────────────────
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file attached" });

  const name = req.file.originalname.toLowerCase();
  let text = "";

  try {
    if (name.endsWith(".pdf")) {
      text = (await pdfParse(req.file.buffer)).text;
    } else if (name.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer: req.file.buffer })).value;
    } else if ([".txt", ".csv", ".md"].some((e) => name.endsWith(e))) {
      text = req.file.buffer.toString("utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file type. Use PDF, DOCX, TXT, CSV, or MD." });
    }

    const cleaned = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .replace(/[ \t]{3,}/g, "  ")
      .trim();

    if (!cleaned) return res.status(422).json({ error: "No readable text found in the file." });

    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    const ext = name.slice(name.lastIndexOf("."));
    const docId = randomUUID();
    const uploadedAt = Date.now();

    // Chunk + embed. This is the part that actually makes it "RAG."
    const rawChunks = rag.chunkText(cleaned);
    const vectors = await rag.embedBatch(rawChunks);

    db.insertDocumentWithChunks(
      {
        id: docId,
        name: req.file.originalname,
        content: cleaned,
        word_count: wordCount,
        char_count: cleaned.length,
        file_type: ext,
        uploaded_at: uploadedAt,
      },
      rawChunks.map((text, i) => ({
        id: randomUUID(),
        document_id: docId,
        chunk_index: i,
        text,
        embedding: JSON.stringify(vectors[i]),
      }))
    );

    console.log(`[upload] "${req.file.originalname}" → ${wordCount} words, ${rawChunks.length} chunks embedded`);

    return res.json({
      id: docId,
      name: req.file.originalname,
      wordCount,
      charCount: cleaned.length,
      fileType: ext,
      uploadedAt,
      chunkCount: rawChunks.length,
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return res.status(500).json({ error: `Failed to process file: ${err.message}` });
  }
});

// ── List / delete documents (server is now the source of truth) ──
app.get("/documents", (_req, res) => {
  res.json({ documents: db.listDocuments() });
});

app.delete("/documents/:id", (req, res) => {
  db.deleteDocument(req.params.id);
  res.json({ ok: true });
});

app.get("/graph", (_req, res) => {
  try {
    const docs = db.listDocumentsFull();
    res.json(buildGraph(docs));
  } catch (err) {
    console.error("[graph] error:", err);
    res.status(500).json({ error: err.message || "Graph failed" });
  }
});

// ── SEARCH: real semantic search across one or all documents ──
app.post("/search", async (req, res) => {
  const { query, docId } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: "query is required" });

  try {
    const chunks = docId ? db.getChunksForDocument(docId) : db.getAllChunks();
    const top = (await rag.retrieveTopChunks(chunks, query, 8)).filter((c) => c.score > 0.02);
    res.json({
      results: top.map((c) => ({
        documentId: c.document_id,
        documentName: c.doc_name,
        text: c.text,
        score: c.score,
      })),
    });
  } catch (err) {
    console.error("[search] error:", err);
    res.status(500).json({ error: err.message || "Search failed" });
  }
});

// ── CHAT: real retrieval + real SSE streaming ─────────────────
app.post("/chat", async (req, res) => {
  const {
    message,
    docId,
    conversationHistory,
    provider = "groq",
    model = GROQ_DEFAULT_MODEL, // was: "llama-3.3-70b-versatile" (deprecated)
  } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: "message is required" });
  if (!docId) return res.status(400).json({ error: "docId is required" });

  const doc = db.getDocument(docId);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  try {
    const chunks = db.getChunksForDocument(docId);
    const top = await rag.retrieveTopChunks(chunks, message, 4);
    const context = top.map((c) => c.text).join("\n\n---\n\n");
    const sources = top.map((c) => ({ chunkIndex: c.chunk_index, score: c.score, preview: c.text.slice(0, 140) }));

    const SYSTEM = `You are **SecondBrain** — a precise, insightful document analysis AI.
You have a sharp, professional personality. You are direct, thorough, and never fabricate.

## Absolute Rules
1. **Context-first**: Every factual claim MUST come from the provided document context.
   - If context is present but the answer isn't there → say: "The document doesn't address this directly."
   - If no context was provided → clearly note the limitation, then answer from general knowledge if safe to do so.
2. **Never hallucinate** facts, names, numbers, or dates not in the context.
3. **Always use rich Markdown**: headings, **bold**, lists, > blockquotes for verbatim quotes, tables where useful.
4. **Be specific**: reference which part of the document you're drawing from.
5. **Be thorough**: don't truncate — give complete, valuable answers.
6. **Tone**: confident and professional, like an analyst who read every line.

## Current Document
Name: **${doc.name}**

Do NOT say "Based on the context" — just answer directly.`;

    const historyMessages = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      : [];

    const userContent = context
      ? `## Retrieved Document Context\n\n${context}\n\n---\n\n## Question\n${message}`
      : `## Question\n${message}\n\n*(No relevant context found in the document — note this limitation.)*`;

    const messages = [
      { role: "system", content: SYSTEM },
      ...historyMessages,
      { role: "user", content: userContent },
    ];

    // ── Real SSE streaming ──
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // stop nginx/Render/Railway proxies from buffering the stream
    });
    res.write(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`);

    console.log(`[chat] provider=${provider} model=${model} doc=${doc.name}`);
    await streamProvider({
      provider,
      model,
      messages,
      onToken: (token) => res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`),
    });

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    console.error(`[chat] ${provider} error:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "AI call failed" });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🧠 SecondBrain backend v4.0 — real embeddings + persistence`);
  console.log(`   http://0.0.0.0:${PORT}`);
  console.log(`   CORS allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`   Providers configured: ${Object.entries(ENV_KEYS).filter(([, v]) => v).map(([k]) => k).join(", ") || "NONE — set env keys!"}\n`);
});