"use client";

import { useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005";

const emptyForm = {
  name: "",
  description: "",
  category: "",
  vision: "",
  mision: "",
  historia: "",
  quienesSomos: "",
  telefono: "",
  email: "",
  direccion: "",
  fotos: "",
  whatsapp: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  website: "",
};

export default function AdminPage() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null); // { ok, msg, slug }
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeInfo, setScrapeInfo] = useState(null); // { bio, photos, mocks }
  const [deploy, setDeploy] = useState(null); // { loading, result }
  const [lastSlug, setLastSlug] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // ---- Scraper: pre-rellenar desde redes sociales ----
  async function scrapeAndPrefill() {
    if (!form.instagram && !form.facebook && !form.tiktok && !form.website) {
      setScrapeInfo({ error: "Pon al menos Instagram, Facebook, TikTok o Website" });
      return;
    }
    setScraping(true);
    setScrapeInfo(null);
    try {
      const res = await fetch(`${API}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram: form.instagram,
          facebook: form.facebook,
          tiktok: form.tiktok,
          website: form.website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error scrapeando");

      const patch = {};
      if (data.bio && !form.description) patch.description = data.bio.slice(0, 300);
      if (data.photos?.length && !form.fotos) {
        patch.fotos = data.photos.slice(0, 6).join("\n");
      }
      if (Object.keys(patch).length) setForm((f) => ({ ...f, ...patch }));
      setScrapeInfo({
        bio: data.bio,
        photos: data.photos || [],
        mocks: data.mocks || [],
        sources: data.sources || [],
      });
    } catch (err) {
      setScrapeInfo({ error: err.message });
    } finally {
      setScraping(false);
    }
  }

  // ---- Deploy con OpenShip ----
  async function publishWithOpenship(slug) {
    setDeploy({ loading: true, result: null });
    try {
      const res = await fetch(`${API}/api/landings/${slug}/deploy`, { method: "POST" });
      const data = await res.json();
      setDeploy({ loading: false, result: data });
    } catch (err) {
      setDeploy({ loading: false, result: { ok: false, error: err.message } });
    }
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setDeploy(null);
    try {
      const fotos = form.fotos
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);

      const res = await fetch(`${API}/api/landings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fotos,
          redes: {
            whatsapp: form.whatsapp,
            facebook: form.facebook,
            instagram: form.instagram,
            tiktok: form.tiktok,
            youtube: form.youtube,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setStatus({
        ok: true,
        msg: `✅ Landing creada con plantilla: ${data.template.template}`,
        slug: data.slug,
        palette: data.palette,
        seo: data.seo,
      });
      setLastSlug(data.slug);
      setForm(emptyForm);
    } catch (err) {
      setStatus({ ok: false, msg: `❌ ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 focus:border-cyan-400 focus:outline-none text-white placeholder-gray-500";
  const label = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Crear landing 🚀</h1>
        <p className="text-gray-400 mb-8">
          Completa los datos de tu negocio. La IA (RAG) elegirá la mejor plantilla,
          extrae tu paleta y genera el SEO.
        </p>

        {status && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              status.ok
                ? "border-green-500/50 bg-green-500/10 text-green-300"
                : "border-red-500/50 bg-red-500/10 text-red-300"
            }`}
          >
            {status.msg}
            {status.ok && (
              <>
                {" "}
                <a
                  href={`/p/${status.slug}`}
                  target="_blank"
                  className="underline font-semibold"
                >
                  Ver mi landing →
                </a>
              </>
            )}

            {/* Palette preview */}
            {status.ok && status.palette && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">🎨 Paleta extraída</p>
                <div className="flex gap-2">
                  {["primary", "secondary", "accent"].map((k) => (
                    <div key={k} className="text-center">
                      <div
                        className="w-14 h-10 rounded-lg border border-white/20"
                        style={{ background: status.palette[k] }}
                      />
                      <code className="text-[10px] text-gray-400">
                        {status.palette[k]}
                      </code>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  fuente: {status.palette.source}
                </p>
              </div>
            )}

            {/* SEO preview */}
            {status.ok && status.seo && (
              <div className="mt-4 p-3 rounded-lg bg-gray-900/70 border border-gray-700">
                <p className="text-sm font-semibold mb-1">🔍 SEO generado</p>
                <p className="text-blue-400 text-sm font-medium">{status.seo.title}</p>
                <p className="text-gray-400 text-xs">{status.seo.description}</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  keywords: {status.seo.keywords?.join(", ")}
                </p>
              </div>
            )}

            {/* Publicar con OpenShip */}
            {status.ok && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => publishWithOpenship(status.slug)}
                  disabled={deploy?.loading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-gray-950 font-bold text-sm disabled:opacity-50 transition"
                >
                  {deploy?.loading ? "🚀 Publicando..." : "🚀 Publicar con OpenShip"}
                </button>
                {deploy?.result && (
                  <div className="mt-2 text-xs">
                    {deploy.result.ok ? (
                      <p className="text-green-300">
                        ✅ Publicada vía {deploy.result.method}.{" "}
                        {deploy.result.url && (
                          <a href={deploy.result.url} target="_blank" className="underline">
                            {deploy.result.url}
                          </a>
                        )}
                        {deploy.result.instructions && (
                          <span className="block text-gray-500 mt-1">
                            {deploy.result.instructions}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-red-300">
                        ❌ {deploy.result.error}
                        {deploy.result.instructions && (
                          <span className="block text-gray-500 mt-1">
                            {deploy.result.instructions}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={label}>Nombre del negocio *</label>
              <input required className={input} value={form.name} onChange={set("name")} placeholder="Ej: Clínica Dental Arequipa" />
            </div>
            <div>
              <label className={label}>Categoría (opcional)</label>
              <input className={input} value={form.category} onChange={set("category")} placeholder="Ej: salud, restaurante, comida" />
            </div>
          </div>

          {/* --- Scraper social --- */}
          <fieldset className="border border-cyan-800/60 rounded-xl p-5 space-y-4 bg-cyan-950/20">
            <legend className="px-2 font-semibold text-cyan-300">
              Redes sociales del negocio
            </legend>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Instagram</label>
                <input className={input} value={form.instagram} onChange={set("instagram")} placeholder="@minegocio o instagram.com/minegocio" />
              </div>
              <div>
                <label className={label}>Facebook</label>
                <input className={input} value={form.facebook} onChange={set("facebook")} placeholder="https://facebook.com/minegocio" />
              </div>
              <div>
                <label className={label}>TikTok</label>
                <input className={input} value={form.tiktok} onChange={set("tiktok")} placeholder="@minegocio o tiktok.com/@minegocio" />
              </div>
              <div>
                <label className={label}>Website</label>
                <input className={input} value={form.website} onChange={set("website")} placeholder="https://minegocio.pe" />
              </div>
            </div>

            <button
              type="button"
              onClick={scrapeAndPrefill}
              disabled={scraping}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm disabled:opacity-50 transition"
            >
              {scraping ? "🔎 Scrapeando redes..." : "🔎 Scrapear y pre-rellenar"}
            </button>

            {scrapeInfo?.error && (
              <p className="text-red-400 text-sm">❌ {scrapeInfo.error}</p>
            )}
            {scrapeInfo && !scrapeInfo.error && (
              <div className="text-sm text-gray-300 space-y-1">
                <p>
                  ✅ Scrapeado de: {scrapeInfo.sources.join(", ")}
                  {scrapeInfo.mocks?.length > 0 && (
                    <span className="text-amber-400">
                      {" "}
                      (mock en: {scrapeInfo.mocks.join(", ")})
                    </span>
                  )}
                </p>
                {scrapeInfo.bio && (
                  <p className="text-gray-400 text-xs line-clamp-2">
                    Bio: {scrapeInfo.bio}
                  </p>
                )}
                {scrapeInfo.photos?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {scrapeInfo.photos.slice(0, 6).map((p, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={p}
                        alt="foto scrapeada"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-700"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </fieldset>

          <div>
            <label className={label}>Descripción *</label>
            <textarea required rows={3} className={input} value={form.description} onChange={set("description")} placeholder="¿Qué hace tu negocio? Mientras más detalle, mejor elige la IA." />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={label}>Visión</label>
              <textarea rows={2} className={input} value={form.vision} onChange={set("vision")} placeholder="¿A dónde quieres llegar?" />
            </div>
            <div>
              <label className={label}>Misión</label>
              <textarea rows={2} className={input} value={form.mision} onChange={set("mision")} placeholder="¿Para qué existe tu negocio?" />
            </div>
          </div>

          <div>
            <label className={label}>Historia</label>
            <textarea rows={3} className={input} value={form.historia} onChange={set("historia")} placeholder="Cuéntanos cómo empezó tu negocio..." />
          </div>

          <div>
            <label className={label}>Quiénes somos</label>
            <textarea rows={3} className={input} value={form.quienesSomos} onChange={set("quienesSomos")} placeholder="Tu equipo, tu gente..." />
          </div>

          <div>
            <label className={label}>Fotos (una URL por línea — mock upload, se mezclan con las scrapeadas)</label>
            <textarea rows={3} className={input} value={form.fotos} onChange={set("fotos")} placeholder={"https://ejemplo.com/foto1.jpg\nhttps://ejemplo.com/foto2.jpg"} />
          </div>

          <fieldset className="border border-gray-700 rounded-xl p-5 space-y-4">
            <legend className="px-2 font-semibold">Contacto</legend>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={label}>Teléfono</label>
                <input className={input} value={form.telefono} onChange={set("telefono")} placeholder="+51 987 654 321" />
              </div>
              <div>
                <label className={label}>Email</label>
                <input type="email" className={input} value={form.email} onChange={set("email")} placeholder="hola@negocio.pe" />
              </div>
              <div>
                <label className={label}>Dirección</label>
                <input className={input} value={form.direccion} onChange={set("direccion")} placeholder="Calle Los Andes 123, Arequipa" />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 rounded-xl p-5 space-y-4">
            <legend className="px-2 font-semibold">Otros canales</legend>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={label}>WhatsApp</label>
                <input className={input} value={form.whatsapp} onChange={set("whatsapp")} placeholder="https://wa.me/51987654321" />
              </div>
              <div>
                <label className={label}>YouTube</label>
                <input className={input} value={form.youtube} onChange={set("youtube")} placeholder="https://youtube.com/@minegocio" />
              </div>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold text-gray-950 disabled:opacity-50 transition"
          >
            {loading ? "🧠 La IA está eligiendo tu plantilla..." : "Generar mi landing ✨"}
          </button>
        </form>

        {lastSlug && (
          <p className="mt-6 text-center text-gray-500 text-sm">
            ¿Ya tienes tu landing?{" "}
            <button
              onClick={() => publishWithOpenship(lastSlug)}
              className="underline hover:text-cyan-400"
            >
              Publicar {lastSlug} con OpenShip 🚀
            </button>
          </p>
        )}
      </div>
    </main>
  );
}