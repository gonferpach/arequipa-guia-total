// GuiaNav — barra de navegación de la Arequipa Guía Total (server component, sin hooks)
export default function GuiaNav({ lang = "es", switchHref = "/en/guia" }) {
  const es = lang === "es";
  const t = es
    ? { gastro: "Gastronomía", turismo: "Turismo", eventos: "Eventos", switch: "EN" }
    : { gastro: "Food", turismo: "Attractions", eventos: "Events", switch: "ES" };
  const base = es ? "" : "/en";
  return (
    <nav className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur text-stone-100 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
        <a href={`${base}/guia`} className="font-bold text-amber-400 whitespace-nowrap text-sm md:text-base">
          🦞 Arequipa Guía Total
        </a>
        <div className="flex items-center gap-3 md:gap-4 text-sm">
          <a href="/gastronomia" className="hover:text-amber-300 hidden sm:inline">{t.gastro}</a>
          <a href={`${base}/turismo`} className="hover:text-amber-300">{t.turismo}</a>
          <a href={`${base}/eventos`} className="hover:text-amber-300 hidden sm:inline">{t.eventos}</a>
          <a
            href={switchHref}
            className="px-2 py-0.5 rounded border border-stone-600 hover:border-amber-400 text-xs font-semibold"
          >
            {t.switch}
          </a>
        </div>
      </div>
    </nav>
  );
}