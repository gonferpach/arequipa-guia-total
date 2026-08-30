// Selector IA (mock): elige plantilla según categoría y palabras clave
// En producción esto se reemplaza por un LLM real.

const KEYWORDS = {
  "template-clinica": [
    "clinica", "clínica", "dentista", "dental", "odontologia", "odontología",
    "salud", "medico", "médico", "doctor", "consultorio", "psicologia",
    "psicología", "terapia", "fisioterapia", "veterinaria", "farmacia",
    "optica", "óptica", "laboratorio",
  ],
  "template-restaurante": [
    "restaurante", "restaurante", "comida", "pizzeria", "pizzería", "polleria",
    "pollería", "ceviche", "cevicheria", "cevichería", "cafe", "café",
    "cafeteria", "cafetería", "bar", "cocina", "menu", "menú", "panaderia",
    "panadería", "postres", "picanteria", "picantería", "chifa", "burger",
    "hamburguesa", "arequipa food",
  ],
};

const CATEGORIES = {
  "template-clinica": ["salud", "clinica", "clínica", "medicina", "odontologia"],
  "template-restaurante": ["restaurante", "comida", "gastronomia", "gastronomía", "cafe"],
};

export function selectTemplate({ name = "", description = "", category = "" }) {
  const text = `${name} ${description} ${category}`.toLowerCase();

  let best = { template: "template-generico", score: 0 };

  for (const [template, kws] of Object.entries(KEYWORDS)) {
    const score = kws.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
    if (score > best.score) best = { template, score };
  }

  // Categoría explícita tiene prioridad si coincide
  for (const [template, cats] of Object.entries(CATEGORIES)) {
    if (cats.some((c) => category.toLowerCase().includes(c))) {
      best = { template, score: best.score + 10 };
    }
  }

  const categoryLabel =
    best.template === "template-clinica"
      ? "salud"
      : best.template === "template-restaurante"
        ? "gastronomía"
        : "general";

  return { ...best, category: categoryLabel };
}