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

  const digits = (place.phone || "").replace(/\D/g, "");
  const movil = digits.length === 9 && digits.startsWith("9") ? `51${digits}` : digits.length === 11 && digits.startsWith("51") ? digits : null;
  const waText = encodeURIComponent(es ? `Hola, los encontre en Arequipa Guia Total y quiero info.` : `Hi, I found you on Arequipa Guide and would like info.`);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="relative flex items-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-800 to-stone-800" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 w-full">
          <a href={es ? "/guia" : "/en/guia"} className="text-sm text-amber-300 hover:underline">
            {es ? "Volver a la guia" : "Back to the guide"}
          </a>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {place.category && (
              <span className="text-xs px-2 py-1 rounded-full border border-amber-300/60 bg-amber-400/20">{place.category}</span>
            )}
            {place.district && (
              <span className="text-xs px-2 py-1 rounded-full border border-white/40 bg-white/10">{place.district}</span>
            )}
            {place.parking && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-600 font-semibold">{es ? "Con cochera" : "With parking"}</span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">{place.title}</h1>
          {place.address && <p className="mt-2 opacity-90">{place.address}</p>}
          <div className="flex flex-wrap gap-3 mt-6">
            {movil && (
              <a
                href={`https://wa.me/${movil}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 font-semibold text-sm"
              >
                {es ? "WhatsApp" : "WhatsApp"}
              </a>
            )}
            {digits && (
              <a
                href={`tel:+${digits.startsWith("51") ? digits : `51${digits}`}`}
                className="px-5 py-2.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-semibold text-sm"
              >
                {es ? "Llamar" : "Call"}
              </a>
            )}
            {place.latitude && place.longitude && (
              <a
                href={`https://maps.google.com/?q=${place.latitude},${place.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl border border-white/50 hover:border-white font-semibold text-sm"
              >
                {es ? "Como llegar" : "Directions"}
              </a>
            )}
          </div>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="max-w-2xl">
          <PlaceCard place={place} lang={lang} />
        </div>
        <div className="mt-6">
          <CategoryMap places={[place]} height={340} />
        </div>
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-semibold">
              {es ? "Es tu negocio?" : "Is this your business?"}
            </span>{" "}
            <span>
              {es
                ? "Reclama la ficha y edita fotos, carta, horarios y reservas."
                : "Claim the listing to edit photos, menu, hours and bookings."}
            </span>
            <div className="text-xs text-amber-700 mt-1">
              {es
                ? "Te atendemos por WhatsApp para verificar y publicar los cambios."
                : "We handle verification and publishing by WhatsApp."}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href="/admin"
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-sm whitespace-nowrap"
            >
              {es ? "Reclamar mi negocio" : "Claim my business"}
            </a>
            <a
              href={`https://wa.me/51939316437?text=${encodeURIComponent(es ? `Hola, quiero EDITAR la informacion de: ${place.title}` : `Hi, I want to EDIT info for: ${place.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-white border border-amber-600 text-amber-800 hover:bg-amber-100 font-semibold text-sm whitespace-nowrap"
            >
              {es ? "Editar informacion" : "Edit information"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
