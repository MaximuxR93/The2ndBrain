require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const pdfParse = require("pdf-parse");
const mammoth  = require("mammoth");
const Groq     = require("groq-sdk");
const OpenAI   = require("openai");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── File upload (memory, max 20 MB) ────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ── Provider factory ────────────────────────────────────────
/**
 * Builds a unified chat call from any supported provider.
 * All providers use OpenAI-compatible SDKs except Anthropic.
 *
 * @param {object} opts
 * @param {"groq"|"openai"|"openrouter"|"grok"|"anthropic"} opts.provider
 * @param {string}  opts.apiKey     - user-supplied key (falls back to env for groq)
 * @param {string}  opts.model
 * @param {Array}   opts.messages   - [{ role, content }]
 */
async function callProvider({ provider, apiKey, model, messages }) {
  // ── Anthropic (native SDK, different message format) ──────
  if (provider === "anthropic") {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Anthropic API key is not set.");
    const client = new Anthropic.Anthropic({ apiKey: key });

    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const convo   = messages.filter((m) => m.role !== "system");

    const res = await client.messages.create({
      model,
      max_tokens: 2048,
      system,
      messages: convo,
    });
    return res.content.map((b) => b.text ?? "").join("");
  }

  // ── OpenAI-compatible providers (Groq, OpenAI, OpenRouter, Grok) ─
  const BASE_URLS = {
    groq:       "https://api.groq.com/openai/v1",
    openai:     "https://api.openai.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
    grok:       "https://api.x.ai/v1",
  };

  const envFallbacks = {
    groq:       process.env.GROQ_API_KEY,
    openai:     process.env.OPENAI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    grok:       process.env.XAI_API_KEY,
  };

  const key = apiKey || envFallbacks[provider];
  if (!key) throw new Error(`API key for "${provider}" is not set.`);

  const client = new OpenAI.OpenAI({
    apiKey:  key,
    baseURL: BASE_URLS[provider],
  });

  const completion = await client.chat.completions.create({
    model,
    max_tokens: 2048,
    temperature: 0.35,
    top_p: 0.9,
    messages,
  });

  return completion.choices[0]?.message?.content ?? "";
}

// ── Health ──────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ status: "ok", version: "3.0.0", info: "Multi-provider SecondBrain backend" })
);

// ── UPLOAD ──────────────────────────────────────────────────
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No file attached" });

  const name = req.file.originalname.toLowerCase();
  let text = "";

  try {
    if (name.endsWith(".pdf")) {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text;
    } else if (name.endsWith(".docx")) {
      const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = parsed.value;
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
    console.log(`[upload] "${req.file.originalname}" → ${cleaned.length} chars | ${wordCount} words`);

    return res.json({ text: cleaned, wordCount, charCount: cleaned.length });
  } catch (err) {
    console.error("[upload] parse error:", err);
    return res.status(500).json({ error: `Failed to parse file: ${err.message}` });
  }
});

// ── CHAT ────────────────────────────────────────────────────
app.post("/chat", async (req, res) => {
  const {
    message,
    context,
    docName,
    conversationHistory,
    // Provider config from the frontend (optional — falls back to env defaults)
    provider = "groq",
    apiKey   = "",
    model    = "llama-3.3-70b-versatile",
  } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: "message is required" });

  const SYSTEM = `You are **SecondBrain** — a precise, insightful document analysis AI.
You have a sharp, professional personality. You are direct, thorough, and never fabricate.

## Absolute Rules
1. **Context-first**: Every factual claim MUST come from the provided document context.
   - If context is present but the answer isn't there → say: "The document doesn't address this directly."
   - If no context was provided → clearly note the limitation, then answer from general knowledge if safe to do so.
2. **Never hallucinate** facts, names, numbers, or dates not in the context.
3. **Always use rich Markdown**:
   - ## or ### headings for structure
   - **bold** for key terms, findings, entities
   - Bullet (–) or numbered lists for multi-item answers
   - > blockquote for verbatim quotes from the document
   - \`inline code\` for technical terms / identifiers
   - Tables for comparisons or structured data
   - Horizontal rule (---) to separate major sections
4. **Be specific**: Reference exact parts ("The second paragraph states...", "Under the Skills section...").
5. **Be thorough**: Don't truncate — give complete, valuable answers.
6. **Tone**: Confident and professional, like a brilliant analyst who read every line.

## Current Document
Name: **${docName || "Unknown"}**

Do NOT say "Based on the context" — just answer directly.`;

  const historyMessages = Array.isArray(conversationHistory)
    ? conversationHistory.slice(-6).map((m) => ({ role: m.role, content: m.content }))
    : [];

  const userContent = context
    ? `## Retrieved Document Context\n\n${context}\n\n---\n\n## Question\n${message}`
    : `## Question\n${message}\n\n*(No document context — note this limitation in your answer.)*`;

  const messages = [
    { role: "system", content: SYSTEM },
    ...historyMessages,
    { role: "user", content: userContent },
  ];

  try {
    console.log(`[chat] provider=${provider} model=${model}`);
    const reply = await callProvider({ provider, apiKey, model, messages });
    console.log(`[chat] reply: ${reply.length} chars`);
    return res.json({ reply, provider, model });
  } catch (err) {
    console.error(`[chat] ${provider} error:`, err.message);
    return res.status(500).json({ error: err.message || "AI call failed" });
  }
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`\n🧠 SecondBrain backend v3.0`);
  console.log(`   http://127.0.0.1:${PORT}`);
  console.log(`   Providers: groq · openai · anthropic · openrouter · grok\n`);
});