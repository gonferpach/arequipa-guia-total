import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

// ============ CONFIGURACIÓN DE COLECCIONES ============
// Cada colección = un directorio de la guía con sus criterios de voto propios
const COLECCIONES = {
  gastronomia: {
    archivo: "gastronomia.json",
    itemsKey: "locales",
    criterios: ["precio", "platos", "atencion", "limpieza", "infraestructura", "decoracion"],
  },
  sitios: {
    archivo: "sitios-turisticos.json",
    itemsKey: "sitios",
    criterios: ["belleza", "acceso", "servicio", "limpieza", "precio"],
  },
};

// ============ HELPERS ============
function leerJsonSeguro(archivo) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, archivo), "utf8"));
  } catch {
    return null;
  }
}

function leerVotos(coleccion) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${coleccion}-votos.json`), "utf8"));
  } catch {
    return [];
  }
}

function escribirVotos(coleccion, arr) {
  fs.writeFileSync(path.join(DATA_DIR, `${coleccion}-votos.json`), JSON.stringify(arr, null, 2));
}

function extraerIp(req) {
  return (
    req.headers["x-client-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "?"
  ).toString();
}

function validarIds(cfg) {
  const data = leerJsonSeguro(cfg.archivo);
  if (data && Array.isArray(data[cfg.itemsKey])) {
    return new Set(data[cfg.itemsKey].map((x) => x.id));
  }
  return null; // catálogo no disponible → validación flexible
}

// ============ AGREGACIÓN ============
function summaryItem(votos, itemId, criterios) {
  const propios = votos.filter((v) => v.localId === itemId);
  const total = propios.length;
  const promedios = {};
  for (const c of criterios) promedios[c] = 0;
  for (const v of propios) {
    for (const c of criterios) promedios[c] += v.scores[c] || 0;
  }
  for (const c of criterios) promedios[c] = total ? +(promedios[c] / total).toFixed(1) : 0;
  const totalGeneral = total
    ? +(criterios.reduce((s, c) => s + promedios[c], 0) / criterios.length).toFixed(1)
    : 0;
  const comentarios = propios
    .filter((v) => v.comentario)
    .sort((a, b) => (b.ts || "").localeCompare(a.ts || ""))
    .slice(0, 3)
    .map((v) => ({ texto: v.comentario, fecha: v.fecha, ts: v.ts }));
  return { localId: itemId, total, promedios, totalGeneral, comentarios };
}

// ============ ROUTER ============
const router = Router();

// Lista de colecciones disponibles
router.get("/", (req, res) => {
  res.json({
    ok: true,
    colecciones: Object.entries(COLECCIONES).map(([id, v]) => ({ id, criterios: v.criterios })),
  });
});

// Summary global de una colección
router.get("/:coleccion/summary", (req, res) => {
  const cfg = COLECCIONES[req.params.coleccion];
  if (!cfg) return res.status(404).json({ error: "Colección no existe" });
  const votos = leerVotos(req.params.coleccion);
  const idsConVotos = [...new Set(votos.map((v) => v.localId))];
  res.json({
    ok: true,
    locales: idsConVotos.map((id) => summaryItem(votos, id, cfg.criterios)),
  });
});

// Summary de un item
router.get("/:coleccion/:id", (req, res) => {
  const { coleccion, id } = req.params;
  const cfg = COLECCIONES[coleccion];
  if (!cfg) return res.status(404).json({ error: "Colección no existe" });
  const votos = leerVotos(coleccion);
  const tiene = votos.some((v) => v.localId === id);
  if (!tiene) {
    return res.json({ ok: true, localId: id, total: 0, promedios: {}, totalGeneral: 0, comentarios: [] });
  }
  res.json({ ok: true, ...summaryItem(votos, id, cfg.criterios) });
});

// Voto con anti-spam: 1 por IP por item por día
router.post("/:coleccion/:id/voto", (req, res) => {
  const { coleccion, id } = req.params;
  const cfg = COLECCIONES[coleccion];
  if (!cfg) return res.status(404).json({ error: "Colección no existe" });

  const validIds = validarIds(cfg);
  if (validIds && !validIds.has(id)) {
    return res.status(400).json({ error: `Item '${id}' no existe en la colección` });
  }

  const { scores, comentario } = req.body || {};
  if (!scores || typeof scores !== "object") {
    return res.status(400).json({ error: "Falta el objeto scores" });
  }
  for (const c of cfg.criterios) {
    const val = scores[c];
    if (!Number.isInteger(val) || val < 1 || val > 5) {
      return res.status(400).json({ error: `Score '${c}' inválido (entero 1-5)` });
    }
  }
  if (comentario && (typeof comentario !== "string" || comentario.length > 300)) {
    return res.status(400).json({ error: "Comentario inválido (max 300 caracteres)" });
  }

  const ip = extraerIp(req);
  const hoy = new Date().toISOString().slice(0, 10);
  const votos = leerVotos(coleccion);

  if (votos.some((v) => v.localId === id && v.ip === ip && v.fecha === hoy)) {
    return res.status(429).json({ error: "Ya calificaste este lugar hoy. Vuelve mañana 🦞" });
  }

  votos.push({
    localId: id,
    ip,
    fecha: hoy,
    scores: Object.fromEntries(cfg.criterios.map((c) => [c, scores[c]])),
    comentario: comentario || "",
    ts: new Date().toISOString(),
  });
  escribirVotos(coleccion, votos);

  res.json({ ok: true, ...summaryItem(votos, id, cfg.criterios) });
});

export default router;