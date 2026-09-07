import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

// ============ CONFIG LLM (OmniRoute — el gateway propio de tokens) ============
const AI_BASE_URL = process.env.AI_BASE_URL || "http://100.64.3.5:11434/v1";
const AI_MODEL = process.env.AI_MODEL || "gemma4:31b-cloud";
const AI_API_KEY = process.env.AI_API_KEY || "";

// ============ RATE LIMIT (en memoria: 20 preguntas por IP por día) ============
const USOS = {}; // { ip: { fecha, count } }

// ============ CONTEXTO desde los datasets de la guía ============
function txt(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[lang] || field.es || field.en || "";
}

// Cache en memoria del resumen de neoguia (se carga 1 vez al arrancar)
let neoguiaCache = null;

async function cargarResumenNeoguia() {
  if (neoguiaCache) return neoguiaCache;
  try {
    const r = await fetch("http://localhost:3002/api/lugares?limit=1000", { cache: "no-store" });
    const d = await r.json();
    if (d && d.data) {
      // Agrupar por tipo para el contexto del bot
      const porTipo = {};
      for (const l of d.data) {
        const t = l.tipo || "other";
        if (!porTipo[t]) porTipo[t] = [];
        porTipo[t].push(l);
      }
      neoguiaCache = porTipo;
      console.log(`[guia-chat] NeoGuía cache: ${d.data.length} lugares en ${Object.keys(porTipo).length} tipos`);
      return neoguiaCache;
    }
  } catch (e) {
    console.error("[guia-chat] Error cargando neoguia:", e.message);
  }
  return null;
}

function construirContextoNeoguia(neoguia, lang) {
  if (!neoguia) return "";
  let ctx = "\n## DIRECTORIO GENERAL DE AREQUIPA (OpenStreetMap, 3K+ lugares)\n";
  
  const traducTipos = lang === "en" ? {
    restaurant: "Restaurants", cafe: "Cafés", fast_food: "Fast food", bar: "Bars",
    hotel: "Hotels", pharmacy: "Pharmacies", hospital: "Hospitals", clinic: "Clinics",
    bank: "Banks", atm: "ATMs", fuel: "Gas stations", bus_station: "Bus stations",
    bus_stop: "Bus stops", taxi: "Taxis", parking: "Parking", supermarket: "Supermarkets",
    convenience: "Convenience stores", bakery: "Bakeries", mall: "Malls",
    attraction: "Attractions", museum: "Museums", viewpoint: "Viewpoints",
    park: "Parks", church: "Churches", school: "Schools", cinema: "Cinemas",
    theatre: "Theatres", police: "Police", library: "Libraries",
  } : {
    restaurant: "Restaurantes", cafe: "Cafés", fast_food: "Comida rápida", bar: "Bares",
    hotel: "Hoteles", pharmacy: "Farmacias", hospital: "Hospitales", clinic: "Clínicas",
    bank: "Bancos", atm: "Cajeros", fuel: "Gasolineras", bus_station: "Terminales de bus",
    bus_stop: "Paradas de bus", taxi: "Taxis", parking: "Estacionamientos", supermarket: "Supermercados",
    convenience: "Tiendas", bakery: "Panaderías", mall: "Malls",
    attraction: "Atracciones", museum: "Museos", viewpoint: "Miradores",
    park: "Parques", church: "Iglesias", school: "Escuelas", cinema: "Cines",
    theatre: "Teatros", police: "Policía", library: "Bibliotecas",
  };
  
  // Tipos más útiles para turistas (top 15)
  const tiposUtiles = ["restaurant","cafe","fast_food","bar","hotel","pharmacy","hospital",
    "bank","atm","fuel","bus_station","bus_stop","taxi","supermarket","mall",
    "attraction","museum","viewpoint","park","cinema","theatre"];
  
  for (const tipo of tiposUtiles) {
    const lugares = neoguia[tipo];
    if (!lugares || lugares.length === 0) continue;
    const label = traducTipos[tipo] || tipo;
    // Mostrar hasta 15 por tipo (no saturar el contexto)
    const muestra = lugares.slice(0, 15);
    ctx += `\n### ${label} (${lugares.length} en total)\n`;
    for (const l of muestra) {
      ctx += `- ${l.nombre} (${l.lat?.toFixed(3)},${l.lon?.toFixed(3)})${l.direccion ? " · " + l.direccion : ""}\n`;
    }
    if (lugares.length > 15) ctx += `... y ${lugares.length - 15} más\n`;
  }
  return ctx;
}

