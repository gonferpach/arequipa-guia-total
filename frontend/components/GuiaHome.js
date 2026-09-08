// GuiaHome — home de la Arequipa Guia Total (server component, bilingue)
const LIVE = [
  {
    href: "/restaurantes",
    hrefEn: "/en/restaurantes",
    tag: "SABOR",
    es: ["Restaurantes", "Picanterias tradicionales y restaurantes de todo tipo, con mapa, precio de referencia y distrito."],
    en: ["Restaurants", "Traditional picanterias and restaurants of every kind, with map, reference prices and district."],
  },
  {
    href: "/cafeterias",
    hrefEn: "/en/cafeterias",
    tag: "CAFE",
    es: ["Cafeterias", "Cafe de especialidad, barras de espresso y chocolaterias para la tarde arequipena."],
    en: ["Coffee shops", "Specialty coffee, espresso bars and chocolate houses for the Arequipa afternoon."],
  },
  {
    href: "/vida-nocturna",
    hrefEn: "/en/vida-nocturna",
    tag: "NOCHE",
    es: ["Centros Nocturnos", "Discotecas, bares, pubs y cocteleria. Direccion, horario y calificacion de cada local."],
    en: ["Nightlife", "Clubs, bars, pubs and cocktail spots. Address, hours and ratings for each venue."],
  },
  {
    href: "/hoteles",
    hrefEn: "/en/hoteles",
    tag: "SUENO",
    es: ["Hoteles y Hostales", "Donde dormir por zona y presupuesto, con sello visible de cochera cuando el dato existe."],
    en: ["Hotels and Hostels", "Where to stay by area and budget, with a visible parking badge whenever confirmed."],
  },
  {
    href: "/gastronomia",
    hrefEn: "/gastronomia",
    tag: "FUEGO",
    es: ["Gastronomia tradicional", "48 locales en 8 distritos de la campina: picanterias, chicharronerias y huariques. Califica con 6 criterios."],
    en: ["Traditional food", "48 venues across 8 countryside districts: picanterias, chicharronerias and huariques. Rate them on 6 criteria."],
  },
  {
    href: "/turismo",
    hrefEn: "/en/turismo",
    tag: "RUTA",
    es: ["Sitios turisticos", "25 fichas: Centro Historico UNESCO, Santa Catalina, miradores del Misti, molinos y termales. Califica con 5 criterios."],
    en: ["Top attractions", "25 listings: UNESCO Historic Centre, Santa Catalina, Misti viewpoints, mills and hot springs. Rate them on 5 criteria."],
  },
  {
    href: "/eventos",
    hrefEn: "/en/eventos",
    tag: "PLAN",
    es: ["Agenda y eventos", "Feria de Yanahuara, tour de picanterias, mercado San Camilo, Fiestas de Agosto y mas."],
    en: ["What's on & events", "Yanahuara fair, picanteria tours, San Camilo market, August Fiestas and more."],
  },
  {
    href: "/transporte",
    hrefEn: "/en/transporte",
    tag: "MOVER",
    es: ["Transporte y movilidad", "Paradas de bus, terminales, taxis, gasolineras y estacionamientos. Datos de OpenStreetMap 2026."],
    en: ["Transport & mobility", "Bus stops, terminals, taxis, gas stations and parking. OpenStreetMap 2026 data."],
  },
];

const PROX = [
  { tag: "PASADO", es: ["Historicos", "Casonas, templos y la historia del sillar."], en: ["Historic sites", "Mansions, temples and the sillar story."] },
  { tag: "AIRE", es: ["Aire libre", "Trekking Misti/Chachani, lagunas y campina."], en: ["Outdoors", "Misti/Chachani trekking, lagoons and countryside."] },
  { tag: "TABLAS", es: ["Teatros y cultura", "Salas, penas y vida cultural."], en: ["Theatre & culture", "Venues, penas and cultural life."] },
  { tag: "TIENDA", es: ["Malls y compras", "Centros comerciales y mercados."], en: ["Malls & shopping", "Shopping centres and markets."] },
  { tag: "BRUJULA", es: ["Agencias y tours", "Operadores y tours certificados."], en: ["Agencies & tours", "Certified operators and tours."] },
  { tag: "DATO", es: ["Info practica", "Clima, altura, seguridad y moneda."], en: ["Practical info", "Weather, altitude, safety and money."] },
];

