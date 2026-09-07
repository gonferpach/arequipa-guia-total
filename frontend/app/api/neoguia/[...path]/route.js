// Proxy API neoguia → backend 3002 (lugares de OpenStreetMap)
const API = process.env.NEOGUIA_URL || "http://localhost:3002";

export async function GET(request, { params }) {
  const { path } = params || {};
  const url = new URL(request.url);
  const queryString = url.search ? url.search : "";
  const target = `${API}/api/${(path || []).join("/")}${queryString}`;

  try {
    const r = await fetch(target, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    return Response.json(data, { status: r.status });
  } catch {
    return Response.json(
      { error: "NeoGuía API no disponible", total: 0, data: [] },
      { status: 200 }
    );
  }
}