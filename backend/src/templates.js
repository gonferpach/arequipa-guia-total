// Catálogo de plantillas disponibles
export function listTemplates() {
  return [
    {
      id: "template-clinica",
      name: "Clínica",
      description:
        "Plantilla para clínicas, consultorios, dentistas, psicólogos y negocios de salud. Colores limpios, azul/blanco, confianza.",
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
      sections: [
        "hero", "vision", "mision", "historia", "quienesSomos",
        "galeria", "contacto", "redes", "footer",
      ],
    },
  ];
}