// backend/src/lib/openship.js
// Cliente de deploy automático vía OpenShip (164.68.126.30:4100).
// Estrategia MVP (por orden de preferencia):
//   1. OpenShip API: POST /api/apps con INTERNAL_TOKEN (si OPENSHIP_URL responde)
//   2. Local: genera HTML estático en OPENSHIP_LANDINGS_DIR (default /opt/landings/{slug})
//      y deja instrucciones para servirlo con nginx/docker.
// Si nada disponible, devuelve el HTML generado para que el caller lo guarde.

import fs from "fs";
import path from "path";

const OPENSHIP_URL = (process.env.OPENSHIP_URL || "").replace(/\/+$/, "");
const OPENSHIP_TOKEN = process.env.OPENSHIP_TOKEN || process.env.INTERNAL_TOKEN || "";
const LANDINGS_DIR = process.env.OPENSHIP_LANDINGS_DIR || "/opt/landings";
const PUBLIC_LANDINGS_BASE = process.env.PUBLIC_LANDINGS_BASE || "";

const fetchWithTimeout = async (url, opts = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
};

// ---------- Generación de HTML estático ----------

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function section(title, body) {
  if (!body) return "";
  return `
  <section style="padding:3rem 1.5rem;max-width:900px;margin:0 auto">
    <h2 style="color:${""}">${esc(title)}</h2>
    <p style="line-height:1.7;color:#374151">${esc(body)}</p>
  </section>`;
}

/**
 * renderStaticHtml(landing) -> HTML completo autocontenido con SEO meta tags incluidos.
 */