function construirContexto(lang) {
  const leer = (f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
    } catch {
      return null;
    }
  };
  const gastronomia = leer("gastronomia.json");
  const sitios = leer("sitios-turisticos.json");
  const eventos = leer("eventos.json");

  let ctx = "";

  if (gastronomia && Array.isArray(gastronomia.locales)) {
    ctx += "\n## RESTAURANTES (gastronomía tradicional de la campiña)\n";
    for (const l of gastronomia.locales) {
      ctx += `- ${l.nombre} [id:${l.id}] (${l.categoria}, ${l.distrito}): ${l.especialidad || ""}. ${l.direccion || ""}. ${l.horario || ""}. ~${l.precioRef || "?"}\n`;
    }
  }

  if (sitios && Array.isArray(sitios.sitios)) {
    ctx += "\n## SITIOS TURÍSTICOS Y LUGARES DE INTERÉS\n";
    for (const s of sitios.sitios) {
      ctx += `- ${s.nombre} [id:${s.id}] (${s.categoria}, ${s.zona}): ${txt(s.descripcion, lang)} ${s.direccion || ""}. ${txt(s.horario, lang)} ${txt(s.precioRef, lang)}\n`;
    }
  }

  if (eventos) {
    ctx += "\n## EVENTOS\n";
    for (const r of eventos.recurrentes || []) {
      ctx += `- ${r.nombre} (recurrente): ${txt(r.cuando, lang)}. ${r.lugar || ""}. ${txt(r.descripcion, lang)}\n`;
    }
    for (const f of eventos.fechados || []) {
      ctx += `- ${f.nombre} (anual, ${txt(f.fecha, lang)}): ${txt(f.descripcion, lang)}\n`;
    }
  }

  return ctx || "(sin datos)";
}

const router = Router();

// POST /chat — el bot de la guía
router.post("/chat", async (req, res) => {
  const { pregunta, lang } = req.body || {};
  const idioma = lang === "en" ? "en" : "es";

  if (!pregunta || typeof pregunta !== "string" || pregunta.trim().length < 2 || pregunta.length > 500) {
    return res.status(400).json({
      error: idioma === "en" ? "Invalid question (2–500 chars)" : "Pregunta inválida (2–500 caracteres)",
    });
  }

  // Rate limit por IP
  const ip = (
    req.headers["x-client-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "?"
  ).toString();
  const hoy = new Date().toISOString().slice(0, 10);
  if (!USOS[ip] || USOS[ip].fecha !== hoy) USOS[ip] = { fecha: hoy, count: 0 };
  if (USOS[ip].count >= 20) {
    return res.status(429).json({
      error: idioma === "en" ? "Daily question limit reached. Come back tomorrow!" : "Límite diario de preguntas alcanzado. ¡Vuelve mañana! 🦞",
    });
  }
  USOS[ip].count++;

  try {
    const contexto = construirContexto(idioma);
    // Cargar contexto de neoguia (3K lugares OSM) en paralelo
    const neoguia = await cargarResumenNeoguia();
    const ctxNeoguia = construirContextoNeoguia(neoguia, idioma);
    const contextoFull = contexto + ctxNeoguia;
    const system = idioma === "en"
      ? `You are the AI assistant of "Arequipa Guía Total", a complete city guide for Arequipa, Peru. Answer ONLY using the guide data below. Be concise, warm and helpful (2-6 sentences). If the answer is not in the data, say so and suggest the closest option from the data. Include the place id like [id:X] when you recommend a specific place. Reply in English.\n\nGUIDE DATA:\n${contextoFull}`
      : `Eres el asistente IA de "Arequipa Guía Total", la guía completa de Arequipa, Perú. Responde SOLO con los datos de la guía de abajo. Sé conciso, cálido y útil (2-6 frases). Si la respuesta no está en los datos, dilo y sugiere la opción más cercana de los datos. Incluye el id como [id:X] cuando recomiendes un lugar concreto. Responde en español.\n\nDATOS DE LA GUÍA:\n${contextoFull}`;

    const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: pregunta.trim() },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      console.error("[guia-chat] LLM HTTP", resp.status);
      return res.status(502).json({
        error: idioma === "en" ? "The assistant is unavailable right now" : "El asistente no está disponible en este momento 🦞",
      });
    }

    const data = await resp.json();
    const msg = data.choices?.[0]?.message;
    const respuesta = (msg?.content?.trim()) || (msg?.reasoning?.trim()) || "...";
    res.json({ ok: true, respuesta, lang: idioma });
  } catch (e) {
    console.error("[guia-chat]", e.message);
    res.status(502).json({
      error: idioma === "en" ? "The assistant is unavailable right now" : "El asistente no está disponible en este momento 🦞",
    });
  }
});

export default router;