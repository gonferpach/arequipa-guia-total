// backend/src/lib/palette.js
// Extrae paleta de colores dominante de la foto principal.
// - Si hay foto + OPENAI_API_KEY o imagen accesible: intenta extraer color dominante vía pixel sampling
//   (módulo opcional node-vibrant/colorthief si está instalado; se carga lazy).
// - Fallback mock: paleta por categoría de negocio.

const CATEGORY_PALETTES = {
  salud: { primary: "#2563eb", secondary: "#0ea5e9", accent: "#f0f9ff", source: "category-salud" },
  clinica: { primary: "#2563eb", secondary: "#0ea5e9", accent: "#f0f9ff", source: "category-salud" },
  odontologia: { primary: "#0ea5e9", secondary: "#38bdf8", accent: "#f0f9ff", source: "category-salud" },
  restaurante: { primary: "#b45309", secondary: "#ea580c", accent: "#fef3c7", source: "category-restaurante" },
  comida: { primary: "#b45309", secondary: "#ea580c", accent: "#fff7ed", source: "category-restaurante" },
  gastronomia: { primary: "#9a3412", secondary: "#ea580c", accent: "#fef3c7", source: "category-restaurante" },
  cafe: { primary: "#78350f", secondary: "#d97706", accent: "#fffbeb", source: "category-restaurante" },
  belleza: { primary: "#be185d", secondary: "#ec4899", accent: "#fdf2f8", source: "category-belleza" },
  estetica: { primary: "#be185d", secondary: "#ec4899", accent: "#fdf2f8", source: "category-belleza" },
  tecnologia: { primary: "#4f46e5", secondary: "#06b6d4", accent: "#eef2ff", source: "category-tecnologia" },
  educacion: { primary: "#0f766e", secondary: "#14b8a6", accent: "#f0fdfa", source: "category-educacion" },
  inmobiliaria: { primary: "#1e3a8a", secondary: "#3b82f6", accent: "#eff6ff", source: "category-inmobiliaria" },
};

const DEFAULT_PALETTE = { primary: "#155e75", secondary: "#06b6d4", accent: "#ecfeff", source: "default" };

async function loadVibrant() {
  // node-vibrant es opcional: se usa si está instalado
  return import("node-vibrant").catch(() => null);
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

async function extractFromImage(imageUrl) {
  const vibrant = await loadVibrant();
  if (!vibrant) return null;
  try {
    const Vibrant = vibrant.Vibrant || vibrant.default?.Vibrant;
    if (!Vibrant) return null;
    const palette = await Vibrant.from(imageUrl).getPalette();
    const v = palette.Vibrant || palette.Muted || palette.DarkVibrant;
    const m = palette.LightMuted || palette.Muted || palette.Vibrant;
    if (!v) return null;
    return {
      primary: v.hex || rgbToHex(...v.rgb),
      secondary: m?.hex || rgbToHex(...(m?.rgb || v.rgb)),
      accent: palette.LightVibrant?.hex || "#ffffff",
      source: "photo-node-vibrant",
    };
  } catch (err) {
    console.warn("[palette] node-vibrant falló:", err.message);
    return null;
  }
}

/**
 * extractPalette({ photos, scrapedData, category })
 * Devuelve { primary, secondary, accent, source }.
 * Prioridad: palette del scraper (IG) > foto principal (node-vibrant) > categoría > default.
 */
export async function extractPalette({ photos = [], scrapedData = null, category = "" } = {}) {
  // 1) Palette extraída por el scraper (e.g. IG)
  if (scrapedData?.palette && Array.isArray(scrapedData.palette) && scrapedData.palette.length >= 2) {
    const [primary, secondary, accent] = scrapedData.palette;
    return { primary, secondary: secondary || primary, accent: accent || "#ffffff", source: "scraper-instagram" };
  }

  // 2) Foto principal con node-vibrant (si está instalado)
  const mainPhoto = (photos || []).find(Boolean);
  if (mainPhoto && /^https?:\/\//.test(mainPhoto)) {
    const fromImage = await extractFromImage(mainPhoto);
    if (fromImage) return fromImage;
  }

  // 3) Por categoría
  const cat = String(category || "").toLowerCase().trim();
  if (cat && CATEGORY_PALETTES[cat]) return CATEGORY_PALETTES[cat];
  for (const [key, pal] of Object.entries(CATEGORY_PALETTES)) {
    if (cat.includes(key)) return pal;
  }

  // 4) Default
  return { ...DEFAULT_PALETTE };
}