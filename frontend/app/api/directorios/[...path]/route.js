// Proxy directorios (votos multi-colección) → backend 4005 (same-origin, sin CORS)
// GET  /api/directorios/sitios/summary
// POST /api/directorios/sitios/<id>/voto
const API =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4005";

const clientIp = (req) => {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  const xr = req.headers["x-real-ip"];
  if (xr) return String(xr).trim();
  return null;
};

export async function GET(request, { params }) {
  const { path } = params || {};
  const url = `${API}/api/directorios/${(path || []).map(encodeURIComponent).join("/")}`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    return Response.json(data, { status: r.status });
  } catch {
    return Response.json({ ok: false, locales: [] }, { status: 200 });
  }
}

export async function POST(request, { params }) {
  const { path } = params || {};
  if (!path || path.length !== 3 || path[2] !== "voto") {
    return Response.json({ error: "Ruta inválida" }, { status: 400 });
  }
  const coleccion = path[0];
  const id = path[1];
  try {
    const body = await request.json();
    const headers = { "Content-Type": "application/json" };
    const ip = clientIp(request);
    if (ip) headers["x-client-ip"] = ip;
    const r = await fetch(`${API}/api/directorios/${encodeURIComponent(coleccion)}/${encodeURIComponent(id)}/voto`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return Response.json(data, { status: r.status });
  } catch {
    return Response.json({ error: "No se pudo registrar el voto. Intenta de nuevo." }, { status: 502 });
  }
}