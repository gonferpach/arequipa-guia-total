import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { selectTemplate } from "./aiSelector.js";
import { listTemplates } from "./templates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "landings.json");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Asegura data dir
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

const readLandings = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const writeLandings = (rows) =>
  fs.writeFileSync(DATA_FILE, JSON.stringify(rows, null, 2));

const slugify = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

// ---- Rutas ----

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Plantillas disponibles
app.get("/api/templates", (_req, res) => {
  res.json(listTemplates());
});

// Crear landing: la IA (mock) elige la plantilla
app.post("/api/landings", (req, res) => {
  const {
    name,
    description,
    category,
    vision,
    mision,
    historia,
    quienesSomos,
    telefono,
    email,
    direccion,
    fotos = [],
    redes = {},
  } = req.body;

  if (!name || !description) {
    return res
      .status(400)
      .json({ error: "name y description son obligatorios" });
  }

  const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);
  const rows = readLandings();

  if (rows.some((r) => r.slug === slug)) {
    return res.status(409).json({ error: `Slug '${slug}' ya existe` });
  }

  // Selector IA (mock): elige plantilla según categoría/descripción
  const template = selectTemplate({ name, description, category });

  const landing = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    slug,
    name,
    description,
    category: category || template.category,
    template, // ej: template-clinica | template-restaurante | template-generico
    vision: vision || "",
    mision: mision || "",
    historia: historia || "",
    quienesSomos: quienesSomos || "",
    telefono: telefono || "",
    email: email || "",
    direccion: direccion || "",
    fotos,
    redes: {
      whatsapp: redes.whatsapp || "",
      facebook: redes.facebook || "",
      instagram: redes.instagram || "",
      tiktok: redes.tiktok || "",
      youtube: redes.youtube || "",
    },
    createdAt: new Date().toISOString(),
  };

  rows.push(landing);
  writeLandings(rows);
  res.status(201).json(landing);
});

// Listar landings
app.get("/api/landings", (_req, res) => {
  res.json(readLandings());
});

// Obtener landing por slug
app.get("/api/landings/:slug", (req, res) => {
  const landing = readLandings().find((r) => r.slug === req.params.slug);
  if (!landing) return res.status(404).json({ error: "Landing no encontrada" });
  res.json(landing);
});

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
  console.log(`🧠 2braind backend escuchando en puerto ${PORT}`);
});