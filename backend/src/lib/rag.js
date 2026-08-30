// backend/src/lib/rag.js
// RAG con pgvector: embeddings para selección de plantilla.
// - Si hay OPENAI_API_KEY + DATABASE_URL -> embeddings reales (text-embedding-3-small) + pgvector.
// - Si no -> fallback determinista por hashing (demo) + búsqueda local por similitud coseno en memoria.

import crypto from "crypto";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

export const ragConfig = {
  mode: OPENAI_API_KEY && DATABASE_URL ? "openai+pgvector" : "fallback-hash",
  embeddingModel: "text-embedding-3-small",
  embeddingDims: 1536,
};

// ---------- Embeddings ----------

// Embedding de demo: hash determinista -> vector normalizado (dimensionalidad reducida).
function hashEmbed(text, dims = 256) {
  const vec = new Array(dims).fill(0);
  const tokens = String(text)
    .toLowerCase()
    .split(/[^a-z0-9áéíóúñü]+/)
    .filter((t) => t.length > 2);

  for (const token of tokens) {
    for (let i = 0; i < 3; i++) {
      const h = crypto.createHash("md5").update(`${token}:${i}`).digest();
      const idx = ((h[0] << 8) | h[1]) % dims;
      const sign = h[2] % 2 === 0 ? 1 : -1;
      vec[idx] += sign;
    }
  }
  const norm = Math.sqrt(vec.reduce((a, v) => a + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

// Embeddings reales con OpenAI text-embedding-3-small
async function openaiEmbed(texts) {
  const res = await fetch(`${OPENAI_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: ragConfig.embeddingModel, input: texts }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

/**
 * embed(text) -> array de floats (vector de embeddings)
 * OpenAI si hay API key; fallback hash para demo.
 */
export async function embed(text) {
  const [v] = await embedBatch([text]);
  return v;
}

export async function embedBatch(texts) {
  if (OPENAI_API_KEY) {
    try {
      return await openaiEmbed(texts);
    } catch (err) {
      console.warn("[rag] OpenAI embed falló, usando hash fallback:", err.message);
    }
  }
  return texts.map((t) => hashEmbed(t));
}

function cosineSimilarity(a, b) {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot; // ambos normalizados
}

// ---------- Pgvector (opcional) ----------

let pgPool = null;
let pgReady = false;

async function getPgPool() {
  if (pgPool) return pgPool;
  // pg se carga lazy para que el backend siga funcionando sin dependencia instalada
  const pgModule = await import("pg").catch(() => null);
  if (!pgModule) return null;
  const { Pool } = pgModule.default ?? pgModule;
  pgPool = new Pool({ connectionString: DATABASE_URL });
  return pgPool;
}

export async function initPgvector() {
  if (!DATABASE_URL) return false;
  const pool = await getPgPool();
  if (!pool) {
    console.warn("[rag] DATABASE_URL set pero el paquete 'pg' no está instalado; RAG usará modo fallback");
    return false;
  }
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS template_embeddings (
        id SERIAL PRIMARY KEY,
        template_id TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_template_embeddings_tpl ON template_embeddings (template_id)");
    pgReady = true;
    console.log("[rag] pgvector listo (tabla template_embeddings)");
    return true;
  } catch (err) {
    console.warn("[rag] pgvector no disponible, usando fallback en memoria:", err.message);
    return false;
  }
}

/**
 * storeTemplateEmbedding(templateId, content)
 * Guarda (o reemplaza) el embedding de una plantilla en pgvector.
 */
export async function storeTemplateEmbedding(templateId, content) {
  const [vec] = await embedBatch([content]);
  if (pgReady) {
    const pool = await getPgPool();
    await pool.query("DELETE FROM template_embeddings WHERE template_id = $1", [templateId]);
    await pool.query(
      "INSERT INTO template_embeddings (template_id, content, embedding) VALUES ($1, $2, $3)",
      [templateId, content, JSON.stringify(vec)]
    );
  } else {
    memoryStore(templateId, content, vec);
  }
  return { templateId, dims: vec.length, stored: pgReady ? "pgvector" : "memory" };
}

// ---------- Fallback en memoria ----------

const memoryIndex = new Map(); // templateId -> { content, vec, tokens }

function tokenize(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
  );
}

function memoryStore(templateId, content, vec) {
  memoryIndex.set(templateId, { content, vec, tokens: tokenize(content) });
}

// Similitud por solapamiento de tokens (fallback demo; más significativa que el hash)
function tokenSimilarity(queryTokens, tplTokens) {
  if (!tplTokens.size || !queryTokens.size) return 0;
  let shared = 0;
  for (const t of queryTokens) if (tplTokens.has(t)) shared++;
  return shared / Math.sqrt(queryTokens.size * tplTokens.size);
}

function memoryQuery(queryText, vec, topK = 1) {
  const queryTokens = tokenize(queryText);
  const results = [];
  for (const [templateId, { vec: tv, tokens }] of memoryIndex) {
    const cos = cosineSimilarity(vec, tv);
    const tok = tokenSimilarity(queryTokens, tokens);
    // blend: el solapamiento de términos domina; el hash añade señal difusa
    results.push({ templateId, score: tok * 0.85 + Math.max(cos, 0) * 0.15 });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

// ---------- Query ----------

/**
 * queryTemplate({ name, description, category, scrapedText })
 * Devuelve [{ templateId, score }] ordenado por similitud (top 1 por defecto).
 */
export async function queryTemplate({ name = "", description = "", category = "", scrapedText = "" } = {}, topK = 1) {
  const query = [
    name,
    description,
    category,
    typeof scrapedText === "string" ? scrapedText : JSON.stringify(scrapedText ?? ""),
  ]
    .filter(Boolean)
    .join(" \n ")
    .slice(0, 8000);

  const [vec] = await embedBatch([query]);

  if (pgReady) {
    const pool = await getPgPool();
    const { rows } = await pool.query(
      `SELECT template_id, 1 - (embedding <=> $1::vector) AS score
       FROM template_embeddings
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [JSON.stringify(vec), topK]
    );
    return rows.map((r) => ({ templateId: r.template_id, score: Number(r.score) }));
  }

  return memoryQuery(query, vec, topK);
}

// ---------- Seed ----------

/**
 * seedTemplates(templates)
 * Indexa el catálogo de plantillas al iniciar el backend.
 * Solo inserta si no existe ya (o reemplaza si cambió el contenido).
 */
export async function seedTemplates(templates = []) {
  for (const t of templates) {
    const content = `${t.name}. ${t.description}. Palabras clave: ${(t.keywords || []).join(", ")}`;
    await storeTemplateEmbedding(t.id, content);
  }
  console.log(`[rag] ${templates.length} plantillas indexadas (modo: ${ragConfig.mode})`);
  return { indexed: templates.length, mode: ragConfig.mode };
}