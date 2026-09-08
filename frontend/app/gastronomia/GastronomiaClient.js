"use client";
import { useState, useMemo, useEffect } from "react";
import data from "../../data/gastronomia.json";

function Badge({ children, color }) {
  const c = {
    amber: "bg-amber-100 text-amber-800 border-amber-300",
    green: "bg-green-100 text-green-800 border-green-300",
    stone: "bg-stone-100 text-stone-700 border-stone-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
  }[color] || "bg-gray-100 text-gray-700 border-gray-300";
  return <span className={`text-xs px-2 py-1 rounded-full border ${c}`}>{children}</span>;
}

const CRITERIOS = ["precio","platos","atencion","limpieza","infraestructura","decoracion"];
const LABELS = { precio:"Precio", platos:"Platos", atencion:"Atención", limpieza:"Limpieza", infraestructura:"Infra", decoracion:"Decoración" };

function RankingBars({ ranking, summary }) {
  // Si hay votos de usuarios, muestra promedio ámbar + votos. Si no, gris "por calificar"
  const useUser = summary && summary.total > 0 && summary.promedios;
  return (
    <div className="space-y-1 mt-3">
      {CRITERIOS.map(k => {
        const v = useUser ? summary.promedios[k] : ranking[k];
        const pct = v ? (v/5)*100 : 0;
        const pending = v === null || v === undefined;
        return (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-gray-500">{LABELS[k]}</span>
            <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pending ? "bg-stone-300" : "bg-amber-600"}`} style={{width: `${pending ? 0 : pct}%`}} />
            </div>
            <span className={`w-16 text-right ${pending ? "text-stone-400" : "text-amber-700 font-semibold"}`}>{pending ? "por calificar" : `${v}/5`}</span>
          </div>
        );
      })}
      {useUser && (
        <p className="text-xs text-amber-700 font-medium"> {summary.totalGeneral}/5 ({summary.total} voto{summary.total!==1?'s':''}) — usuarios</p>
      )}
    </div>
  );
}

function StarRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-sm text-stone-700">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
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

export default function GastronomiaClient() {
  const { meta, distritos, locales } = data;
  const [q, setQ] = useState("");
  const [distrito, setDistrito] = useState("todos");
  const [categoria, setCategoria] = useState("todas");
  const [summaries, setSummaries] = useState({}); // localId -> {total, promedios, totalGeneral, comentarios}
  const [selected, setSelected] = useState(null);
  const [scores, setScores] = useState({ precio:0, platos:0, atencion:0, limpieza:0, infraestructura:0, decoracion:0 });
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch("/api/gastro/votos").then(r=>r.json()).then(d=>{
      if(d.locales) {
        const m={};
        for(const s of d.locales) m[s.localId]=s;
        setSummaries(m);
      }
    }).catch(()=>{});
  }, []);

  const filtrados = useMemo(() => locales.filter(l => {
    if (distrito !== "todos" && l.distrito !== distrito) return false;
    if (categoria !== "todas" && !l.categorias.includes(categoria)) return false;
    const s = q.trim().toLowerCase();
    if (s) {
      const hay = `${l.nombre} ${l.distrito} ${l.especialidad} ${l.direccion} ${l.categorias.join(" ")}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  }), [q, distrito, categoria]);

  const openModal = (local) => {
    setSelected(local);
    setScores({ precio:0, platos:0, atencion:0, limpieza:0, infraestructura:0, decoracion:0 });
    setComentario("");
    setMsg(null);
  };

  const canSend = CRITERIOS.every(k => scores[k] >=1 && scores[k] <=5);

  const enviar = async () => {
    if(!selected || !canSend || sending) return;
    setSending(true); setMsg(null);
    try{
      const r = await fetch("/api/gastro/votos",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ localId: selected.id, scores, comentario: comentario.trim() })
      });
      const d = await r.json();
      if(!r.ok){
        setMsg({ type:"error", text: d.error || "Error al guardar" });
      } else {
        setSummaries(prev=>({ ...prev, [selected.id]: d }));
        setMsg({ type:"ok", text: "¡Gracias! Tu calificación se guardó " });
        setTimeout(()=> setSelected(null), 1200);
      }
    } catch(e){
      setMsg({ type:"error", text:"Error de red. Intenta de nuevo."});
    } finally{ setSending(false); }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* HERO */}
      <section className="relative min-h-[52vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-800 via-orange-700 to-stone-800" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 30% 20%, white 1px, transparent 1px)", backgroundSize:"32px 32px"}} />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <p className="text-sm tracking-widest uppercase opacity-80">Campiña sillar · Misti · Loncco · Chicha de guiñapo</p>
          <h1 className="text-4xl md:text-6xl font-extrabold mt-3 leading-tight">Gastronomía tradicional<br/>Campiña Arequipeña</h1>
          <p className="mt-4 text-lg md:text-xl opacity-90 max-w-3xl mx-auto">48 locales verificados en 8 distritos · picanterías + chicharronerías + Ruta Senca + Ruta Loncco + huariques + queso helado · ranking 6 criterios único en Arequipa</p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Badge color="amber">8 distritos</Badge><Badge color="green">48 locales</Badge><Badge color="orange">6 categorías</Badge><Badge color="stone">Ranking 6 criterios</Badge>
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section className="bg-orange-50 border-y border-orange-100 py-5 px-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder=" Buscar local, distrito, plato… (ej: cuy, adobo, La Benita)"
            className="flex-1 min-w-[240px] px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
          />
          <select value={distrito} onChange={e => setDistrito(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white">
            <option value="todos">Todos los distritos (8)</option>
            {distritos.map(d => <option key={d.nombre} value={d.nombre}>{d.nombre}</option>)}
          </select>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white">
            <option value="todas">Todas las categorías</option>
            {meta.categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-sm text-gray-600 whitespace-nowrap"><b className="text-amber-700">{filtrados.length}</b> de 48</span>
        </div>
      </section>

      {/* MAPA DISTRITOS */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-amber-800">Mapa 8 distritos campiña</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {distritos.map(d => {
            const count = filtrados.filter(l=>l.distrito===d.nombre).length;
            const activo = distrito === d.nombre;
            return (
              <button key={d.nombre} onClick={() => setDistrito(activo ? "todos" : d.nombre)}
                className={`rounded-xl border p-4 text-left transition ${activo ? "border-amber-600 bg-amber-50 shadow-md" : "border-stone-200 bg-white hover:shadow-md"}`}>
                <div className="font-bold text-stone-800">{d.nombre}</div>
                <div className="text-xs text-gray-500 mt-1">{d.rol}</div>
                <div className="text-xs mt-2"><Badge color="amber">{count} locales</Badge> <span className="text-gray-400">{d.coords[0].toFixed(3)},{d.coords[1].toFixed(3)}</span></div>
              </button>
            );
          })}
        </div>
      </section>

      {/* GRID */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-amber-800">Catálogo {filtrados.length} — fichas zonales verificadas</h2>
        <p className="text-sm text-gray-600 mt-1">Toca una card para calificar con estrellas · Horario típico 12:00–15:00 · domingo adobo 05:30–10:30 · precio ref S/.25–40 pp picantería / S/.10–15 huarique · gris = pendiente visita campo</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filtrados.map(l => {
            const summary = summaries[l.id];
            return (
            <article key={l.id} id={`local-${l.id}`} onClick={()=>openModal(l)} className="rounded-2xl border border-stone-200 bg-white overflow-hidden hover:shadow-lg transition flex flex-col cursor-pointer">
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-stone-900 leading-tight">{l.nombre}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-stone-900 text-white shrink-0">{l.id}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge color="amber">{l.distrito}</Badge>
                  <Badge color="green">{l.categoria}</Badge>
                  {l.categorias.filter(c=>c!==l.categoria).map(c=> <Badge key={c} color="stone">{c}</Badge>)}
                </div>
                <p className="text-sm text-gray-700 mt-3"><b className="text-amber-700">Especialidad:</b> {l.especialidad}</p>
                <p className="text-xs text-gray-500 mt-1"> {l.direccion} · {l.coords[0]}, {l.coords[1]}</p>
                {l.redes?.facebook && <p className="text-xs mt-1"> fb: <span className="text-blue-600">{l.redes.facebook}</span> <span className="text-green-600"> curl 200</span></p>}
                <RankingBars ranking={l.ranking} summary={summary} />
                {summary?.comentarios?.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-stone-100">
                    <p className="text-xs font-semibold text-stone-600">Último comentario:</p>
                    <p className="text-xs text-stone-600 italic">“{summary.comentarios[0].texto}”</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex justify-between items-center">
                <span className="font-semibold"> Calificar este local</span><span className="text-stone-500">{l.precioRef}</span>
              </div>
            </article>
          )})}
        </div>
        {filtrados.length === 0 && (
          <p className="text-center text-gray-500 py-16">Sin resultados para «{q}». Prueba con otro plato: cuy, adobo, rocoto, chupe, senca, queso helado…</p>
        )}
      </section>

      {/* MODAL CALIFICAR */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=>!sending && setSelected(null)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-stone-200 p-5 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-stone-900">{selected.nombre}</h3>
                <p className="text-xs text-stone-500">{selected.distrito} · {selected.categoria} · {selected.especialidad}</p>
                {summaries[selected.id]?.total > 0 && (
                  <p className="text-xs text-amber-700 mt-1"> {summaries[selected.id].totalGeneral}/5 ({summaries[selected.id].total} votos usuarios)</p>
                )}
              </div>
              <button onClick={()=>!sending && setSelected(null)} className="text-stone-400 hover:text-stone-700 text-2xl leading-none px-2">×</button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm font-semibold text-stone-700">Tu experiencia — toca las estrellas (1-5 cada criterio):</p>
              {CRITERIOS.map(k => (
                <StarRow key={k} label={LABELS[k]} value={scores[k]} onChange={v=> setScores(s=>({...s,[k]:v}))} />
              ))}
              <div className="pt-2">
                <label className="text-sm font-medium text-stone-700">Comentario (opcional, máx 300)</label>
                <textarea
                  value={comentario}
                  onChange={e=> setComentario(e.target.value.slice(0,300))}
                  placeholder="Ej: El rocoto estaba en su punto, atención muy cálida…"
                  className="mt-1 w-full border border-stone-300 rounded-lg p-3 text-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200 outline-none"
                  rows={3}
                />
                <p className="text-xs text-stone-400 text-right">{comentario.length}/300</p>
              </div>
              {msg && (
                <div className={`text-sm p-3 rounded-lg ${msg.type==="ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>
              )}
              {summaries[selected.id]?.comentarios?.length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-xs font-semibold text-stone-600 mb-2">Comentarios recientes:</p>
                  {summaries[selected.id].comentarios.map((c,i)=>(
                    <p key={i} className="text-xs text-stone-600 bg-stone-50 rounded p-2 mb-1">“{c.texto}” <span className="text-stone-400">— {c.fecha}</span></p>
                  ))}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 flex gap-3">
              <button onClick={()=>!sending && setSelected(null)} className="flex-1 py-2 rounded-lg border border-stone-300 text-sm">Cancelar</button>
              <button
                onClick={enviar}
                disabled={!canSend || sending}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white ${canSend && !sending ? "bg-amber-600 hover:bg-amber-700" : "bg-stone-300 cursor-not-allowed"}`}
              >{sending ? "Enviando…" : " Enviar calificación"}</button>
            </div>
            {!canSend && <p className="text-xs text-stone-400 text-center pb-3">Califica los 6 criterios para enviar</p>}
            <p className="text-xs text-stone-400 text-center pb-4 px-4">1 voto por local al día por IP · anónimo · sin login (fase 1)</p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <section className="bg-stone-900 text-stone-200 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-bold text-white">¿Por qué esta guía es diferente?</h3>
          <p className="text-sm mt-2 text-stone-300">Ninguna guía actual rankea con 6 criterios (precio/platos/atención/limpieza/infraestructura/decoración). Arequipa.net es la mejor pero deliberadamente NO rankea. Esta guía estrena mapeo 8 distritos campiña + Ruta Senca + Ruta Loncco con 48 fichas verificables (Wikipedia + Arequipa.net + municipios + FB curl 200 · 14 fuentes probadas).</p>
          <p className="text-xs mt-4 text-stone-400">Fuente: ~/Jarviz-Vault/02-Investigacion/gastronomia/arequipena-catalogo.md (321 líneas) + gastronomia.json · Vault proyecto 19 · LIVE en Hermes 164.68.126.30:3005/gastronomia</p>
          <div className="mt-6 flex gap-3">
            <a href="/" className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500"> Volver Factory</a>
            <a href="/p/demo-restaurante" className="px-4 py-2 rounded-lg border border-stone-600 text-sm hover:border-amber-500">Ver demo restaurante</a>
          </div>
        </div>
      </section>
    </div>
  );
}
