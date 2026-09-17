const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "secondbrain.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  content     TEXT NOT NULL,
  word_count  INTEGER,
  char_count  INTEGER,
  file_type   TEXT,
  uploaded_at INTEGER
);

CREATE TABLE IF NOT EXISTS chunks (
  id          TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_index INTEGER,
  text        TEXT NOT NULL,
  embedding   TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(document_id);
`);

const stmts = {
  insertDoc: db.prepare(`
    INSERT INTO documents (id, name, content, word_count, char_count, file_type, uploaded_at)
    VALUES (@id, @name, @content, @word_count, @char_count, @file_type, @uploaded_at)
  `),
  insertChunk: db.prepare(`
    INSERT INTO chunks (id, document_id, chunk_index, text, embedding)
    VALUES (@id, @document_id, @chunk_index, @text, @embedding)
  `),
  listDocs: db.prepare(`
    SELECT id, name, word_count, char_count, file_type, uploaded_at
    FROM documents ORDER BY uploaded_at DESC
  `),
  listDocsFull: db.prepare(`
    SELECT id, name, content, word_count, char_count, file_type, uploaded_at
    FROM documents ORDER BY uploaded_at DESC
  `),
  getDoc: db.prepare(`SELECT * FROM documents WHERE id = ?`),
  deleteDoc: db.prepare(`DELETE FROM documents WHERE id = ?`), // cascades via FK
  chunksForDoc: db.prepare(`SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index`),
  allChunks: db.prepare(`
    SELECT chunks.*, documents.name as doc_name
    FROM chunks JOIN documents ON documents.id = chunks.document_id
  `),
};

db.pragma("foreign_keys = ON");

module.exports = {
  insertDocument(doc) {
    stmts.insertDoc.run(doc);
  },
  insertChunks(chunks) {
    const tx = db.transaction((rows) => rows.forEach((r) => stmts.insertChunk.run(r)));
    tx(chunks);
  },
  insertDocumentWithChunks(doc, chunks) {
    const tx = db.transaction(() => {
      stmts.insertDoc.run(doc);
      chunks.forEach((r) => stmts.insertChunk.run(r));
    });
    tx();
  },
  listDocuments() {
    return stmts.listDocs.all();
  },
  listDocumentsFull() {
    return stmts.listDocsFull.all();
  },
  getDocument(id) {
    return stmts.getDoc.get(id);
  },
  deleteDocument(id) {
    return stmts.deleteDoc.run(id);
  },
  getChunksForDocument(id) {
    return stmts.chunksForDoc.all(id).map((c) => ({ ...c, embedding: JSON.parse(c.embedding) }));
  },
  getAllChunks() {
    return stmts.allChunks.all().map((c) => ({ ...c, embedding: JSON.parse(c.embedding) }));
  },
};