// Componentes de sección reutilizables por todas las plantillas.
// Cada sección recibe `data` (la landing) y `theme` (colores de la plantilla).

export const defaultTheme = {
  primary: "bg-sky-600",
  primaryText: "text-sky-600",
  bg: "bg-white",
  bgAlt: "bg-gray-50",
  text: "text-gray-900",
  textSoft: "text-gray-600",
  ring: "ring-sky-600",
};

export function HeroSection({ data, theme }) {
  const foto = data.fotos?.[0];
  return (
    <section className="relative min-h-[70vh] flex items-center">
      {foto ? (
        <img
          src={foto}
          alt={data.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className={`absolute inset-0 ${theme.primary}`} />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">
          {data.name}
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto opacity-90">
          {data.description}
        </p>
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          {data.telefono && (
            <a
              href={`tel:${data.telefono.replace(/\s/g, "")}`}
              className={`px-6 py-3 rounded-full font-semibold ${theme.primary} text-white hover:opacity-90 transition`}
            >
              📞 Llámanos
            </a>
          )}
          {data.redes?.whatsapp && (
            <a
              href={data.redes.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full font-semibold bg-green-500 text-white hover:bg-green-400 transition"
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function TextSection({ id, title, content, icon, theme }) {
  if (!content) return null;
  return (
    <section id={id} className={`${theme.bg} ${theme.text} py-16 px-6`}>
      <div className="max-w-3xl mx-auto">
        <h2 className={`text-3xl font-bold mb-6 text-center ${theme.primaryText}`}>
          {icon} {title}
        </h2>
        <p className={`text-lg leading-relaxed ${theme.textSoft} whitespace-pre-line`}>
          {content}
        </p>
      </div>
    </section>
  );
}

export const VisionSection = ({ data, theme }) => (
  <TextSection id="vision" title="Visión" icon="🔭" content={data.vision} theme={theme} />
);

export const MisionSection = ({ data, theme }) => (
  <TextSection id="mision" title="Misión" icon="🎯" content={data.mision} theme={theme} />
);

export const HistoriaSection = ({ data, theme }) => (
  <TextSection id="historia" title="Nuestra Historia" icon="📖" content={data.historia} theme={theme} />
);

export const QuienesSomosSection = ({ data, theme }) => (
  <TextSection id="quienes-somos" title="Quiénes Somos" icon="👥" content={data.quienesSomos} theme={theme} />
);

export function GaleriaSection({ data, theme }) {
  const fotos = data.fotos || [];
  if (fotos.length === 0) return null;
  return (
    <section id="galeria" className={`${theme.bgAlt} ${theme.text} py-16 px-6`}>
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-3xl font-bold mb-10 text-center ${theme.primaryText}`}>
          📸 Galería
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fotos.map((f, i) => (
            <img
              key={i}
              src={f}
              alt={`${data.name} - foto ${i + 1}`}
              className="w-full h-64 object-cover rounded-2xl shadow-lg hover:scale-[1.02] transition"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactoSection({ data, theme }) {
  return (
    <section id="contacto" className={`${theme.bg} ${theme.text} py-16 px-6`}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className={`text-3xl font-bold mb-8 ${theme.primaryText}`}>
          📬 Contáctanos
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {data.telefono && (
            <a href={`tel:${data.telefono.replace(/\s/g, "")}`} className="p-6 rounded-2xl shadow hover:shadow-lg transition bg-white">
              <div className="text-3xl mb-2">📞</div>
              <div className="font-semibold">{data.telefono}</div>
            </a>
          )}
          {data.email && (
            <a href={`mailto:${data.email}`} className="p-6 rounded-2xl shadow hover:shadow-lg transition bg-white">
              <div className="text-3xl mb-2">✉️</div>
              <div className="font-semibold break-all">{data.email}</div>
            </a>
          )}
          {data.direccion && (
            <div className="p-6 rounded-2xl shadow bg-white">
              <div className="text-3xl mb-2">📍</div>
              <div className="font-semibold">{data.direccion}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const SOCIALS = [
  { key: "whatsapp", icon: "💬", label: "WhatsApp", color: "hover:bg-green-500" },
  { key: "facebook", icon: "📘", label: "Facebook", color: "hover:bg-blue-600" },
  { key: "instagram", icon: "📸", label: "Instagram", color: "hover:bg-pink-600" },
  { key: "tiktok", icon: "🎵", label: "TikTok", color: "hover:bg-gray-900" },
  { key: "youtube", icon: "▶️", label: "YouTube", color: "hover:bg-red-600" },
];

export function RedesSection({ data }) {
  const redes = data.redes || {};
  const activos = SOCIALS.filter((s) => redes[s.key]);
  if (activos.length === 0) return null;
  return (
    <section className="bg-gray-100 py-14 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Síguenos en redes 🌐
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {activos.map((s) => (
            <a
              key={s.key}
              href={redes[s.key]}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-6 py-3 rounded-full bg-white shadow font-semibold text-gray-800 hover:text-white transition ${s.color}`}
            >
              {s.icon} {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FooterSection({ data }) {
  return (
    <footer className="bg-gray-950 text-gray-400 py-10 px-6">
      <div className="max-w-6xl mx-auto text-center space-y-2">
        <div className="font-bold text-white text-lg">{data.name}</div>
        {data.direccion && <div>📍 {data.direccion}</div>}
        <div className="text-sm pt-2">
          © {new Date().getFullYear()} {data.name}. Hecho con 💜 en Arequipa por{" "}
          <span className="font-semibold text-cyan-400">2braind</span>.
        </div>
      </div>
    </footer>
  );
}

// Navegación de la landing
export function LandingNav({ data, theme }) {
  const links = [
    ["historia", "Historia"],
    ["quienes-somos", "Quiénes Somos"],
    ["galeria", "Galería"],
    ["contacto", "Contacto"],
  ];
  return (
    <nav className={`sticky top-0 z-20 ${theme.primary} text-white shadow-lg`}>
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-lg">{data.name}</span>
        <div className="hidden md:flex gap-6 text-sm font-medium">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="opacity-90 hover:opacity-100 hover:underline">
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}