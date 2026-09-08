"use client";
import { useState, useMemo, useEffect } from "react";
import data from "../../data/sitios-turisticos.json";

// Claves API = criterios del backend directorios.js (colección "sitios")
const CRIT = ["belleza", "acceso", "servicio", "limpieza", "precio"];
const CRIT_ES = data.meta.criteriosVoto.es;
const CRIT_EN = data.meta.criteriosVoto.en;

const T = {
  es: {
    buscar: " Buscar sitio, zona… (ej: mirador, Santa Catalina, Misti)",
    todasZonas: "Todas las zonas",
    todasCats: "Todas las categorías",
    de: "de",
    calificar: " Calificar este sitio",
    porCalificar: "por calificar",
    usuarios: "voto{v}",
    tuExperiencia: "Tu experiencia — toca las estrellas (1-5 cada criterio):",
    comentario: "Comentario (opcional, máx 300)",
    phComentario: "Ej: Las vistas del Misti al atardecer son espectaculares…",
    ultimoCom: "Último comentario:",
    comentariosRec: "Comentarios recientes:",
    cancelar: "Cancelar",
    enviando: "Enviando…",
    enviar: " Enviar calificación",
    calificaLos: "Califica los 5 criterios para enviar",
    notaSpam: "1 voto por sitio al día por IP · anónimo · sin login (fase 1)",
    sinResultados: "Sin resultados para «{q}». Prueba: mirador, Santa Catalina, sillar, Misti, termales…",
    gracias: "¡Gracias! Tu calificación se guardó ",
    errorRed: "Error de red. Intenta de nuevo.",
    errorGuardar: "Error al guardar",
    mapa: " mapa",
    hintChat: "¿Dudas? Pregúntale al bot de la guía  — responde con los datos de esta guía",
    votaron: "usuarios",
  },
  en: {
    buscar: " Search place, area… (e.g.: viewpoint, Santa Catalina, Misti)",
    todasZonas: "All areas",
    todasCats: "All categories",
    de: "of",
    calificar: " Rate this place",
    porCalificar: "unrated",
    usuarios: "vote{v}",
    tuExperiencia: "Your experience — tap the stars (1-5 each criterion):",
    comentario: "Comment (optional, max 300)",
    phComentario: "E.g.: The Misti views at sunset are spectacular…",
    ultimoCom: "Latest comment:",
    comentariosRec: "Recent comments:",
    cancelar: "Cancel",
    enviando: "Sending…",
    enviar: " Send rating",
    calificaLos: "Rate all 5 criteria to send",
    notaSpam: "1 vote per place per day per IP · anonymous · no login (phase 1)",
    sinResultados: "No results for «{q}». Try: viewpoint, Santa Catalina, sillar, Misti, hot springs…",
    gracias: "Thanks! Your rating was saved ",
    errorRed: "Network error. Try again.",
    errorGuardar: "Error saving",
    mapa: " map",
    hintChat: "Questions? Ask the guide's bot  — it answers with this guide's data",
    votaron: "users",
  },
};

function Badge({ children, color }) {
  const c = {
    teal: "bg-teal-100 text-teal-800 border-teal-300",
    amber: "bg-amber-100 text-amber-800 border-amber-300",
    stone: "bg-stone-100 text-stone-700 border-stone-300",
    unesco: "bg-amber-200 text-amber-900 border-amber-400 font-semibold",
  }[color] || "bg-gray-100 text-gray-700 border-gray-300";
  return <span className={`text-xs px-2 py-1 rounded-full border ${c}`}>{children}</span>;
}

function RankingBars({ summary, labels, t }) {
  const useUser = summary && summary.total > 0 && summary.promedios;
  return (
    <div className="space-y-1 mt-3">
      {CRIT.map((k, i) => {
        const v = useUser ? summary.promedios[k] : null;
        const pct = v ? (v / 5) * 100 : 0;
        return (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-gray-500">{labels[i]}</span>
            <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${v ? "bg-teal-600" : "bg-stone-300"}`} style={{ width: `${v ? pct : 0}%` }} />
            </div>
            <span className={`w-16 text-right ${v ? "text-teal-700 font-semibold" : "text-stone-400"}`}>
              {v ? `${v}/5` : t.porCalificar}
            </span>
          </div>
        );
      })}
      {useUser && (
        <p className="text-xs text-teal-700 font-medium">
           {summary.totalGeneral}/5 ({summary.total} {t.usuarios.replace("{v}", summary.total !== 1 ? "s" : "")})
        </p>
      )}
    </div>
  );
}

function StarRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-sm text-stone-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-2xl leading-none transition ${n <= value ? "text-amber-500" : "text-stone-300 hover:text-amber-300"}`}
            aria-label={`${label} ${n}`}
          ></button>
        ))}
      </div>
      <span className="text-xs text-stone-500 w-8">{value ? `${value}/5` : "—"}</span>
    </div>
  );
}

