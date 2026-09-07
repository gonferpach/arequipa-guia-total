// Proxy chat de la guía → backend 4005 (same-origin, sin CORS)
const API =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4005";

export async function POST(request) {
  try {
    const body = await request.json();
    const { pregunta, lang } = body || {};
    if (!pregunta || typeof pregunta !== "string" || pregunta.trim().length === 0) {
      return Response.json({ error: "Pregunta vacía" }, { status: 400 });
    }
    const headers = { "Content-Type": "application/json" };
    const xff = request.headers["x-forwarded-for"];
    if (xff) headers["x-client-ip"] = String(xff).split(",")[0].trim();
    const r = await fetch(`${API}/api/guia/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ pregunta: pregunta.slice(0, 500), lang }),
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return Response.json(data, { status: r.status });
  } catch {
    return Response.json({ error: "El asistente no está disponible 🦞" }, { status: 502 });
  }
}