export default function GuiaHome({ lang = "es" }) {
  const es = lang === "es";
  const t = es
    ? {
        kicker: "Ciudad blanca de sillar · UNESCO 2000 · bilingue",
        titulo: "Arequipa Guia Total",
        sub: "La guia completa de Arequipa: come donde los locales, camina el Centro Historico y planifica tu semana, con calificaciones de viajeros y un bot que responde con los datos de la guia.",
        seccionesLive: "Secciones disponibles",
        seccionesProx: "Proximamente",
        badge: "LIVE",
        cta: "Explorar",
        botHint: "En cada pagina, el bot Pregunta a la Guia responde con los datos reales de la guia, en espanol o ingles.",
        footer: "Arequipa Guia Total v1 — restaurantes, cafeterias, vida nocturna, hoteles, sitios y eventos con calificacion de usuarios (fase 1: 1 voto por ficha/dia/IP, sin login).",
      }
    : {
        kicker: "White city of sillar · UNESCO 2000 · bilingual",
        titulo: "The Complete Arequipa Guide",
        sub: "The full Arequipa guide: eat where locals eat, walk the Historic Centre and plan your week, with traveller ratings and a bot that answers with the guide's own data.",
        seccionesLive: "Available now",
        seccionesProx: "Coming soon",
        badge: "LIVE",
        cta: "Explore",
        botHint: "On every page, the Ask the Guide bot answers with the guide's real data, in Spanish or English.",
        footer: "Arequipa Guide v1 — restaurants, coffee, nightlife, hotels, attractions and events with user ratings (phase 1: 1 vote per place/day/IP, no login).",
      };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* HERO */}
      <section className="relative min-h-[55vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-800 to-stone-800" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
          <p className="text-sm tracking-widest uppercase opacity-80">{t.kicker}</p>
          <h1 className="text-5xl md:text-7xl font-extrabold mt-3 leading-tight">{t.titulo}</h1>
          <p className="mt-5 text-lg md:text-xl opacity-90 max-w-3xl mx-auto">{t.sub}</p>
          <div className="mt-7 flex flex-wrap gap-2 justify-center text-xs">
            <span className="px-3 py-1 rounded-full border border-amber-300/60 bg-amber-400/20 font-semibold">UNESCO 2000</span>
            <span className="px-3 py-1 rounded-full border border-white/40 bg-white/10">ES · EN</span>
            <span className="px-3 py-1 rounded-full border border-white/40 bg-white/10">Bot IA</span>
            <span className="px-3 py-1 rounded-full border border-white/40 bg-white/10">Calificaciones de usuarios</span>
          </div>
        </div>
      </section>

      {/* LIVE */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-extrabold text-stone-900">{t.seccionesLive}</h2>
        <div className="grid gap-5 md:grid-cols-3 mt-6">
          {LIVE.map((s) => (
            <a
              key={s.href}
              href={es ? s.href : s.hrefEn}
              className="group bg-white border-2 border-amber-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-amber-400 transition flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest text-amber-700">{s.tag}</span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-600 text-white tracking-wider">{t.badge}</span>
                </div>
                <h3 className="font-bold text-xl mt-4 text-stone-900 group-hover:text-amber-700 transition">{(es ? s.es : s.en)[0]}</h3>
                <p className="text-sm text-gray-600 mt-2">{(es ? s.es : s.en)[1]}</p>
              </div>
              <div className="px-6 pb-5 pt-1 text-sm font-semibold text-amber-700 group-hover:translate-x-1 transition">{t.cta} </div>
            </a>
          ))}
        </div>
      </section>

      {/* PROXIMAMENTE */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <h2 className="text-2xl font-extrabold text-stone-900">{t.seccionesProx}</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mt-6">
          {PROX.map((s) => (
            <div key={s.tag} className="bg-stone-50 border border-stone-200 rounded-2xl p-5 opacity-75">
              <span className="text-[11px] font-bold tracking-widest text-stone-500">{s.tag}</span>
              <h3 className="font-bold text-sm mt-2 text-stone-700">{(es ? s.es : s.en)[0]}</h3>
              <p className="text-xs text-stone-500 mt-1">{(es ? s.es : s.en)[1]}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900">
          {t.botHint}
        </div>
      </section>

      {/* FOOTER */}
      <section className="bg-stone-900 text-stone-300 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm">{t.footer}</p>
          <p className="text-xs mt-3 text-stone-500">Hermes 164.68.126.30:3005 · Arequipa Guia Total · 2026</p>
        </div>
      </section>
    </div>
  );
}
