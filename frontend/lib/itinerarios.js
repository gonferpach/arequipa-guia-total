// Itinerarios armados — Arequipa Guia Total
// Arma planes de 1 dia, 2 dias y fin de semana combinando turismo +
// restaurante + cafe + nocturno, con datos reales de Directus.

import {
  mapGoogleCategory,
  normalizeGoogle,
  normalizeGastronomia,
  distritoFromAddress,
} from "./categorias";

export function normalizeSitio(row) {
  return {
    id: `s-${row.sitio_id || row.id}`,
    source: "sitios",
    title: row.nombre,
    category: row.categoria || "Sitio",
    address: row.direccion || "",
    district: row.zona || distritoFromAddress(row.direccion),
    desc: row.descripcion_es || "",
    descEn: row.descripcion_en || "",
    horario: row.horario_es || "",
    price: row.precio_es || "",
    latitude: row.lat,
    longitude: row.lon,
    rating: null,
    reviewsCount: null,
    phone: "",
    unesco: !!row.unesco,
  };
}

function topRated(places, n) {
  return [...places]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewsCount || 0) - (a.reviewsCount || 0))
    .slice(0, n);
}

function withCoords(places) {
  return (places || []).filter(
    (p) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
  );
}

// pools: { sitios, gastro, restaurantes, cafeterias, noche, hoteles }
export function buildItinerarios(pools, lang = "es") {
  const es = lang === "es";
  const sitios = withCoords(pools.sitios || []);
  const unesco = sitios.filter((s) => s.unesco);
  const otrosSitios = sitios.filter((s) => !s.unesco);
  const sitiosOrd = [...unesco, ...otrosSitios];
  const rest = withCoords(pools.restaurantes || []);
  const gastro = withCoords(pools.gastro || []).map((g) => ({ ...g, source: "gastronomia" }));
  const cafes = withCoords(pools.cafeterias || []);
  const noche = withCoords(pools.noche || []);

  const come = [...topRated(rest, 6), ...gastro.slice(0, 6)];
  const tomaCafe = cafes.length ? topRated(cafes, 4) : come.slice(0, 4);
  const saleNoche = topRated(noche, 4);

  const stop = (hora, place, notaEs, notaEn) => ({
    hora,
    place,
    nota: es ? notaEs : notaEn,
  });

  const uno = {
    slug: "un-dia",
    titulo: es ? "Arequipa en 1 dia" : "Arequipa in 1 day",
    desc: es
      ? "Centro Historico, picanteria, cafe y noche. Lo esencial sin correr."
      : "Historic centre, picanteria, coffee and nightlife. The essentials, no rushing.",
    dias: [
      {
        nombre: es ? "Dia unico" : "Single day",
        paradas: [
          sitiosOrd[0] && stop("09:00", sitiosOrd[0], "Empieza en el corazon UNESCO.", "Start at the UNESCO heart."),
          sitiosOrd[1] && stop("11:00", sitiosOrd[1], "Manana de templos y miradores.", "Morning of temples and viewpoints."),
          come[0] && stop("13:00", come[0], "Almuerzo donde comen los locales.", "Lunch where locals eat."),
          tomaCafe[0] && stop("16:30", tomaCafe[0], "Cafe de especialidad en la tarde.", "Specialty coffee in the afternoon."),
          sitiosOrd[2] && stop("18:00", sitiosOrd[2], "Atardecer con vista al Misti.", "Sunset with Misti views."),
          saleNoche[0] && stop("21:30", saleNoche[0], "Cierra la noche arequipena.", "Close out the Arequipa night."),
        ].filter(Boolean),
      },
    ],
  };

  const dos = {
    slug: "dos-dias",
    titulo: es ? "Arequipa en 2 dias" : "Arequipa in 2 days",
    desc: es
      ? "Dia 1: centro y noche. Dia 2: campina y picanterias."
      : "Day 1: centre and nightlife. Day 2: countryside and picanterias.",
    dias: [
      {
        nombre: es ? "Dia 1 — Centro" : "Day 1 — Centre",
        paradas: [
          sitiosOrd[0] && stop("09:00", sitiosOrd[0], "Plaza, Catedral y portales.", "Plaza, Cathedral and arcades."),
          sitiosOrd[1] && stop("11:30", sitiosOrd[1], "Santa Catalina o museo.", "Santa Catalina or a museum."),
          come[1] && stop("13:30", come[1], "Almuerzo en el centro.", "Lunch downtown."),
          tomaCafe[1] && stop("17:00", tomaCafe[1], "Pausa cafe.", "Coffee break."),
          saleNoche[1] && stop("22:00", saleNoche[1], "Noche en el centro.", "Night out downtown."),
        ].filter(Boolean),
      },
      {
        nombre: es ? "Dia 2 — Campina" : "Day 2 — Countryside",
        paradas: [
          sitiosOrd[3] && stop("09:30", sitiosOrd[3], "Molinos, miradores o termales.", "Mills, viewpoints or hot springs."),
          (gastro[0] || come[2]) && stop("12:30", gastro[0] || come[2], "Picanteria de campina.", "Countryside picanteria."),
          otrosSitios[0] && stop("15:30", otrosSitios[0], "Tarde de chacra y sillar.", "Afternoon of fields and sillar."),
          tomaCafe[2] && stop("17:30", tomaCafe[2], "Chocolate o cafe de cierre.", "Closing chocolate or coffee."),
        ].filter(Boolean),
      },
    ],
  };

  const finde = {
    slug: "fin-de-semana",
    titulo: es ? "Fin de semana completo" : "Full weekend",
    desc: es
      ? "Viernes de noche, sabado de ruta total y domingo picantero."
      : "Friday night, Saturday full route and picanteria Sunday.",
    dias: [
      {
        nombre: es ? "Viernes — Llegada y noche" : "Friday — Arrival and night",
        paradas: [
          come[3] && stop("20:00", come[3], "Cena de bienvenida.", "Welcome dinner."),
          saleNoche[0] && stop("22:30", saleNoche[0], "Primera noche.", "First night out."),
        ].filter(Boolean),
      },
      {
        nombre: es ? "Sabado — Ruta total" : "Saturday — Full route",
        paradas: [
          sitiosOrd[0] && stop("09:00", sitiosOrd[0], "Centro Historico completo.", "Full Historic Centre."),
          sitiosOrd[2] && stop("12:00", sitiosOrd[2], "Mirador antes del almuerzo.", "Viewpoint before lunch."),
          come[0] && stop("13:00", come[0], "El almuerzo fuerte del viaje.", "The trip's big lunch."),
          tomaCafe[0] && stop("16:30", tomaCafe[0], "Cafe y queso helado.", "Coffee and queso helado."),
          saleNoche[2] && stop("22:00", saleNoche[2], "La gran noche.", "The big night."),
        ].filter(Boolean),
      },
      {
        nombre: es ? "Domingo — Picantero" : "Sunday — Picanteria day",
        paradas: [
          (gastro[1] || come[4]) && stop("12:30", gastro[1] || come[4], "Adobo dominical.", "Sunday adobo."),
          otrosSitios[1] && stop("15:00", otrosSitios[1], "Despedida con vista.", "Farewell with a view."),
        ].filter(Boolean),
      },
    ],
  };

  return [uno, dos, finde];
}
