"use client";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  mapGoogleCategory,
  normalizeGoogle,
  normalizeGastronomia,
} from "../lib/categorias";
import { normalizeSitio, buildItinerarios } from "../lib/itinerarios";

const CategoryMap = dynamic(() => import("./CategoryMap"), { ssr: false });

function detailHrefFor(base) {
  return (place) => {
    if (place.source === "gastronomia") return `/gastronomia#local-${place.localId}`;
    if (place.source === "sitios") return `${base === "/en" ? "/en" : ""}/turismo`;
    return `${base === "/en" ? "/en" : ""}/lugar/${place.id}`;
  };
}

export default function ItinerarioClient({ lang = "es" }) {
  const es = lang === "es";
  const [pools, setPools] = useState(null);
  const [tab, setTab] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    const g = fetch(
      "/api/directus/items/lugares_google?limit=1000&fields=id,title,category,address,phone,website,rating,reviews_count,latitude,longitude"
    ).then((r) => r.json()).then((d) => (Array.isArray(d.data) ? d.data : [])).catch(() => []);
    const s = fetch("/api/directus/items/sitios_turisticos?limit=100")
      .then((r) => r.json()).then((d) => (Array.isArray(d.data) ? d.data : [])).catch(() => []);
    const gt = fetch("/api/directus/items/gastronomia?limit=100")
      .then((r) => r.json()).then((d) => (Array.isArray(d.data) ? d.data : [])).catch(() => []);
    Promise.all([g, s, gt]).then(([gg, ss, tt]) => {
      if (!vivo) return;
      const norm = gg.map(normalizeGoogle);
      const por = (cat) => norm.filter((p) => mapGoogleCategory(p.category) === cat);
      setPools({
        sitios: ss.map(normalizeSitio),
        gastro: (tt || []).map(normalizeGastronomia),
        restaurantes: por("restaurantes"),
        cafeterias: por("cafeterias"),
        noche: por("vida-nocturna"),
        hoteles: por("hoteles"),
      });
      setCargando(false);
    });
    return () => { vivo = false; };
  }, []);

  const planes = useMemo(() => (pools ? buildItinerarios(pools, lang) : []), [pools, lang]);
  const plan = planes[tab];
  const paradas = useMemo(
    () => (plan ? plan.dias.flatMap((d) => d.paradas.map((p) => p.place)) : []),
    [plan]
  );

  const T = es
    ? { cargando: "Armando tus rutas con datos de la guia...", paradas: "paradas", ver: "Ver ficha" }
    : { cargando: "Building your routes with guide data...", paradas: "stops", ver: "View listing" };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="relative flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-800 to-stone-800" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">
          <p className="text-sm tracking-widest uppercase opacity-80">Arequipa Guia Total</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">
            {es ? "Itinerarios armados" : "Ready-made itineraries"}
          </h1>
          <p className="mt-4 text-lg opacity-90">
            {es
              ? "Rutas dia por dia: turismo, restaurante, cafe y noche, sin mezclar categorias."
              : "Day-by-day routes: attractions, restaurants, coffee and nightlife, each in its place."}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        {cargando && <p className="text-center text-gray-500 py-16">{T.cargando}</p>}
        {!cargando && plan && (
          <>
            <div className="flex flex-wrap gap-2 justify-center">
              {planes.map((p, i) => (
                <button
                  key={p.slug}
                  onClick={() => setTab(i)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold border transition ${
                    i === tab
                      ? "bg-amber-600 border-amber-600 text-white"
                      : "border-stone-300 text-stone-700 hover:border-amber-500"
                  }`}
                >
                  {p.titulo}
                </button>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-4">{plan.desc}</p>
            <div className="mt-6">
              <CategoryMap places={paradas} detailHref={detailHrefFor(es ? "" : "/en")} />
            </div>
            {plan.dias.map((d, di) => (
              <div key={di} className="mt-10">
                <h2 className="text-xl font-extrabold text-stone-900">{d.nombre}</h2>
                <ol className="mt-4 space-y-3">
                  {d.paradas.map((stop, si) => (
                    <li
                      key={si}
                      className="flex gap-4 bg-stone-50 border border-stone-200 rounded-xl p-4 items-start"
                    >
                      <div className="shrink-0 text-center">
                        <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center">
                          {si + 1}
                        </div>
                        <div className="text-xs font-semibold text-stone-600 mt-1">{stop.hora}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={detailHrefFor(es ? "" : "/en")(stop.place)}
                          className="font-bold text-stone-900 hover:text-amber-700"
                        >
                          {stop.place.title}
                        </a>
                        <p className="text-sm text-gray-600 mt-0.5">{stop.nota}</p>
                        <p className="text-xs text-stone-500 mt-1">
                          {stop.place.category} · {stop.place.district}
                          {stop.place.price ? ` · ${stop.place.price}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <p className="text-xs text-stone-500 mt-8 text-center">
              {paradas.length} {T.paradas} · {es ? "Mapa: OpenStreetMap" : "Map: OpenStreetMap"}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
