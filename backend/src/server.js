import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { selectTemplate } from "./aiSelector.js";
import { listTemplates } from "./templates.js";
import { gastronomiaRouter } from "./gastronomia.js";
import directoriosRouter from "./directorios.js";
import guiaChatRouter from "./guia-chat.js";
import { seedTemplates, queryTemplate, ragConfig } from "./lib/rag.js";
import { scrapeAll, scrapeInstagram, scrapeFacebook, scrapeTikTok } from "./lib/scraper.js";
import { extractPalette } from "./lib/palette.js";
import { generateSeo } from "./lib/seo.js";
import { deployLanding } from "./lib/openship.js";

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

// ---- Seed RAG al iniciar ----
seedTemplates(listTemplates()).catch((err) =>
  console.warn("[rag] seed falló:", err.message)
);

// ---- Rutas ----

// Health
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, rag: ragConfig.mode })
);

// Plantillas disponibles
app.get("/api/templates", (_req, res) => {
  res.json(listTemplates());
});

// ---------- RAG ----------

// Consulta RAG: devuelve la mejor plantilla según datos del negocio (+ texto scrapeado)
app.post("/api/rag/query", async (req, res) => {
  try {
    const { name, description, category, scrapedText, topK } = req.body || {};
    if (!name && !description && !scrapedText) {
      return res
        .status(400)
        .json({ error: "Envía name, description, category o scrapedText" });
    }
    const results = await queryTemplate(
      { name, description, category, scrapedText },
      Math.min(Number(topK) || 3, listTemplates().length)
    );
    if (!results.length) {
      return res.json({ top: null, results: [], mode: ragConfig.mode });
    }
    const catalog = listTemplates();
    const enriched = results.map((r) => ({
      ...r,
      template: catalog.find((t) => t.id === r.templateId) || null,
    }));
    res.json({ top: enriched[0], results: enriched, mode: ragConfig.mode });
  } catch (err) {
    console.error("[rag/query]", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Scraper ----------

// Scrapea redes sociales y devuelve datos consolidados para pre-rellenar el formulario
app.post("/api/scrape", async (req, res) => {
  try {
    const { instagram, facebook, tiktok, website } = req.body || {};
    if (!instagram && !facebook && !tiktok && !website) {
      return res
        .status(400)
        .json({ error: "Envía al menos: instagram, facebook, tiktok o website" });
    }
    const data = await scrapeAll({ instagram, facebook, tiktok, website });
    res.json({
      bio: data.bio,
      posts: data.posts,
      photos: data.photos,
      palette: data.palette,
      sources: data.sources,
      mocks: data.mocks,
      website: data.website,
      raw: data.raw,
    });
  } catch (err) {
    console.error("[scrape]", err);
    res.status(500).json({ error: err.message });
  }
});

// Scrapers individuales (debug)
app.post("/api/scrape/instagram", async (req, res) => {
  const { handle } = req.body || {};
  if (!handle) return res.status(400).json({ error: "handle requerido" });
  res.json(await scrapeInstagram(handle));
});
app.post("/api/scrape/facebook", async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "url requerida" });
  res.json(await scrapeFacebook(url));
});
app.post("/api/scrape/tiktok", async (req, res) => {
  const { handle } = req.body || {};
  if (!handle) return res.status(400).json({ error: "handle requerido" });
  res.json(await scrapeTikTok(handle));
});

// ---------- Landings ----------

// Crear landing: scraper (opcional) -> RAG elige plantilla -> palette -> SEO
app.post("/api/landings", async (req, res) => {
  try {
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
      website,
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

    // 1) Scraper: si viene instagram/facebook/tiktok, enriquece datos
    let scrapedData = null;
    if (redes.instagram || redes.facebook || redes.tiktok || website) {
      try {
        scrapedData = await scrapeAll({
          instagram: redes.instagram,
          facebook: redes.facebook,
          tiktok: redes.tiktok,
          website,
        });
      } catch (err) {
        console.warn("[landings] scrape falló, continuando sin datos:", err.message);
      }
    }

    const enrichedDescription = scrapedData?.bio
      ? `${description} ${scrapedData.bio}`.slice(0, 2000)
      : description;

    // 2) RAG: elige plantilla por similitud (con fallback a keyword matcher)
    let template;
    try {
      const [top] = await queryTemplate({
        name,
        description: enrichedDescription,
        category,
        scrapedText: scrapedData?.bio || "",
      });
      template = top
        ? { template: top.templateId, score: top.score }
        : selectTemplate({ name, description, category });
    } catch {
      template = selectTemplate({ name, description, category });
    }

    // 3) Palette
    const palette = await extractPalette({
      photos: fotos,
      scrapedData,
      category: category || template.category,
    });

    // 4) SEO
    const seo = await generateSeo({
      name,
      description,
      category: category || template.category,
      scrapedData,
    });

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
      fotos: scrapedData?.photos?.length
        ? [...fotos, ...scrapedData.photos.slice(0, 6)]
        : fotos,
      redes: {
        whatsapp: redes.whatsapp || "",
        facebook: redes.facebook || "",
        instagram: redes.instagram || "",
        tiktok: redes.tiktok || "",
        youtube: redes.youtube || "",
      },
      website: website || "",
      palette,
      seo,
      scrapedData: scrapedData
        ? {
            bio: scrapedData.bio,
            posts: scrapedData.posts,
            photos: scrapedData.photos,
            palette: scrapedData.palette,
            sources: scrapedData.sources,
            mocks: scrapedData.mocks,
          }
        : null,
      createdAt: new Date().toISOString(),
    };

    rows.push(landing);
    writeLandings(rows);
    res.status(201).json(landing);
  } catch (err) {
    console.error("[landings]", err);
    res.status(500).json({ error: err.message });
  }
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

// ---------- Gastronomía (votos usuarios) ----------
app.use("/api/gastronomia", gastronomiaRouter);
app.use("/api/directorios", directoriosRouter);
app.use("/api/guia", guiaChatRouter);

// ---------- Deploy OpenShip ----------

app.post("/api/landings/:slug/deploy", async (req, res) => {
  try {
    const landing = readLandings().find((r) => r.slug === req.params.slug);
    if (!landing) return res.status(404).json({ error: "Landing no encontrada" });

    const result = await deployLanding(landing.slug, {
      ...landing,
      seo: landing.seo || (await generateSeo({ name: landing.name, description: landing.description })),
    });
    res.status(result.ok ? 200 : 502).json(result);
  } catch (err) {
    console.error("[deploy]", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
  console.log(`🧠 2braind backend escuchando en puerto ${PORT} (rag: ${ragConfig.mode})`);
});