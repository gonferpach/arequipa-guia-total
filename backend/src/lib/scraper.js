// backend/src/lib/scraper.js
// Scraper de redes sociales (Instagram público, Facebook, TikTok) con fetch + cheerio.
// - Instagram: fetch a la página pública del perfil y parsea el JSON embebido
//   (window._sharedData / scripts ld+json). Fallback mock si Instagram bloquea (429/login wall).
// - Facebook: fetch público y parseo básico con cheerio (meta description, og:image).
// - TikTok: fetch público del perfil, meta tags / JSON embebido. Fallback mock.
//
// Config: SCRAPER_ENABLED=true|false (default true). Si Instagram responde
// login-wall o 429 se devuelve mockData con flag `mock: true` para que la demo fluya.

import * as cheerio from "cheerio";

const SCRAPER_ENABLED = (process.env.SCRAPER_ENABLED || "true") !== "false";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const fetchWithTimeout = async (url, { timeoutMs = 8000, headers = {} } = {}) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, "Accept-Language": "es-PE,es;q=0.9,en;q=0.8", ...headers },
      redirect: "follow",
    });
  } finally {
    clearTimeout(t);
  }
};

const cleanHandle = (handle) =>
  String(handle || "").trim().replace(/^@/, "").replace(/\/+$/, "").split("/").pop().toLowerCase();

// ---------------- Instagram ----------------

export async function scrapeInstagram(handle) {
  const h = cleanHandle(handle);
  if (!h) return { ok: false, error: "handle vacío" };
  if (!SCRAPER_ENABLED) return { ok: true, mock: true, ...mockInstagram(h) };

  try {
    const res = await fetchWithTimeout(`https://www.instagram.com/${h}/`, {
      headers: { Accept: "text/html", "Sec-Fetch-Mode": "navigate" },
    });
    if (res.status === 429 || res.status === 302) {
      return { ok: true, mock: true, source: "rate-limited", ...mockInstagram(h) };
    }
    if (!res.ok) {
      return { ok: true, mock: true, source: `http-${res.status}`, ...mockInstagram(h) };
    }
    const html = await res.text();
    const data = parseInstagramHtml(html, h);
    if (data) return { ok: true, mock: false, source: "instagram.com", ...data };
    // Login wall / JS-only -> mock para demo
    return { ok: true, mock: true, source: "login-wall", ...mockInstagram(h) };
  } catch (err) {
    console.warn("[scraper] instagram falló:", err.message);
    return { ok: true, mock: true, source: "error", ...mockInstagram(h) };
  }
}

function parseInstagramHtml(html, handle) {
  // 1) JSON embebido clásico
  const mShared = html.match(/window\._sharedData\s*=\s*(\{.*?\});<\/script>/s);
  if (mShared) {
    try {
      const json = JSON.parse(mShared[1]);
      const user =
        json?.entry_data?.ProfilePage?.[0]?.graphql?.user ||
        json?.entry_data?.ProfilePage?.[0]?.user;
      if (user) return igFromGraphqlUser(user);
    } catch { /* sigue con ld+json */ }
  }

  // 2) ld+json
  const $ = cheerio.load(html);
  let parsed = null;
  $('script[type="application/ld+json"]').each((_i, el) => {
    if (parsed) return;
    try {
      const ld = JSON.parse($(el).contents().text());
      if (ld && (ld["@type"] === "ProfilePage" || ld.mainEntityofPage)) {
        parsed = {
          bio: ld.description || "",
          followers: null,
          posts: [],
          photos: ld.image ? [ld.image] : [],
        };
      }
    } catch { /* ignora */ }
  });

  // 3) meta description: "123K Followers, 500 Following, 89 Posts - See Instagram photos and videos from ..."
  if (!parsed) {
    const desc = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
    const ogImg = $('meta[property="og:image"]').attr("content") || "";
    const stats = desc.match(/([\d.,KM]+)\s*(?:Followers|followers)/);
    if (desc && desc.toLowerCase().includes("instagram")) {
      parsed = {
        bio: desc.replace(/\s*-?\s*See Instagram photos.*$/i, ""),
        followers: stats ? stats[1] : null,
        posts: [],
        photos: ogImg ? [ogImg] : [],
      };
    }
  }
  return parsed;
}

function igFromGraphqlUser(user) {
  const posts = (user.edge_owner_to_timeline_media?.edges || []).map((e) => {
    const n = e.node || {};
    return {
      id: n.shortcode || n.id,
      caption: n.edge_media_to_caption?.edges?.[0]?.node?.text || "",
      image: n.thumbnail_src || n.display_url || "",
      likes: n.edge_liked_by?.count ?? null,
      comments: n.edge_media_to_comment?.count ?? null,
    };
  });
  return {
    bio: user.biography || "",
    fullName: user.full_name || "",
    followers: user.edge_followed_by?.count ?? null,
    posts,
    photos: posts.map((p) => p.image).filter(Boolean).slice(0, 12),
  };
}

function mockInstagram(handle) {
  const seed = [...handle].reduce((a, c) => a + c.charCodeAt(0), 0);
  const palettes = [
    ["#1f2937", "#3b82f6", "#e5e7eb"],
    ["#7c2d12", "#ea580c", "#fef3c7"],
    ["#064e3b", "#10b981", "#ecfdf5"],
  ];
  return {
    handle,
    bio: `Bienvenido al perfil de @${handle}. (datos mock — Instagram bloqueó el scraping público)`,
    fullName: handle,
    followers: 100 + (seed % 500),
    posts: [
      { id: `mock-ig-1`, caption: "Nuestro trabajo de hoy ✨", image: "", likes: seed % 50 },
      { id: `mock-ig-2`, caption: "Atendiendo con la mejor energía", image: "", likes: (seed * 2) % 80 },
    ],
    photos: [],
    palette: palettes[seed % palettes.length],
  };
}

