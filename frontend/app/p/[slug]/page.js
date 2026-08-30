import TemplateClinica from "../../../../templates/template-clinica/index.js";
import TemplateRestaurante from "../../../../templates/template-restaurante/index.js";

const API =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4005";

// Datos demo para probar sin backend
const DEMOS = {
  "demo-clinica": {
    name: "Clínica Dental Arequipa",
    description: "Sonrisas sanas y felices en el corazón de Arequipa.",
    template: { template: "template-clinica" },
    vision: "Ser la clínica dental líder en el sur peruano.",
    mision: "Brindar atención odontológica de calidad con calidez humana.",
    historia:
      "Fundada en 2015 por la Dra. María Quispe, empezamos como un pequeño consultorio en Yanahuara.",
    quienesSomos: "Un equipo de 6 profesionales comprometidos con tu salud bucal.",
    telefono: "+51 987 654 321",
    email: "citas@clinicaarequipa.pe",
    direccion: "Av. Lima 123, Yanahuara, Arequipa",
    fotos: [],
    redes: {
      whatsapp: "https://wa.me/51987654321",
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      tiktok: "https://tiktok.com",
      youtube: "https://youtube.com",
    },
  },
  "demo-restaurante": {
    name: "Picantería La Blanca",
    description: "La mejor comida arequipeña, hecha con cariño.",
    template: { template: "template-restaurante" },
    vision: "Llevar la sazón arequipeña al mundo.",
    mision: "Servir platos tradicionales con ingredientes frescos del campo.",
    historia: "Desde 1998, tres generaciones cocinando recetas de la abuela.",
    quienesSomos: "Familia arequipeña apasionada por la buena mesa.",
    telefono: "+51 912 345 678",
    email: "hola@lablanca.pe",
    direccion: "Calle Zela 456, Cercado, Arequipa",
    fotos: [],
    redes: {
      whatsapp: "https://wa.me/51912345678",
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      tiktok: "https://tiktok.com",
      youtube: "https://youtube.com",
    },
  },
};

async function getLanding(slug) {
  if (DEMOS[slug]) return DEMOS[slug];
  try {
    const res = await fetch(`${API}/api/landings/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await getLanding(params.slug);
  return { title: data ? data.name : "Landing no encontrada" };
}

export default async function LandingPage({ params }) {
  const data = await getLanding(params.slug);

  if (!data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-4xl font-bold">404 😕</h1>
        <p className="text-gray-400">Esta landing no existe (todavía).</p>
        <a href="/admin" className="text-cyan-400 hover:underline font-semibold">
          Crear mi landing →
        </a>
      </main>
    );
  }

  const templateId = data.template?.template || data.template;

  switch (templateId) {
    case "template-clinica":
      return <TemplateClinica data={data} />;
    case "template-restaurante":
      return <TemplateRestaurante data={data} />;
    default:
      return <TemplateClinica data={data} />;
  }
}