"use client";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import PlaceCard from "./PlaceCard";
import { CATEGORIAS, mapGoogleCategory, normalizeGoogle, normalizeGastronomia } from "../lib/categorias";

const CategoryMap = dynamic(() => import("./CategoryMap"), { ssr: false });

const GOOGLE_CATS_POR_SECCION = {
  restaurantes: null, // + gastronomia Directus
  cafeterias: null,
  "vida-nocturna": null,
  hoteles: null,
};

export function detailHrefFor(base) {
  return (place) => {
    if (place.source === "gastronomia") return `/gastronomia#local-${place.localId}`;
    return `${base === "/en" ? "/en" : ""}/lugar/${place.id}`;
  };
}

export default function CategoriaClient({ categoria, lang = "es" }) {
  const es = lang === "es";
  const meta = CATEGORIAS[categoria];
  const [lugares, setLugares] = useState([]);
  const [gastro, setGastro] = useState([]);
  const [q, setQ] = useState("");
  const [distrito, setDistrito] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError(false);
    const p1 = fetch(
      "/api/directus/items/lugares_google?limit=1000&fields=id,title,category,address,phone,website,rating,reviews_count,latitude,longitude"
    )
      .then((r) => r.json())
      .then((d) => (Array.isArray(d.data) ? d.data : []))
      .catch(() => []);
    const p2 =
      categoria === "restaurantes"
        ? fetch("/api/directus/items/gastronomia?limit=100")
            .then((r) => r.json())
            .then((d) => (Array.isArray(d.data) ? d.data : []))
            .catch(() => [])
        : Promise.resolve([]);
    Promise.all([p1, p2]).then(([g, gt]) => {
      if (!vivo) return;
      setLugares(g.map(normalizeGoogle).filter((p) => mapGoogleCategory(p.category) === categoria));
      setGastro((gt || []).map(normalizeGastronomia));
      setCargando(false);
      if (g.length === 0 && (categoria !== "restaurantes" || gt.length === 0)) setError(true);
    });
    return () => {
      vivo = false;
    };
  }, [categoria]);

  const todos = useMemo(() => [...gastro, ...lugares], [gastro, lugares]);
  const distritos = useMemo(() => [...new Set(todos.map((p) => p.district).filter(Boolean))].sort(), [todos]);

  const filtrados = useMemo(
    () =>
      todos.filter((p) => {
        if (distrito !== "todos" && p.district !== distrito) return false;
        const s = q.trim().toLowerCase();
        if (s) {
          const hay = `${p.title} ${p.district} ${p.category} ${p.address} ${p.desc}`.toLowerCase();
          if (!hay.includes(s)) return false;
        }
        return true;
      }),
    [todos, q, distrito]
  );

  const T = es
    ? {
        buscar: "Buscar por nombre, distrito o plato...",
        todosDistritos: "Todos los distritos",
        de: "de",
        lugares: "locales",
        cargando: "Cargando locales desde la guia...",
        sinResultados: "Sin resultados. Prueba con otro nombre o distrito.",
        sinDatos: "No se pudieron cargar los datos. Intenta de nuevo en unos minutos.",
      }
    : {
        buscar: "Search by name, district or dish...",
        todosDistritos: "All districts",
        de: "of",
        lugares: "venues",
        cargando: "Loading venues from the guide...",
        sinResultados: "No results. Try another name or district.",
        sinDatos: "Could not load data. Try again in a few minutes.",
      };

  const baseDetalle = es ? "" : "/en";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="relative flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-800 to-stone-800" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">
          <p className="text-sm tracking-widest uppercase opacity-80">
            Arequipa Guia Total · {es ? meta.es : meta.en}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">{es ? meta.es : meta.en}</h1>
          <p className="mt-4 text-lg opacity-90">{es ? meta.descEs : meta.descEn}</p>
        </div>
      </section>

      <section className="bg-stone-50 border-y border-stone-200 py-5 px-6 sticky top-12 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={T.buscar}
            className="flex-1 min-w-[240px] px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
          />
          <select
            value={distrito}
            onChange={(e) => setDistrito(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white"
          >
            <option value="todos">
              {T.todosDistritos} ({distritos.length})
            </option>
            {distritos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            <b className="text-amber-700">{filtrados.length}</b> {T.de} {todos.length} {T.lugares}
          </span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        {cargando && <p className="text-center text-gray-500 py-16">{T.cargando}</p>}
        {!cargando && todos.length === 0 && <p className="text-center text-red-500 py-16">{T.sinDatos}</p>}
        {!cargando && todos.length > 0 && (
          <>
            <CategoryMap places={filtrados} detailHref={detailHrefFor(baseDetalle)} />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-8">
              {filtrados.map((p) => (
                <PlaceCard key={`${p.source}-${p.id}`} place={p} lang={lang} detailHref={detailHrefFor(baseDetalle)} />
              ))}
            </div>
            {filtrados.length === 0 && (
              <p className="text-center text-gray-500 py-16">{T.sinResultados}</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// Re-export para chequeos rapidos en build/tests
export { GOOGLE_CATS_POR_SECCION };
