/**
 * rag.js — Chunking + lightweight TF-IDF retrieval
 * 
 * No external embedding API needed. We use TF-IDF cosine similarity
 * computed entirely in-process, which works well for document Q&A.
 */

// ── Chunking ────────────────────────────────────────────────────────────────
const CHUNK_SIZE    = 600;  // characters per chunk
const CHUNK_OVERLAP = 120;  // overlap between consecutive chunks

function chunkText(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
    if (i + CHUNK_SIZE >= text.length) break;
  }
  return chunks;
}

// ── Tokenisation ─────────────────────────────────────────────────────────────
const STOP = new Set([
  "the","and","for","that","this","with","are","from","but","not","have",
  "its","was","were","they","you","your","all","can","been","has","their",
  "which","will","more","than","into","also","any","our","about","out",
  "had","him","her","his","she","one","who","what","when","there","then",
  "some","such","each","how","after","other","over","just","like","use",
  "used","using","may","would","could","should","does","did","get","got",
  "per","via","etc",
]);

function tokenize(text) {
  return (text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).filter(
    (t) => !STOP.has(t)
  );
}

// ── TF-IDF vector for a single document ──────────────────────────────────────
function buildVector(tokens) {
  const tf = {};
  tokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1; });
  const len = tokens.length || 1;
  const vec = {};
  for (const [t, count] of Object.entries(tf)) {
    vec[t] = count / len;   // raw TF (IDF is baked in at query time)
  }
  return vec;
}

function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (const [k, v] of Object.entries(a)) {
    dot  += v * (b[k] || 0);
    magA += v * v;
  }
  for (const v of Object.values(b)) magB += v * v;
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * embedBatch(chunks: string[]) → Promise<number[][]>
 * Returns a TF-IDF vector (as a dense array of [term, score] pairs encoded
 * in a stable order) for each chunk. The "embedding" is stored as JSON.
 * 
 * NOTE: This is intentionally lightweight — no API call, no GPU, no cost.
 * For a production system swap this with OpenAI text-embedding-3-small.
 */
async function embedBatch(chunks) {
  return chunks.map((chunk) => {
    const tokens = tokenize(chunk);
    const vec = buildVector(tokens);
    // Store as sorted entries so the JSON is deterministic
    return Object.entries(vec).sort((a, b) => b[1] - a[1]);
  });
}

/**
 * retrieveTopChunks(chunks, query, k) → Promise<chunk[]>
 * 
 * chunks: rows from db (each has .embedding as a parsed array of [term, score] pairs)
 * query:  the user's question string
 * k:      how many top chunks to return
 */
async function retrieveTopChunks(chunks, query, k = 4) {
  if (!chunks.length) return [];

  const qTokens = tokenize(query);
  const qVec    = buildVector(qTokens);

  const scored = chunks.map((chunk) => {
    // embedding is already parsed by db.js as an array of [term, score]
    const cVec = Object.fromEntries(chunk.embedding);
    return { ...chunk, score: cosineSim(qVec, cVec) };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

module.exports = { chunkText, embedBatch, retrieveTopChunks };
