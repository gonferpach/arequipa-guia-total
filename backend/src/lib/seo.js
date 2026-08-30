// backend/src/lib/seo.js
// Genera metadatos SEO (title, description, og tags) a partir de los datos del negocio
// y del contenido scrapeado. LLM mock: template strings deterministas.
// En producción se reemplaza por una llamada LLM real si hay OPENAI_API_KEY.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

function titleCase(str) {
  return String(str).replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

// ---- LLM mock: template strings ----

function mockSeo({ name, description, category, bio, city = "Arequipa" }) {
  const cleanName = titleCase(name || "Mi Negocio");
  const cat = category ? titleCase(category) : "Negocio";
  const firstSentence = String(description || bio || "").split(/[.!?]/)[0].trim() || `Descubre ${cleanName}`;

  const title = `${cleanName} | ${cat} en ${city}`.slice(0, 60);
  const metaDescription = `${firstSentence}. Visítanos en ${city} y conoce todo lo que ${cleanName} tiene para ti.`.slice(0, 155);
  const keywords = [name, category, city, "Perú", ...(String(bio || description || "").toLowerCase().match(/\b[a-záéíóúñ]{5,}\b/g) || []).slice(0, 8)]
    .filter(Boolean)
    .map((k) => String(k).toLowerCase())
    .slice(0, 10);

  return { title, description: metaDescription, keywords, model: "mock-llm" };
}

// ---- LLM real (opcional) ----

async function llmSeo(data) {
  const prompt = `Genera metadatos SEO en español para una landing page. Responde SOLO JSON válido con keys: title (max 60 chars), description (max 155 chars), keywords (array de 5-10 strings minúsculas).
Negocio: ${JSON.stringify(data)}`;
  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.SEO_LLM_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}`);
  const json = await res.json();
  const parsed = JSON.parse(json.choices[0].message.content);
  return { ...parsed, model: process.env.SEO_LLM_MODEL || "gpt-4o-mini" };
}

/**
 * generateSeo({ name, description, category, scrapedData, baseUrl })
 * Devuelve { title, description, keywords, og: { title, description, image, url, type }, twitter, model }
 */
export async function generateSeo({ name, description = "", category = "", scrapedData = null, baseUrl = "" } = {}) {
  const bio = scrapedData?.bio || "";
  const ogImage =
    (scrapedData?.photos && scrapedData.photos[0]) ||
    (Array.isArray(scrapedData?.posts) && scrapedData.posts[0]?.image) ||
    "";

  let seo;
  if (OPENAI_API_KEY) {
    try {
      seo = await llmSeo({ name, description, category, bio });
    } catch (err) {
      console.warn("[seo] LLM falló, usando mock:", err.message);
      seo = mockSeo({ name, description, category, bio });
    }
  } else {
    seo = mockSeo({ name, description, category, bio });
  }

  const og = {
    title: seo.title,
    description: seo.description,
    image: ogImage,
    url: baseUrl,
    type: "website",
    site_name: name,
  };

  const twitter = {
    card: ogImage ? "summary_large_image" : "summary",
    title: seo.title,
    description: seo.description,
    image: ogImage,
  };

  return { title: seo.title, description: seo.description, keywords: seo.keywords, og, twitter, model: seo.model };
}

/**
 * renderMetaTags(seo) -> string HTML con <meta> y <title> para el deploy estático.
 */
export function renderMetaTags(seo) {
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const lines = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}">`,
    seo.keywords?.length ? `<meta name="keywords" content="${esc(seo.keywords.join(", "))}">` : "",
    `<meta property="og:title" content="${esc(seo.og?.title)}">`,
    `<meta property="og:description" content="${esc(seo.og?.description)}">`,
    `<meta property="og:type" content="${esc(seo.og?.type || "website")}">`,
    seo.og?.image ? `<meta property="og:image" content="${esc(seo.og.image)}">` : "",
    seo.og?.url ? `<meta property="og:url" content="${esc(seo.og.url)}">` : "",
    `<meta name="twitter:card" content="${esc(seo.twitter?.card || "summary")}">`,
    `<meta name="twitter:title" content="${esc(seo.twitter?.title || seo.title)}">`,
    `<meta name="twitter:description" content="${esc(seo.twitter?.description || seo.description)}">`,
  ].filter(Boolean);
  return lines.join("\n  ");
}