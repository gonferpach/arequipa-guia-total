import data from "../../data/eventos.json";

const TIPOS = {
  "feria-artesanal": { es: "Feria artesanal", en: "Artisan fair", icon: "🧶" },
  "tour-gastronomico": { es: "Tour gastronómico", en: "Food tour", icon: "🍲" },
  mercado: { es: "Mercado", en: "Market", icon: "🧺" },
  festividad: { es: "Festividad", en: "Festivity", icon: "🎉" },
  "festival-gastronomico": { es: "Festival gastronómico", en: "Food festival", icon: "🥘" },
  "aniversario-distrital": { es: "Aniversario distrital", en: "District anniversary", icon: "🎈" },
};

export default function EventosClient({ lang = "es" }) {
  const es = lang === "es";
  const t = es
    ? {
        recurrentes: "Cada semana en Arequipa",
        recurrentesSub: "Experiencias recurrentes — planifica con anticipación",
        fechados: "Fiestas y festivales del año",
        fechadosSub: "Fechados anuales — fechas exactas en pasada de verificación",
        lugar: "Lugar",
        gratis: "Gratis",
        repiteAnual: "Se repite cada año",
        hint: "Pregúntale al bot de la guía por horarios, lugares y qué hacer 🦞",
        nota: "Horarios y precios con ~ son aproximados. Los eventos recurrentes (ferias y tours) operan todo el año salvo anuncios oficiales.",
      }
    : {
        recurrentes: "Every week in Arequipa",
        recurrentesSub: "Recurring experiences — plan ahead",
        fechados: "Fiestas & festivals of the year",
        fechadosSub: "Annual events — exact dates under verification",
        lugar: "Where",
        gratis: "Free",
        repiteAnual: "Happens every year",
        hint: "Ask the guide's bot about schedules, places and what to do 🦞",
        nota: "Schedules and prices marked with ~ are approximate. Recurring events (fairs and tours) run year-round unless officially cancelled.",
      };

  const tipoLabel = (tipo) => TIPOS[tipo]?.[lang] || tipo;
  const tipoIcon = (tipo) => TIPOS[tipo]?.icon || "📅";
  const fechaLabel = (f) => (typeof f === "string" ? f : f?.[lang] || f?.es || "");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* HERO */}
      <section className="relative min-h-[40vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-800 via-stone-700 to-stone-900" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">
          <p className="text-sm tracking-widest uppercase opacity-80">{es ? "Agenda viva · tradición todo el año" : "A living agenda · tradition year-round"}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">{data.meta.seccion[lang]}</h1>
          <p className="mt-4 text-lg opacity-90">
            {es
              ? "Ferias artesanales, tours de picanterías, mercados históricos y las grandes fiestas arequipeñas."
              : "Artisan fairs, picantería tours, historic markets and Arequipa's great fiestas."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center text-xs">
            <span className="px-2 py-1 rounded-full border border-white/40 bg-white/10">3 {es ? "recurrentes" : "recurring"}</span>
            <span className="px-2 py-1 rounded-full border border-white/40 bg-white/10">3 {es ? "anuales" : "annual"}</span>
            <span className="px-2 py-1 rounded-full border border-amber-300/60 bg-amber-400/20 font-semibold">🤖 Bot IA</span>
          </div>
        </div>
      </section>

      {/* RECURRENTES */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-extrabold text-stone-900">{t.recurrentes}</h2>
        <p className="text-sm text-stone-500 mb-6">{t.recurrentesSub}</p>
        <div className="grid gap-5 md:grid-cols-3">
          {data.recurrentes.map((ev) => (
            <article key={ev.id} id={`evento-${ev.id}`} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tipoIcon(ev.tipo)}</span>
                  <span className="text-xs px-2 py-1 rounded-full border border-orange-300 bg-orange-50 text-orange-800">{tipoLabel(ev.tipo)}</span>
                </div>
                <h3 className="font-bold text-lg mt-3 text-stone-900">{ev.nombre}</h3>
                <p className="mt-2 text-sm font-semibold text-orange-700">🗓 {ev.cuando?.[lang] || ev.cuando?.es}</p>
                <p className="text-xs text-gray-500 mt-1">📍 {ev.lugar}</p>
                <p className="text-xs text-gray-500">💰 {ev.precio?.[lang] || ev.precio?.es}</p>
                <p className="text-sm text-gray-700 mt-3">{ev.descripcion?.[lang] || ev.descripcion?.es}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FECHADOS */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-extrabold text-stone-900">{t.fechados}</h2>
        <p className="text-sm text-stone-500 mb-6">{t.fechadosSub}</p>
        <div className="grid gap-5 md:grid-cols-3">
          {data.fechados.map((ev) => (
            <article key={ev.id} id={`evento-${ev.id}`} className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tipoIcon(ev.tipo)}</span>
                  <span className="text-xs px-2 py-1 rounded-full border border-stone-300 bg-white text-stone-700">{tipoLabel(ev.tipo)}</span>
                </div>
                <h3 className="font-bold text-lg mt-3 text-stone-900">{ev.nombre}</h3>
                <p className="mt-2 text-sm font-semibold text-orange-700">🗓 {fechaLabel(ev.fecha)}</p>
                <p className="text-xs text-gray-500 mt-0.5">🔁 {t.repiteAnual}</p>
                <p className="text-sm text-gray-700 mt-3">{ev.descripcion?.[lang] || ev.descripcion?.es}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <section className="bg-stone-900 text-stone-200 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-bold text-white">{t.hint}</h3>
          <p className="text-sm mt-2 text-stone-300">{t.nota}</p>
          <p className="text-xs mt-4 text-stone-400">
            {es
              ? "Fuente: eventos.json v1 (arequipa.net/es/events + Wikipedia Arequipa) · Arequipa Guía Total · Hermes 164.68.126.30:3005"
              : "Source: eventos.json v1 (arequipa.net/es/events + Wikipedia Arequipa) · Arequipa Guide · Hermes 164.68.126.30:3005"}
          </p>
        </div>
      </section>
    </div>
  );
}