// ---------------- Facebook ----------------

export async function scrapeFacebook(url) {
  if (!url) return { ok: false, error: "url vacía" };
  if (!SCRAPER_ENABLED) return { ok: true, mock: true, ...mockFacebook(url) };

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return { ok: true, mock: true, source: `http-${res.status}`, ...mockFacebook(url) };
    const html = await res.text();
    const $ = cheerio.load(html);

    const bio =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
    const name = $('meta[property="og:title"]').attr("content") || "";
    const photo = $('meta[property="og:image"]').attr("content") || "";
    const likes = bio.match(/([\d.,KM]+)\s*(?:likes|Me gusta)/i)?.[1] || null;

    if (bio || name) {
      return {
        ok: true, mock: false, source: "facebook.com",
        name, bio, likes, followers: likes, posts: [], photos: photo ? [photo] : [],
      };
    }
    return { ok: true, mock: true, source: "login-wall", ...mockFacebook(url) };
  } catch (err) {
    console.warn("[scraper] facebook falló:", err.message);
    return { ok: true, mock: true, source: "error", ...mockFacebook(url) };
  }
}

function mockFacebook(url) {
  const page = cleanHandle(url);
  return {
    url: page,
    name: page,
    bio: `Página de Facebook de ${page}. (datos mock — Facebook requiere login para scraping)`,
    likes: null, posts: [], photos: [],
  };
}

// ---------------- TikTok ----------------

export async function scrapeTikTok(handle) {
  const h = cleanHandle(handle);
  if (!h) return { ok: false, error: "handle vacío" };
  if (!SCRAPER_ENABLED) return { ok: true, mock: true, ...mockTikTok(h) };

  try {
    const res = await fetchWithTimeout(`https://www.tiktok.com/@${h}`);
    if (!res.ok) return { ok: true, mock: true, source: `http-${res.status}`, ...mockTikTok(h) };
    const html = await res.text();
    const $ = cheerio.load(html);

    // SIGI_STATE / __UNIVERSAL_DATA_FOR_REHYDRATION__
    let data = null;
    const mUni = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(\{.*?\})<\/script>/s);
    if (mUni) {
      try {
        const uni = JSON.parse(mUni[1]);
        const user = uni?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct?.author
          || uni?.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo;
        if (user) {
          const u = user.author || user;
          data = {
            bio: u.signature || "",
            followers: u.followerCount ?? null,
            likes: u.heartCount ?? null,
            posts: [],
            photos: [],
          };
        }
      } catch { /* meta fallback */ }
    }
    if (!data) {
      const desc = $('meta[property="og:description"]').attr("content") || "";
      const img = $('meta[property="og:image"]').attr("content") || "";
      if (desc) {
        const followers = desc.match(/([\d.,KM]+)\s*(?:followers|Followers)/i)?.[1] || null;
        data = { bio: desc, followers, likes: null, posts: [], photos: img ? [img] : [] };
      }
    }
    if (data) return { ok: true, mock: false, source: "tiktok.com", ...data };
    return { ok: true, mock: true, source: "login-wall", ...mockTikTok(h) };
  } catch (err) {
    console.warn("[scraper] tiktok falló:", err.message);
    return { ok: true, mock: true, source: "error", ...mockTikTok(h) };
  }
}

function mockTikTok(handle) {
  const seed = [...handle].reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    handle,
    bio: `@${handle} en TikTok. (datos mock — TikTok bloquea scraping sin API)`,
    followers: 50 + (seed % 1000),
    likes: seed % 5000,
    posts: [], photos: [],
  };
}

// ---------------- Agregador ----------------

/**
 * scrapeAll({ instagram, facebook, tiktok, website })
 * Scrapea las redes provistas y devuelve datos consolidados para enriquecer la landing:
 * { bio, posts, photos, palette, sources, mocks }
 */
export async function scrapeAll({ instagram, facebook, tiktok, website } = {}) {
  const [ig, fb, tt] = await Promise.all([
    instagram ? scrapeInstagram(instagram) : null,
    facebook ? scrapeFacebook(facebook) : null,
    tiktok ? scrapeTikTok(tiktok) : null,
  ]);

  const sources = [];
  const mocks = [];
  const posts = [];
  const photos = [];
  const bios = [];

  for (const [net, res] of [["instagram", ig], ["facebook", fb], ["tiktok", tt]]) {
    if (!res) continue;
    sources.push(net);
    if (res.mock) mocks.push(net);
    if (res.bio) bios.push(`${net}: ${res.bio}`);
    if (Array.isArray(res.posts)) posts.push(...res.posts.slice(0, 6));
    if (Array.isArray(res.photos)) photos.push(...res.photos.filter(Boolean).slice(0, 6));
  }

  const bio = bios.join(" | ").slice(0, 2000) || null;
  const palette = ig?.palette || null;

  return {
    bio,
    posts,
    photos,
    palette,
    sources,
    mocks,
    website: website || null,
    raw: { instagram: ig, facebook: fb, tiktok: tt },
  };
}