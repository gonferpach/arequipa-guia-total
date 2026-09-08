import { readFile } from "fs/promises";
import path from "path";
import bundled from "./rutas-sit.json";

// GET /api/rutas?operador=C4&q=texto
// Lee data/rutas-sit.json del repo (dev) o el JSON empaquetado junto a la ruta (Vercel).
async function loadRutas() {
  const candidates = [
    path.join(process.cwd(), "..", "data", "rutas-sit.json"), // repo root (dev local)
    path.join(process.cwd(), "data", "rutas-sit.json"),
    path.join(process.cwd(), "frontend", "..", "data", "rutas-sit.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf-8");
      const j = JSON.parse(raw);
      if (Array.isArray(j.rutas)) return j;
    } catch {
      /* siguiente candidato */
    }
  }
  return bundled;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const operador = (searchParams.get("operador") || "").trim().toLowerCase();
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const data = await loadRutas();
  let rutas = Array.isArray(data.rutas) ? data.rutas : [];

  if (operador && operador !== "todos") {
    rutas = rutas.filter((r) =>
      (r.operador || "").toLowerCase().includes(operador)
    );
  }
  if (q) {
    rutas = rutas.filter((r) =>
      `${r.codigo || ""} ${r.origen || ""} ${r.destino || ""} ${r.operador || ""} ${r.ejemplo || ""}`
        .toLowerCase()
        .includes(q)
    );
  }

  const operadores = [...new Set((data.rutas || []).map((r) => r.operador))].sort();

  return Response.json({
    total: rutas.length,
    total_rutas: data.total_rutas ?? data.rutas?.length ?? 0,
    actualizado: data.actualizado || null,
    operadores,
    rutas,
  });
}
