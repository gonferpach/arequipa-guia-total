"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PlaceCard from "./PlaceCard";
import { normalizeGoogle } from "../lib/categorias";

const CategoryMap = dynamic(() => import("./CategoryMap"), { ssr: false });

export default function LugarClient({ id, lang = "es" }) {
  const es = lang === "es";
  const [place, setPlace] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/directus/items/lugares_google/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return;
        if (d.data) setPlace(normalizeGoogle(d.data));
        else setError(true);
        setCargando(false);
      })
      .catch(() => {
        if (!vivo) return;
        setError(true);
        setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [id]);

  if (cargando)
    return (
      <p className="text-center text-gray-500 py-24">
        {es ? "Cargando ficha..." : "Loading listing..."}
      </p>
    );
  if (error || !place)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-gray-400">
          {es ? "Esta ficha no existe (todavia)." : "This listing does not exist (yet)."}
        </p>
        <a href={es ? "/guia" : "/en/guia"} className="text-amber-600 hover:underline font-semibold">
          {es ? "Volver a la guia" : "Back to the guide"}
        </a>
      </main>
    );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="max-w-4xl mx-auto px-6 py-10">
        <a
          href={es ? "/guia" : "/en/guia"}
          className="text-sm text-amber-700 hover:underline"
        >
          {es ? "Volver a la guia" : "Back to the guide"}
        </a>
        <div className="mt-4 max-w-2xl">
          <PlaceCard place={place} lang={lang} />
        </div>
        <div className="mt-6">
          <CategoryMap places={[place]} height={340} />
        </div>
      </section>
    </div>
  );
}
