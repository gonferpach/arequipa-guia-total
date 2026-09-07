// Votos gastronómicos — 48 locales campiña Arequipa
// Modelo híbrido: ranking editorial (visita campo, pendiente) + votos de usuarios.
// Storage: data/gastronomia-votos.json (mismo patrón que landings.json)
// Anti-spam: 1 voto por IP / local / día.

import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const VOTOS_FILE = path.join(DATA_DIR, "gastronomia-votos.json");
const CATALOG_FILE = path.join(DATA_DIR, "gastronomia.json");

export const CRITERIOS = [
  "precio",
  "platos",
  "atencion",
  "limpieza",
  "infraestructura",
  "decoracion",
];

// ---------- storage ----------
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VOTOS_FILE)) fs.writeFileSync(VOTOS_FILE, "[]");

const readVotos = () => {
  try {
    return JSON.parse(fs.readFileSync(VOTOS_FILE, "utf8"));
  } catch {
    return [];
  }
};
const writeVotos = (rows) =>
  fs.writeFileSync(VOTOS_FILE, JSON.stringify(rows, null, 2));

// IDs válidos del catálogo (Y1..P6). Si falta catálogo, valida formato.
const readCatalog = () => {
  try {
    return JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
  } catch {
    return null;
  }
};

const isValidLocal = (id) => {
  const cat = readCatalog();
  if (cat?.locales?.length) return cat.locales.some((l) => l.id === id);
  return /^[A-Za-z]{1,3}\d{1,3}$/.test(id); // fallback formato
};

// ---------- helpers ----------
const hoy = () => new Date().toISOString().slice(0, 10); // Lima ~UTC-5, suficiente fase 1

const clientIp = (req) => {
  const fwd = req.headers["x-client-ip"];
  if (fwd) return String(fwd).split(",")[0].trim();
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return req.socket?.remoteAddress || "desconocida";
};

function resumen(rows) {
  // rows = votos de UN local
  if (!rows.length) return { total: 0, promedios: null, comentarios: [] };
  const promedios = {};
  for (const c of CRITERIOS) {
    const vals = rows.map((v) => v.scores[c]).filter(Number.isFinite);
    promedios[c] = vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : null;
  }
  const conNota = rows.filter((v) => v.comentario && v.comentario.trim());
  const comentarios = conNota
    .slice(-3)
    .reverse()
    .map((v) => ({ texto: v.comentario.slice(0, 300), fecha: v.fecha, ts: v.ts }));
  const totalGeneral =
    Math.round(
      (Object.values(promedios).reduce((a, b) => a + (b || 0), 0) / CRITERIOS.length) *
        10
    ) / 10;
  return { total: rows.length, promedios, totalGeneral, comentarios };
}

// ---------- router ----------
export const gastronomiaRouter = Router();

// Summary global: GET /api/gastronomia/summary
gastronomiaRouter.get("/summary", (_req, res) => {
  const rows = readVotos();
  const porLocal = {};
  for (const v of rows) (porLocal[v.localId] ||= []).push(v);
  const summary = Object.entries(porLocal).map(([localId, votos]) => ({
    localId,
    ...resumen(votos),
  }));
  res.json({ ok: true, locales: summary });
});

// Summary de un local: GET /api/gastronomia/:id
gastronomiaRouter.get("/:id", (req, res) => {
  const { id } = req.params;
  if (!isValidLocal(id))
    return res.status(404).json({ error: `Local '${id}' no existe en el catálogo` });
  const rows = readVotos().filter((v) => v.localId === id);
  res.json({ ok: true, localId: id, ...resumen(rows) });
});

// Votar: POST /api/gastronomia/:id/voto
gastronomiaRouter.post("/:id/voto", (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidLocal(id))
      return res.status(404).json({ error: `Local '${id}' no existe en el catálogo` });

    const { scores, comentario } = req.body || {};
    if (!scores || typeof scores !== "object")
      return res.status(400).json({ error: "Faltan las puntuaciones (scores)" });

    // Validar 6 criterios, entero 1-5
    for (const c of CRITERIOS) {
      const v = Number(scores[c]);
      if (!Number.isInteger(v) || v < 1 || v > 5)
        return res
          .status(400)
          .json({ error: `Criterio '${c}': debe ser entero 1-5 (recibido: ${scores[c]})` });
    }

    const texto = String(comentario || "").trim().slice(0, 300);

    // Anti-spam: 1 voto por IP/local/día
    const ip = clientIp(req);
    const fecha = hoy();
    const rows = readVotos();
    const duplicado = rows.some(
      (v) => v.localId === id && v.ip === ip && v.fecha === fecha
    );
    if (duplicado)
      return res
        .status(429)
        .json({ error: "Ya calificaste este local hoy. Vuelve mañana 🦞" });

    rows.push({
      localId: id,
      ip,
      fecha,
      scores: Object.fromEntries(CRITERIOS.map((c) => [c, Number(scores[c])])),
      comentario: texto,
      ts: new Date().toISOString(),
    });
    writeVotos(rows);

    const votosLocal = rows.filter((v) => v.localId === id);
    res.status(201).json({ ok: true, localId: id, ...resumen(votosLocal) });
  } catch (err) {
    console.error("[gastronomia/voto]", err);
    res.status(500).json({ error: err.message });
  }
});