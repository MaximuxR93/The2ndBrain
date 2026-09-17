import type { Document } from "@/store/useStore";

// ── Stop words (ignored during tokenization) ─────────────────────────────────
const STOP = new Set([
  "the","and","for","that","this","with","are","from","but","not","have","its",
  "was","were","they","you","your","all","can","been","has","their","which",
  "will","more","than","into","also","any","our","about","out","had","him",
  "her","his","she","one","who","what","when","there","then","some","such",
  "each","how","after","other","over","just","like","use","used","using",
  "may","would","could","should","does","did","get","got","per","via","etc",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).filter(
    (t) => !STOP.has(t)
  );
}

function buildTfIdf(docs: Document[]) {
  const docTokens = docs.map((d) => tokenize(d.content ?? ""));
  const df = new Map<string, number>();
  docTokens.forEach((tokens) => {
    new Set(tokens).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
  });

  const N = docs.length;
  return docTokens.map((tokens) => {
    const tf = new Map<string, number>();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Map<string, number>();
    tf.forEach((count, term) => {
      const idf = Math.log((N + 1) / (1 + (df.get(term) || 0)));
      vec.set(term, (count / tokens.length) * idf);
    });
    return vec;
  });
}

function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, magA = 0, magB = 0;
  a.forEach((v, k) => { dot += v * (b.get(k) || 0); magA += v * v; });
  b.forEach((v) => { magB += v * v; });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

/** Returns the top-N keywords by TF-IDF score for a single document vector */
export function topKeywords(vec: Map<string, number>, n = 5): string[] {
  return [...vec.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term]) => term);
}

export interface GraphNode {
  id: string;
  name: string;
  wordCount: number;
  fileType: string;
  connections: number;
  keywords: string[];
}
export interface GraphEdge { source: string; target: string; weight: number; }

export function buildGraph(docs: Document[], threshold = 0.04) {
  const vecs = buildTfIdf(docs);

  const nodes: GraphNode[] = docs.map((d, i) => ({
    id: d.id,
    name: d.name,
    wordCount: d.wordCount,
    fileType: d.fileType,
    connections: 0,
    keywords: topKeywords(vecs[i]),
  }));

  const edges: GraphEdge[] = [];

  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const sim = cosineSim(vecs[i], vecs[j]);
      if (sim > threshold) {
        edges.push({ source: docs[i].id, target: docs[j].id, weight: sim });
        nodes[i].connections++;
        nodes[j].connections++;
      }
    }
  }

  return { nodes, edges };
}