export default function TurismoClient({ lang = "es" }) {
  const { meta, categorias, zonas, sitios } = data;
  const t = T[lang] || T.es;
  const critLabels = lang === "es" ? CRIT_ES : CRIT_EN;
  const zonaLabel = (z) => (lang === "es" ? z : zonas[z] || z);
  const catLabel = (c) => categorias[c]?.[lang] || c;

  const [q, setQ] = useState("");
  const [zona, setZona] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [summaries, setSummaries] = useState({});
  const [selected, setSelected] = useState(null);
  const [scores, setScores] = useState({ belleza: 0, acceso: 0, servicio: 0, limpieza: 0, precio: 0 });
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch("/api/directorios/sitios/summary")
      .then((r) => r.json())
      .then((d) => {
        if (d.locales) {
          const m = {};
          for (const s of d.locales) m[s.localId] = s;
          setSummaries(m);
        }
      })
      .catch(() => {});
  }, []);

  const zonasUsadas = useMemo(() => [...new Set(sitios.map((s) => s.zona))], [sitios]);
  const filtrados = useMemo(() => sitios.filter((s) => {
    if (zona !== "todas" && s.zona !== zona) return false;
    if (categoria !== "todas" && s.categoria !== categoria) return false;
    const term = q.trim().toLowerCase();
    if (term) {
      const hay = `${s.nombre} ${s.zona} ${s.direccion} ${s.descripcion[lang] || s.descripcion.es}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  }), [q, zona, categoria, lang]);

  const openModal = (s) => {
    setSelected(s);
    setScores({ belleza: 0, acceso: 0, servicio: 0, limpieza: 0, precio: 0 });
    setComentario("");
    setMsg(null);
  };

  const canSend = CRIT.every((k) => scores[k] >= 1 && scores[k] <= 5);

  const enviar = async () => {
    if (!selected || !canSend || sending) return;
    setSending(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/directorios/sitios/${selected.id}/voto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, comentario: comentario.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg({ type: "error", text: d.error || t.errorGuardar });
      } else {
        setSummaries((prev) => ({ ...prev, [selected.id]: d }));
        setMsg({ type: "ok", text: t.gracias });
        setTimeout(() => setSelected(null), 1200);
      }
    } catch {
      setMsg({ type: "error", text: t.errorRed });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* HERO */}
      <section className="relative min-h-[46vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-800 via-stone-700 to-stone-900" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <p className="text-sm tracking-widest uppercase opacity-80">Centro Histórico UNESCO · sillar · Misti · campiña</p>
          <h1 className="text-4xl md:text-6xl font-extrabold mt-3 leading-tight">
            {meta.seccion[lang]}
          </h1>
          <p className="mt-4 text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
            {lang === "es"
              ? "25 fichas verificadas: Catedral de sillar, Santa Catalina, miradores del Misti, molinos coloniales y termales — con calificación de usuarios en 5 criterios."
              : "25 verified listings: the silla Cathedral, Santa Catalina, Misti viewpoints, colonial mills and hot springs — with user ratings on 5 criteria."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Badge color="teal">25 {lang === "es" ? "sitios" : "places"}</Badge>
            <Badge color="stone">7 {lang === "es" ? "zonas" : "areas"}</Badge>
            <Badge color="unesco">UNESCO 2000</Badge>
            <Badge color="amber">ES · EN</Badge>
            <Badge color="teal"> Bot IA</Badge>
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section className="bg-teal-50 border-y border-teal-100 py-5 px-6 sticky top-12 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.buscar}
            className="flex-1 min-w-[240px] px-4 py-2 rounded-lg border border-stone-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none text-sm"
          />
          <select value={zona} onChange={(e) => setZona(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white">
            <option value="todas">{t.todasZonas} ({zonasUsadas.length})</option>
            {zonasUsadas.map((z) => <option key={z} value={z}>{zonaLabel(z)}</option>)}
          </select>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white">
            <option value="todas">{t.todasCats}</option>
            {Object.entries(categorias).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
          </select>
          <span className="text-sm text-gray-600 whitespace-nowrap"><b className="text-teal-700">{filtrados.length}</b> {t.de} 25</span>
        </div>
      </section>

      {/* FICHAS */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((s) => {
            const summary = summaries[s.id];
            return (
              <article key={s.id} id={`ficha-${s.id}`} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge color="teal">{catLabel(s.categoria)}</Badge>
                    {s.unesco && <Badge color="unesco">UNESCO</Badge>}
                    <Badge color="stone">{zonaLabel(s.zona)}</Badge>
                  </div>
                  <h3 className="font-bold text-lg mt-3 text-stone-900">{s.nombre}</h3>
                  <p className="text-sm text-gray-700 mt-2">{s.descripcion[lang] || s.descripcion.es}</p>
                  <p className="text-xs text-gray-500 mt-3">
                     {s.direccion} ·{" "}
                    <a
                      href={`https://maps.google.com/?q=${s.coords?.lat},${s.coords?.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 underline"
                    >{t.mapa}</a>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                     {s.horario?.[lang] || s.horario?.es} ·  {s.precioRef?.[lang] || s.precioRef?.es}
                  </p>
                  <RankingBars summary={summary} labels={critLabels} t={t} />
                  {summary?.comentarios?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-stone-100">
                      <p className="text-xs font-semibold text-stone-600">{t.ultimoCom}</p>
                      <p className="text-xs text-stone-600 italic">“{summary.comentarios[0].texto}”</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 bg-teal-50 border-t border-teal-100 text-xs text-teal-700 flex justify-between items-center">
                  <button onClick={() => openModal(s)} className="font-semibold hover:text-teal-800">{t.calificar}</button>
                  <span className="text-stone-500">{summary?.total > 0 ? ` ${summary.totalGeneral}/5` : "—"}</span>
                </div>
              </article>
            );
          })}
        </div>
        {filtrados.length === 0 && (
          <p className="text-center text-gray-500 py-16">{t.sinResultados.replace("{q}", q)}</p>
        )}
      </section>

      {/* MODAL CALIFICAR */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !sending && setSelected(null)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-stone-200 p-5 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-stone-900">{selected.nombre}</h3>
                <p className="text-xs text-stone-500">{catLabel(selected.categoria)} · {zonaLabel(selected.zona)}</p>
                {summaries[selected.id]?.total > 0 && (
                  <p className="text-xs text-teal-700 mt-1"> {summaries[selected.id].totalGeneral}/5 ({summaries[selected.id].total} {t.votaron})</p>
                )}
              </div>
              <button onClick={() => !sending && setSelected(null)} className="text-stone-400 hover:text-stone-700 text-2xl leading-none px-2">×</button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm font-semibold text-stone-700">{t.tuExperiencia}</p>
              {CRIT.map((k, i) => (
                <StarRow key={k} label={critLabels[i]} value={scores[k]} onChange={(v) => setScores((s) => ({ ...s, [k]: v }))} />
              ))}
              <div className="pt-2">
                <label className="text-sm font-medium text-stone-700">{t.comentario}</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value.slice(0, 300))}
                  placeholder={t.phComentario}
                  className="mt-1 w-full border border-stone-300 rounded-lg p-3 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none"
                  rows={3}
                />
                <p className="text-xs text-stone-400 text-right">{comentario.length}/300</p>
              </div>
              {msg && (
                <div className={`text-sm p-3 rounded-lg ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>
              )}
              {summaries[selected.id]?.comentarios?.length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-xs font-semibold text-stone-600 mb-2">{t.comentariosRec}:</p>
                  {summaries[selected.id].comentarios.map((c, i) => (
                    <p key={i} className="text-xs text-stone-600 bg-stone-50 rounded p-2 mb-1">“{c.texto}” <span className="text-stone-400">— {c.fecha}</span></p>
                  ))}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 flex gap-3">
              <button onClick={() => !sending && setSelected(null)} className="flex-1 py-2 rounded-lg border border-stone-300 text-sm">{t.cancelar}</button>
              <button
                onClick={enviar}
                disabled={!canSend || sending}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white ${canSend && !sending ? "bg-teal-600 hover:bg-teal-700" : "bg-stone-300 cursor-not-allowed"}`}
              >{sending ? t.enviando : t.enviar}</button>
            </div>
            {!canSend && <p className="text-xs text-stone-400 text-center pb-3">{t.calificaLos}</p>}
            <p className="text-xs text-stone-400 text-center pb-4 px-4">{t.notaSpam}</p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <section className="bg-stone-900 text-stone-200 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-bold text-white">{t.hintChat}</h3>
          <p className="text-sm mt-2 text-stone-300">
            {lang === "es"
              ? "Fichas bilingües ES/EN con calificación de usuarios en 5 criterios (belleza · acceso · servicio · limpieza · precio). El Centro Histórico de Arequipa es Patrimonio de la Humanidad UNESCO desde el año 2000."
              : "Bilingual ES/EN listings with user ratings on 5 criteria (beauty · access · service · cleanliness · value). Arequipa's Historic Centre is a UNESCO World Heritage Site since 2000."}
          </p>
          <p className="text-xs mt-4 text-stone-400">
            {lang === "es"
              ? "Fuente: sitios-turisticos.json v1 (Wikipedia Centro Histórico UNESCO + conocimiento local) · Arequipa Guía Total · Hermes 164.68.126.30:3005"
              : "Source: sitios-turisticos.json v1 (Wikipedia UNESCO Historic Centre + local knowledge) · Arequipa Guide · Hermes 164.68.126.30:3005"}
          </p>
        </div>
      </section>
    </div>
  );
}