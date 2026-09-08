// Proxy API gastronomía  backend 4005 (same-origin, sin CORS para el browser)
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

// GET /api/gastro/votos  summary de todos los locales
export async function GET() {
  try {
    const r = await fetch(`${API}/api/gastronomia/summary`, { cache: "no-store" });
    if (!r.ok) return Response.json({ ok: false, locales: [] }, { status: 200 });
    return Response.json(await r.json());
  } catch {
    return Response.json({ ok: false, locales: [] }, { status: 200 });
  }
}

// POST /api/gastro/votos { localId, scores, comentario }  crea voto
export async function POST(request) {
  try {
    const body = await request.json();
    const { localId, scores, comentario } = body || {};
    if (!localId || !scores)
      return Response.json({ error: "localId y scores requeridos" }, { status: 400 });

    const headers = { "Content-Type": "application/json" };
    const ip = clientIp(request);
    if (ip) headers["x-client-ip"] = ip;

    const r = await fetch(`${API}/api/gastronomia/${localId}/voto`, {
      method: "POST",
      headers,
      body: JSON.stringify({ scores, comentario }),
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return Response.json(data, { status: r.status });
  } catch (err) {
    return Response.json(
      { error: "No se pudo registrar el voto. Intenta de nuevo." },
      { status: 502 }
    );
  }
}