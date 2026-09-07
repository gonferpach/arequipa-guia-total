"use client";
import { useState, useEffect, useMemo } from "react";

const T = {
  es: {
    titulo: "Transporte y Movilidad",
    sub: "Paradas de bus, terminales, taxis, gasolineras y estacionamientos en Arequipa",
    buscar: "🔍 Buscar por tipo o nombre…",
    todos: "Todos los tipos",
    total: "lugares",
    cargando: "Cargando desde OpenStreetMap…",
    error: "No se pudieron cargar los datos. Intenta de nuevo.",
    tipos: {
      bus_stop: "Parada de bus",
      bus_station: "Terminal de bus",
      taxi: "Taxi",
      fuel: "Gasolinera",
      parking: "Estacionamiento",
    },
  },
  en: {
    titulo: "Transport & Mobility",
    sub: "Bus stops, terminals, taxis, gas stations and parking in Arequipa",
    buscar: "🔍 Search by type or name…",
    todos: "All types",
    total: "places",
    cargando: "Loading from OpenStreetMap…",
    error: "Could not load data. Try again.",
    tipos: {
      bus_stop: "Bus stop",
      bus_station: "Bus terminal",
      taxi: "Taxi",
      fuel: "Gas station",
      parking: "Parking",
    },
  },
};

const TIPOS_API = ["bus_stop", "bus_station", "taxi", "fuel", "parking"];
const ICONS = {
  bus_stop: "🚏",
  bus_station: "🚌",
  taxi: "🚕",
  fuel: "⛽",
  parking: "🅿️",
};

export default function TransporteClient({ lang = "es" }) {
  const t = T[lang] || T.es;
  const [lugares, setLugares] = useState([]);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Cargar lugares por tipo desde la API neoguia
    const tiposQuery = TIPOS_API.join(",");
    fetch(`/api/neoguia/lugares?limit=500&tipos=${tiposQuery}`)
      .then((r) => r.json())
      .then((d) => {
        setLugares(d.data || []);
        setCargando(false);
      })
      .catch(() => {
        setError(true);
        setCargando(false);
      });
  }, []);

  const filtrados = useMemo(() => {
    return lugares.filter((l) => {
      if (tipo !== "todos" && l.tipo !== tipo) return false;
      const s = q.trim().toLowerCase();
      if (s) {
        const hay = `${l.nombre} ${l.tipo} ${l.direccion || ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [lugares, q, tipo]);

  // Contar por tipo
  const conteo = useMemo(() => {
    const c = {};
    for (const l of lugares) c[l.tipo] = (c[l.tipo] || 0) + 1;
    return c;
  }, [lugares]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* HERO */}
      <section className="relative min-h-[40vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-stone-700 to-stone-900" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">
          <p className="text-sm tracking-widest uppercase opacity-80">{lang === "es" ? "Movilidad urbana · OpenStreetMap" : "Urban mobility · OpenStreetMap"}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">{t.titulo}</h1>
          <p className="mt-4 text-lg opacity-90">{t.sub}</p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center text-xs">
            {TIPOS_API.map((tp) => (
              <span key={tp} className="px-3 py-1 rounded-full border border-white/40 bg-white/10">
                {ICONS[tp]} {t.tipos[tp]} {conteo[tp] ? `(${conteo[tp]})` : ""}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section className="bg-blue-50 border-y border-blue-100 py-5 px-6 sticky top-12 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.buscar}
            className="flex-1 min-w-[240px] px-4 py-2 rounded-lg border border-stone-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
          />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white">
            <option value="todos">{t.todos}</option>
            {TIPOS_API.map((tp) => (
              <option key={tp} value={tp}>{ICONS[tp]} {t.tipos[tp]} ({conteo[tp] || 0})</option>
            ))}
          </select>
          <span className="text-sm text-gray-600 whitespace-nowrap"><b className="text-blue-700">{filtrados.length}</b> {t.total}</span>
        </div>
      </section>

      {/* LISTADO */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        {cargando && <p className="text-center text-gray-500 py-16">{t.cargando}</p>}
        {error && <p className="text-center text-red-500 py-16">{t.error}</p>}
        {!cargando && !error && (
          <>
            {/* MAPA LEAFLET */}
            <div className="mb-8 rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
              <iframe
                title="Mapa Arequipa"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=-71.6,-16.5,-71.4,-16.3&layer=mapnik&marker=-16.409,-71.537`}
                style={{ width: "100%", height: "400px", border: 0 }}
                loading="lazy"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtrados.slice(0, 200).map((l) => (
                <article key={l.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ICONS[l.tipo] || "📍"}</span>
                    <span className="text-xs px-2 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-800">{t.tipos[l.tipo] || l.tipo}</span>
                  </div>
                  <h3 className="font-bold text-lg mt-3 text-stone-900">{l.nombre}</h3>
                  {l.direccion && <p className="text-xs text-gray-500 mt-1">📍 {l.direccion}</p>}
                  {l.telefono && <p className="text-xs text-gray-500">📞 {l.telefono}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    🗺 {l.lat?.toFixed(4)}, {l.lon?.toFixed(4)} ·{" "}
                    <a
                      href={`https://maps.google.com/?q=${l.lat},${l.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >{lang === "es" ? "Ver en mapa" : "View on map"}</a>
                  </p>
                </article>
              ))}
            </div>
            {filtrados.length === 0 && (
              <p className="text-center text-gray-500 py-16">{lang === "es" ? "Sin resultados. Prueba con otro tipo de transporte." : "No results. Try another transport type."}</p>
            )}
            {filtrados.length > 200 && (
              <p className="text-center text-gray-400 text-sm mt-6">
                {lang === "es" ? `Mostrando 200 de ${filtrados.length}. Afina tu búsqueda para ver más.` : `Showing 200 of ${filtrados.length}. Refine your search to see more.`}
              </p>
            )}
          </>
        )}
      </section>

      {/* FOOTER */}
      <section className="bg-stone-900 text-stone-200 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm">
            {lang === "es"
              ? "Datos de transporte desde OpenStreetMap (Overpass API, actualizados 2026). Incluye paradas de bus, terminales, taxis, gasolineras y estacionamientos de Arequipa metropolitana."
              : "Transport data from OpenStreetMap (Overpass API, updated 2026). Includes bus stops, terminals, taxis, gas stations and parking in metropolitan Arequipa."}
          </p>
          <p className="text-xs mt-3 text-stone-400">Arequipa Guía Total · Hermes 164.68.126.30:3005</p>
        </div>
      </section>
    </div>
  );
}