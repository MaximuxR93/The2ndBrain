// backend/graph.js
// Plain CommonJS — no TypeScript syntax. Node.js can run this directly.
//
// Builds a knowledge graph from the full document list (as returned by
// db.listDocumentsFull()). Two documents are connected when they share
// enough significant keywords. Returns:
//   {
//     nodes: [{ id, name, wordCount, fileType, connections, keywords }],
//     edges: [{ source, target, weight }],
//   }

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","else","for","of","to","in",
  "on","at","by","with","from","as","is","are","was","were","be","been",
  "being","this","that","these","those","it","its","i","you","we","they",
  "he","she","him","her","them","his","hers","their","our","your","my","me",
  "us","do","does","did","done","have","has","had","having","not","no","yes",
  "so","than","too","very","can","could","should","would","may","might",
  "must","will","shall","about","into","over","under","again","further",
  "once","here","there","when","where","why","how","all","any","both","each",
  "few","more","most","other","some","such","only","own","same","also","just",
  "now","new","use","used","using","one","two","three","first","second",
  "there's","here's","it's","don't","doesn't","didn't","won't","can't",
  "couldn't","shouldn't","wouldn't","isn't","aren't","wasn't","weren't"
]);

/**
 * Pull the N most frequent meaningful words from a block of text.
 * @param {string} text
 * @param {number} count
 * @returns {string[]}
 */
function extractKeywords(text, count = 8) {
  if (!text || typeof text !== "string") return [];

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  if (tokens.length === 0) return [];

  const freq = new Map();
  for (const w of tokens) freq.set(w, (freq.get(w) || 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => {
      // Higher frequency first, then alphabetical for stable ordering.
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, count)
    .map(([w]) => w);
}

/**
 * Jaccard similarity between two keyword arrays.
 * @returns {number} 0..1
 */
function jaccard(a, b) {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const x of setA) if (setB.has(x)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Build the knowledge graph from a list of documents.
 * @param {Array<{id:string,name:string,content?:string,word_count?:number,wordCount?:number,file_type?:string,fileType?:string}>} documents
 * @returns {{ nodes: Array, edges: Array }}
 */
function buildGraph(documents) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Normalize field names — server rows use snake_case (word_count, file_type),
  // but the frontend expects camelCase. Accept both so this works either way.
  const nodes = documents.map((d) => ({
    id: d.id,
    name: d.name,
    wordCount: d.word_count ?? d.wordCount ?? 0,
    fileType: d.file_type ?? d.fileType ?? ".txt",
    connections: 0,
    keywords: extractKeywords(d.content || "", 6),
  }));

  const edges = [];
  const MIN_SIMILARITY = 0.04; // ~1 shared keyword out of ~12 total

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const sim = jaccard(nodes[i].keywords, nodes[j].keywords);
      if (sim >= MIN_SIMILARITY) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight: sim,
        });
        nodes[i].connections += 1;
        nodes[j].connections += 1;
      }
    }
  }

  return { nodes, edges };
}

module.exports = { buildGraph };