export function renderStaticHtml(landing) {
  const redes = landing.redes || {};
  const palette = landing.palette || { primary: "#155e75", secondary: "#06b6d4", accent: "#ecfeff" };
  const fotos = (landing.fotos || []).filter(Boolean);
  const scrapedFotos = (landing.scrapedData?.photos || []).filter(Boolean);
  const gallery = [...fotos, ...scrapedFotos].slice(0, 9);

  const meta = landing.seo ? renderMetaTagsInline(landing.seo) : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${meta}
  <style>
    *{margin:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#111827}
    header{background:linear-gradient(135deg,${palette.primary},${palette.secondary});color:#fff;padding:4rem 1.5rem;text-align:center}
    header h1{font-size:2.5rem;margin-bottom:.5rem}
    header p{opacity:.92;max-width:640px;margin:0 auto;line-height:1.6}
    h2{color:${palette.primary};margin-bottom:1rem}
    .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;padding:0 1.5rem}
    .gallery img{width:100%;border-radius:12px;aspect-ratio:1;object-fit:cover;background:${palette.accent}}
    .contact{background:${palette.accent};border-radius:16px;padding:2rem;margin-top:1rem}
    .btn{display:inline-block;margin:.4rem .5rem 0 0;padding:.7rem 1.4rem;border-radius:10px;background:${palette.primary};color:#fff;text-decoration:none;font-weight:600}
    footer{background:#111827;color:#9ca3af;padding:2rem 1.5rem;text-align:center;margin-top:3rem;font-size:.9rem}
  </style>
</head>
<body>
  <header>
    <h1>${esc(landing.name)}</h1>
    <p>${esc(landing.description)}</p>
  </header>
  ${section("Visión", landing.vision)}
  ${section("Misión", landing.mision)}
  ${section("Nuestra historia", landing.historia)}
  ${section("Quiénes somos", landing.quienesSomos)}
  ${gallery.length ? `
  <section style="padding:3rem 1.5rem;max-width:900px;margin:0 auto">
    <h2 style="color:${palette.primary}">Galería</h2>
    <div class="gallery">${gallery.map((f) => `<img src="${esc(f)}" alt="${esc(landing.name)}" loading="lazy">`).join("")}</div>
  </section>` : ""}
  <section style="padding:3rem 1.5rem;max-width:900px;margin:0 auto">
    <div class="contact">
      <h2 style="color:${palette.primary}">Contacto</h2>
      ${landing.telefono ? `<p>📞 <a href="tel:${esc(landing.telefono)}">${esc(landing.telefono)}</a></p>` : ""}
      ${landing.email ? `<p>✉️ <a href="mailto:${esc(landing.email)}">${esc(landing.email)}</a></p>` : ""}
      ${landing.direccion ? `<p>📍 ${esc(landing.direccion)}</p>` : ""}
      <div style="margin-top:1rem">
        ${redes.whatsapp ? `<a class="btn" href="${esc(redes.whatsapp)}">WhatsApp</a>` : ""}
        ${redes.instagram ? `<a class="btn" href="${esc(redes.instagram)}">Instagram</a>` : ""}
        ${redes.facebook ? `<a class="btn" href="${esc(redes.facebook)}">Facebook</a>` : ""}
        ${redes.tiktok ? `<a class="btn" href="${esc(redes.tiktok)}">TikTok</a>` : ""}
        ${redes.youtube ? `<a class="btn" href="${esc(redes.youtube)}">YouTube</a>` : ""}
      </div>
    </div>
  </section>
  <footer>
    <p>© ${new Date().getFullYear()} ${esc(landing.name)}. Landing generada con 2braind Landing Factory.</p>
  </footer>
</body>
</html>`;
}

function renderMetaTagsInline(seo) {
  const lines = [];
  const put = (a, k, v) => v && lines.push(`<meta ${a}="${esc(k)}" content="${esc(v)}">`);
  lines.push(`<title>${esc(seo.title)}</title>`);
  put("name", "description", seo.description);
  if (seo.keywords?.length) put("name", "keywords", seo.keywords.join(", "));
  put("property", "og:title", seo.og?.title);
  put("property", "og:description", seo.og?.description);
  put("property", "og:type", seo.og?.type || "website");
  put("property", "og:image", seo.og?.image);
  put("property", "og:url", seo.og?.url);
  put("name", "twitter:card", seo.twitter?.card || "summary");
  put("name", "twitter:title", seo.twitter?.title);
  put("name", "twitter:description", seo.twitter?.description);
  return lines.filter(Boolean).join("\n  ");
}

// ---------- Deploy ----------

async function tryOpenshipApi(slug, html) {
  if (!OPENSHIP_URL || !OPENSHIP_TOKEN) return null;
  try {
    // 1) health check rápido
    const health = await fetchWithTimeout(`${OPENSHIP_URL}/api/health`, { method: "GET" }, 4000);
    if (!health.ok) return null;

    // 2) crear app en OpenShip
    const res = await fetchWithTimeout(`${OPENSHIP_URL}/api/apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENSHIP_TOKEN}`,
        "x-internal-token": OPENSHIP_TOKEN,
      },
      body: JSON.stringify({
        name: `landing-${slug}`,
        slug,
        type: "static",
        files: { "index.html": html },
        description: `Landing ${slug} generada por 2braind Landing Factory`,
      }),
    });
    if (!res.ok) {
      console.warn(`[openship] API respondió ${res.status}; usando fallback local`);
      return null;
    }
    const data = await res.json().catch(() => ({}));
    return { method: "openship-api", url: data.url || data.domain || null, raw: data };
  } catch (err) {
    console.warn("[openship] API no disponible:", err.message);
    return null;
  }
}

/**
 * deployLanding(slug, landing)
 * Deploya la landing (HTML estático). Devuelve:
 * { ok, method, url, path, instructions }
 */
export async function deployLanding(slug, landing) {
  if (!slug || !landing) return { ok: false, error: "slug y landing requeridos" };

  const html = renderStaticHtml(landing);

  // 1) Intento vía OpenShip API
  const viaApi = await tryOpenshipApi(slug, html);
  if (viaApi) {
    return { ok: true, ...viaApi, htmlLength: html.length };
  }

  // 2) Fallback local: escribir en /opt/landings/{slug}/index.html
  const dir = path.join(LANDINGS_DIR, slug);
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    return {
      ok: true,
      method: "local-static",
      path: path.join(dir, "index.html"),
      url: PUBLIC_LANDINGS_BASE ? `${PUBLIC_LANDINGS_BASE.replace(/\/+$/, "")}/${slug}/` : null,
      instructions: `HTML estático generado en ${dir}/index.html. Sírvelo con: docker run -d --name nginx-landings -p 8080:80 -v ${LANDINGS_DIR}:/usr/share/nginx/html:ro nginx`,
      htmlLength: html.length,
    };
  } catch (err) {
    // 3) Sin permisos de FS: devolver HTML para que el caller lo guarde
    return {
      ok: false,
      error: `No se pudo escribir en ${LANDINGS_DIR}: ${err.message}`,
      html,
      instructions: `Guarda el HTML manualmente o configura OPENSHIP_URL + OPENSHIP_TOKEN.`,
    };
  }
}