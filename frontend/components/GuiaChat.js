"use client";
import { useState, useRef, useEffect } from "react";

const T = {
  es: {
    btn: " Pregunta a la Guía",
    title: "Pregunta a la Guía",
    sub: "Responde solo con los datos de la guía · ES/EN",
    placeholder: "Ej: ¿Dónde como rocoto relleno?",
    send: "Enviar",
    thinking: "Pensando…",
    err: "Ups, algo falló. Intenta de nuevo en un momento ",
    hola: "¡Hola! Soy el bot de la guía  Pregúntame por picanterías, sitios turísticos, miradores o eventos de Arequipa.",
    chips: [
      "¿Dónde como rocoto relleno?",
      "¿Qué sitios UNESCO visito en un día?",
      "¿Dónde veo el Misti?",
    ],
  },
  en: {
    btn: " Ask the Guide",
    title: "Ask the Guide",
    sub: "Answers only from the guide's data · ES/EN",
    placeholder: "E.g.: Where can I eat rocoto relleno?",
    send: "Send",
    thinking: "Thinking…",
    err: "Oops, something failed. Try again in a moment ",
    hola: "Hi! I'm the guide's bot  Ask me about picanterías, attractions, viewpoints or events in Arequipa.",
    chips: [
      "Where can I eat rocoto relleno?",
      "Which UNESCO sites can I visit in one day?",
      "Where's the best Misti view?",
    ],
  },
};

// Renderiza el texto del bot: [id:X]  link a la ficha · **texto**  bold
function BotText({ text, lang }) {
  const base = lang === "en" ? "/en" : "";
  const nodes = [];
  const re = /\[id:([A-Za-z]+\d+)\]|\*\*([^*]+)\*\*/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      const id = m[1];
      const href = id.startsWith("T")
        ? `${base}/turismo#ficha-${id}`
        : `/gastronomia#local-${id}`;
      nodes.push(
        <a key={`c${k++}`} href={href} className="mx-0.5 text-xs font-bold text-amber-600 underline hover:text-amber-700" title="Ver ficha">
          [{id}]
        </a>
      );
    } else {
      nodes.push(<strong key={`b${k++}`} className="font-semibold">{m[2]}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export default function GuiaChat({ lang = "es" }) {
  const t = T[lang] || T.es;
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [msgs, busy, open]);

  const preguntar = async (text) => {
    const pregunta = (text ?? q).trim();
    if (!pregunta || busy) return;
    setMsgs((m) => [...m, { role: "user", text: pregunta }]);
    setQ("");
    setBusy(true);
    try {
      const r = await fetch("/api/guia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta, lang }),
      });
      const d = await r.json();
      const respuesta = r.ok && d.respuesta ? d.respuesta : d.error || t.err;
      setMsgs((m) => [...m, { role: "bot", text: respuesta }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: t.err }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 w-[92vw] max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-200 bg-white flex flex-col"
          style={{ maxHeight: "70vh" }}
        >
          <div className="bg-stone-900 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-amber-400 text-sm">{t.title}</p>
              <p className="text-[11px] text-stone-400">{t.sub}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white text-xl leading-none px-1">×</button>
          </div>
          <div ref={boxRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-stone-50">
            <div className="text-sm bg-white border border-stone-200 rounded-xl rounded-bl-sm px-3 py-2 text-stone-700 shadow-sm">{t.hola}</div>
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="text-sm bg-amber-600 text-white rounded-xl rounded-br-sm px-3 py-2 ml-8 shadow-sm">{m.text}</div>
              ) : (
                <div key={i} className="text-sm bg-white border border-stone-200 rounded-xl rounded-bl-sm px-3 py-2 text-stone-700 shadow-sm mr-4">
                  <BotText text={m.text} lang={lang} />
                </div>
              )
            )}
            {busy && (
              <div className="text-sm bg-white border border-stone-200 rounded-xl rounded-bl-sm px-3 py-2 text-stone-400 italic shadow-sm">{t.thinking}</div>
            )}
            {msgs.length === 0 && !busy && (
              <div className="flex flex-wrap gap-2 pt-2">
                {t.chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => preguntar(c)}
                    className="text-xs px-3 py-1.5 rounded-full border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                  >{c}</button>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 border-t border-stone-200 bg-white flex gap-2">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") preguntar(); }}
              placeholder={t.placeholder}
              maxLength={500}
              className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
            />
            <button
              onClick={() => preguntar()}
              disabled={busy || !q.trim()}
              className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${!busy && q.trim() ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-stone-200 text-stone-400 cursor-not-allowed"}`}
            >{t.send}</button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-full shadow-xl font-semibold text-sm transition ${open ? "bg-stone-700 hover:bg-stone-800 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
        aria-label={t.btn}
      >
        {open ? "×" : t.btn}
      </button>
    </>
  );
}