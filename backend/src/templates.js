// Catálogo de plantillas disponibles
export function listTemplates() {
  return [
    {
      id: "template-clinica",
      name: "Clínica",
      description:
        "Plantilla para clínicas, consultorios, dentistas, psicólogos y negocios de salud. Colores limpios, azul/blanco, confianza.",
      keywords: [
        "clínica", "consultorio", "dentista", "odontología", "psicología",
        "salud", "médico", "terapia", "fisioterapia", "veterinaria",
        "farmacia", "óptica", "laboratorio", "estética", "spa",
      ],
      sections: [
        "hero", "vision", "mision", "historia", "quienesSomos",
        "galeria", "contacto", "redes", "footer",
      ],
    },
    {
      id: "template-restaurante",
      name: "Restaurante",
      description:
        "Plantilla para restaurantes, cafeterías, pollerías y picanterías arequipeñas. Colores cálidos, apetitoso.",
      keywords: [
        "restaurante", "comida", "pizzería", "pollería", "cevichería",
        "café", "cafetería", "bar", "cocina", "panadería", "postres",
        "picantería", "chifa", "hamburguesa", "menú", "delivery",
      ],
      sections: [
        "hero", "vision", "mision", "historia", "quienesSomos",
        "galeria", "contacto", "redes", "footer",
      ],
    },
    {
      id: "template-generico",
      name: "Genérica",
      description:
        "Plantilla para cualquier tipo de negocio. Moderna y neutra.",
      keywords: [
        "negocio", "servicios", "tienda", "empresa", "consultoría",
        "tecnología", "educación", "inmobiliaria", "marketing", "comercio",
      ],
      sections: [
        "hero", "vision", "mision", "historia", "quienesSomos",
        "galeria", "contacto", "redes", "footer",
      ],
    },
  ];
}
