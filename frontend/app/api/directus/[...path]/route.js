// Proxy Directus CMS → backend 8055 (same-origin, sin CORS)
const DIRECTUS = process.env.DIRECTUS_URL || "http://localhost:8055";

export async function GET(request, { params }) {
  const { path } = params || {};
  const url = new URL(request.url);
  const queryString = url.search || "";
  const target = `${DIRECTUS}/${(path || []).join("/")}${queryString}`;

  try {
    const r = await fetch(target, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    return Response.json(data, { status: r.status });
  } catch {
    return Response.json({ error: "Directus no disponible", data: [] }, { status: 200 });
  }
}