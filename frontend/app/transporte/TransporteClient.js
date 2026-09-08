"use client";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

const RutaMap = dynamic(() => import("./RutaMap"), { ssr: false });

const T = {
  es: {
    titulo: "Transporte y Movilidad",
    sub: "Paradas, terminales y las 100 rutas SIT de Arequipa",
    tabPuntos: "Puntos",
    tabRutas: "Rutas SIT",
    buscar: " Buscar por tipo o nombre…",
    buscarRuta: " Buscar ruta, origen o destino…",
    todos: "Todos los tipos",
    todosOp: "Todos los operadores",
    total: "lugares",
    totalRutas: "rutas",
    cargando: "Cargando desde OpenStreetMap…",
    cargandoRutas: "Cargando rutas SIT…",
    error: "No se pudieron cargar los datos. Intenta de nuevo.",
    verRecorrido: "Ver recorrido",
    origen: "Origen",
    destino: "Destino",
    operador: "Operador",
    tarifa: "Tarifa",
    variantes: "variantes OSM",
    verEnMapa: "Ver en mapa",
    sinResultados: "Sin resultados. Prueba con otro filtro.",
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
    sub: "Stops, terminals and Arequipa's 100 SIT bus routes",
    tabPuntos: "Places",
    tabRutas: "SIT Routes",
    buscar: " Search by type or name…",
    buscarRuta: " Search route, origin or destination…",
    todos: "All types",
    todosOp: "All operators",
    total: "places",
    totalRutas: "routes",
    cargando: "Loading from OpenStreetMap…",
    cargandoRutas: "Loading SIT routes…",
    error: "Could not load data. Try again.",
    verRecorrido: "View path",
    origen: "Origin",
    destino: "Destination",
    operador: "Operator",
    tarifa: "Fare",
    variantes: "OSM variants",
    verEnMapa: "View on map",
    sinResultados: "No results. Try another filter.",
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
  bus_stop: "",
  bus_station: "",
  taxi: "",
  fuel: "",
  parking: "🅿",
};

export default function TransporteClient({ lang = "es" }) {
  const t = T[lang] || T.es;
  const [tab, setTab] = useState("puntos");

  // PUNTOS
  const [lugares, setLugares] = useState([]);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // RUTAS
  const [rutas, setRutas] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [qRuta, setQRuta] = useState("");
  const [opSel, setOpSel] = useState("todos");
  const [cargandoRutas, setCargandoRutas] = useState(false);
  const [rutaSel, setRutaSel] = useState(null); // ruta en detalle
  const [rutaMapa, setRutaMapa] = useState(null); // ruta dibujada en mapa

  useEffect(() => {
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

  useEffect(() => {
    if (tab !== "rutas" || rutas.length) return;
    setCargandoRutas(true);
    fetch("/api/rutas")
      .then((r) => r.json())
      .then((d) => {
        setRutas(d.rutas || []);
        setOperadores(d.operadores || []);
        setCargandoRutas(false);
      })
      .catch(() => setCargandoRutas(false));
  }, [tab, rutas.length]);

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

  const conteo = useMemo(() => {
    const c = {};
    for (const l of lugares) c[l.tipo] = (c[l.tipo] || 0) + 1;
    return c;
  }, [lugares]);

  const rutasFiltradas = useMemo(() => {
    return rutas.filter((r) => {
      if (opSel !== "todos" && r.operador !== opSel) return false;
      const s = qRuta.trim().toLowerCase();
      if (s) {
        const hay = `${r.codigo} ${r.origen} ${r.destino} ${r.operador} ${r.ejemplo || ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [rutas, qRuta, opSel]);

  const verRecorrido = (r) => {
    setRutaSel(r);
    setRutaMapa(r);
    document.getElementById("mapa-rutas")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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
          {/* TABS */}
          <div className="mt-6 inline-flex rounded-full border border-white/40 bg-white/10 p-1 text-sm font-semibold">
            <button
              onClick={() => setTab("puntos")}
              className={`px-5 py-2 rounded-full transition ${tab === "puntos" ? "bg-white text-blue-900" : "text-white hover:bg-white/10"}`}
            >
              📍 {t.tabPuntos}
            </button>
            <button
              onClick={() => setTab("rutas")}
              className={`px-5 py-2 rounded-full transition ${tab === "rutas" ? "bg-white text-blue-900" : "text-white hover:bg-white/10"}`}
            >
              🚌 {t.tabRutas}{rutas.length ? ` (${rutas.length})` : ""}
            </button>
          </div>
        </div>
      </section>

      {tab === "puntos" && (
        <>
          {/* FILTROS PUNTOS */}
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

          {/* LISTADO PUNTOS */}
          <section className="max-w-6xl mx-auto px-6 py-10">
            {cargando && <p className="text-center text-gray-500 py-16">{t.cargando}</p>}
            {error && <p className="text-center text-red-500 py-16">{t.error}</p>}
            {!cargando && !error && (
              <>
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
                        <span className="text-2xl">{ICONS[l.tipo] || ""}</span>
                        <span className="text-xs px-2 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-800">{t.tipos[l.tipo] || l.tipo}</span>
                      </div>
                      <h3 className="font-bold text-lg mt-3 text-stone-900">{l.nombre}</h3>
                      {l.direccion && <p className="text-xs text-gray-500 mt-1"> {l.direccion}</p>}
                      {l.telefono && <p className="text-xs text-gray-500"> {l.telefono}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                         {l.lat?.toFixed(4)}, {l.lon?.toFixed(4)} ·{" "}
                        <a
                          href={`https://maps.google.com/?q=${l.lat},${l.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >{t.verEnMapa}</a>
                      </p>
                    </article>
                  ))}
                </div>
                {filtrados.length === 0 && (
                  <p className="text-center text-gray-500 py-16">{t.sinResultados}</p>
                )}
                {filtrados.length > 200 && (
                  <p className="text-center text-gray-400 text-sm mt-6">
                    {lang === "es" ? `Mostrando 200 de ${filtrados.length}. Afina tu búsqueda para ver más.` : `Showing 200 of ${filtrados.length}. Refine your search to see more.`}
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}

      {tab === "rutas" && (
        <>
          {/* FILTROS RUTAS */}
          <section className="bg-emerald-50 border-y border-emerald-100 py-5 px-6 sticky top-12 z-20 shadow-sm">
            <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center">
              <input
                value={qRuta}
                onChange={(e) => setQRuta(e.target.value)}
                placeholder={t.buscarRuta}
                className="flex-1 min-w-[240px] px-4 py-2 rounded-lg border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-sm"
              />
              <select value={opSel} onChange={(e) => setOpSel(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white max-w-[240px]">
                <option value="todos">🚌 {t.todosOp} ({rutas.length})</option>
                {operadores.map((op) => (
                  <option key={op} value={op}>{op} ({rutas.filter((r) => r.operador === op).length})</option>
                ))}
              </select>
              <span className="text-sm text-gray-600 whitespace-nowrap"><b className="text-emerald-700">{rutasFiltradas.length}</b> {t.totalRutas}</span>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-6 py-10">
            {cargandoRutas && <p className="text-center text-gray-500 py-16">{t.cargandoRutas}</p>}
            {!cargandoRutas && (
              <>
                {/* MAPA INTERACTIVO */}
                <div id="mapa-rutas" className="mb-6">
                  <RutaMap ruta={rutaMapa} lang={lang} />
                </div>

                {/* DETALLE SELECCIONADO */}
                {rutaSel && (
                  <div className="mb-6 rounded-2xl border-2 p-5 bg-white shadow-sm" style={{ borderColor: rutaSel.color || "#10b981" }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded-full" style={{ background: rutaSel.color }} />
                      <span className="font-extrabold text-xl">Ruta {rutaSel.codigo}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-stone-100 border border-stone-300">{rutaSel.operador}</span>
                      {rutaSel.tarifa && <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800">💰 {rutaSel.tarifa}</span>}
                    </div>
                    <p className="mt-2 text-sm">
                      <b>{t.origen}:</b> {rutaSel.origen} &nbsp;→&nbsp; <b>{t.destino}:</b> {rutaSel.destino}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {rutaSel.variantes} {t.variantes} · OSM #{(rutaSel.osm_ids || []).join(", #")}
                    </p>
                  </div>
                )}

                {/* LISTA RUTAS */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {rutasFiltradas.map((r, i) => (
                    <article
                      key={`${r.operador}-${r.codigo}-${i}`}
                      className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer ${rutaSel === r ? "ring-2" : ""}`}
                      style={{ borderColor: rutaSel === r ? r.color : undefined }}
                      onClick={() => setRutaSel(r)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: r.color }} />
                        <h3 className="font-bold truncate">Ruta {r.codigo}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{r.origen} → {r.destino}</p>
                      <p className="text-[11px] text-gray-400 mt-1 truncate">{r.operador}{r.tarifa ? ` · 💰 ${r.tarifa}` : ""}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); verRecorrido(r); }}
                        className="mt-3 w-full text-xs font-semibold px-3 py-2 rounded-lg text-white hover:opacity-90"
                        style={{ background: r.color || "#10b981" }}
                      >
                        🗺️ {t.verRecorrido}
                      </button>
                    </article>
                  ))}
                </div>
                {rutasFiltradas.length === 0 && (
                  <p className="text-center text-gray-500 py-16">{t.sinResultados}</p>
                )}
              </>
            )}
          </section>
        </>
      )}

      {/* FOOTER */}
      <section className="bg-stone-900 text-stone-200 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm">
            {lang === "es"
              ? "Datos de transporte desde OpenStreetMap (Overpass API, actualizados 2026). Incluye paradas de bus, terminales, taxis, gasolineras, estacionamientos y las 100 rutas SIT de Arequipa metropolitana."
              : "Transport data from OpenStreetMap (Overpass API, updated 2026). Includes bus stops, terminals, taxis, gas stations, parking and the 100 SIT routes of metropolitan Arequipa."}
          </p>
          <p className="text-xs mt-3 text-stone-400">Arequipa Guía Total · Hermes 164.68.126.30:3005</p>
        </div>
      </section>
    </div>
  );
}
