// Mapeo editorial de categorias — Arequipa Guia Total
// Convierte `category` de lugares_google (Directus) en las 6 secciones de la guia.

export const CATEGORIAS = {
  restaurantes: {
    slug: "restaurantes",
    es: "Restaurantes",
    en: "Restaurants",
    descEs: "De la picanteria tradicional al restaurante contemporaneo. Fichas con especialidad, precio de referencia y distrito.",
    descEn: "From traditional picanterias to contemporary dining. Listings with signature dishes, reference prices and district.",
  },
  cafeterias: {
    slug: "cafeterias",
    es: "Cafeterias",
    en: "Coffee shops",
    descEs: "Cafes de especialidad, barras de espresso y chocolaterias para la tarde arequipena.",
    descEn: "Specialty coffee, espresso bars and chocolate houses for the Arequipa afternoon.",
  },
  "vida-nocturna": {
    slug: "vida-nocturna",
    es: "Centros Nocturnos",
    en: "Nightlife",
    descEs: "Discotecas, bares, pubs y cocteleria. Direccion, horario y calificacion de cada local.",
    descEn: "Clubs, bars, pubs and cocktail spots. Address, hours and ratings for each venue.",
  },
  hoteles: {
    slug: "hoteles",
    es: "Hoteles y Hostales",
    en: "Hotels and Hostels",
    descEs: "Donde dormir en Arequipa, por zona y presupuesto. Sello visible de cochera cuando el dato existe.",
    descEn: "Where to stay in Arequipa, by area and budget. Visible parking badge whenever the data confirms it.",
  },
  turismo: {
    slug: "turismo",
    es: "Sitios turisticos / Que hacer",
    en: "Attractions / Things to do",
    descEs: "Centro Historico UNESCO, Santa Catalina, miradores del Misti, molinos y termales.",
    descEn: "UNESCO Historic Centre, Santa Catalina, Misti viewpoints, mills and hot springs.",
  },
  eventos: {
    slug: "eventos",
    es: "Eventos",
    en: "Events",
    descEs: "Ferias, tours, mercados y fiestas arequipenas. Recurrentes y fechados del ano.",
    descEn: "Fairs, tours, markets and Arequipa fiestas. Recurring and annual dated events.",
  },
};

const RESTAURANTE_RE = /restaurante|picanter|chicharroner|cevicher|pollería|polleria|marisquer|parrilla|trattoria|sushi/i;
const BAR_RE = /\bbar\b|pub|cocteler|cervecer|taproom|taberna|cantina/i;
const NOCHE_RE = /discoteca|club nocturno|karaoke|centro nocturno|sal.n de baile|dance club/i;
const CAFE_RE = /cafeter|chocolater|caf[eé] |coffee|tea house|casa de t[eé]/i;
const HOTEL_RE = /hotel|hostal|hoster|alojamiento|hospedaje|apartahotel|lodge|posada/i;

export function mapGoogleCategory(category) {
  const c = (category || "").trim();
  if (!c) return null;
  if (NOCHE_RE.test(c) || BAR_RE.test(c)) return "vida-nocturna";
  if (CAFE_RE.test(c)) return "cafeterias";
  if (HOTEL_RE.test(c)) return "hoteles";
  if (RESTAURANTE_RE.test(c)) return "restaurantes";
  return null; // Farmacias, clubes deportivos y otros rubros no entran en la guia
}

const DISTRITOS_CONOCIDOS = [
  "Jose Luis Bustamante y Rivero",
  "Alto Selva Alegre",
  "Mariano Melgar",
  "Cerro Colorado",
  "Jacobo Hunter",
  "Yanahuara",
  "Miraflores",
  "Sachaca",
  "Cercado",
  "Cayma",
  "Tiabaya",
  "Hunter",
  "Socabaya",
  "Paucarpata",
];

// Centroides aprox. de distritos de Arequipa para asignar distrito por coordenadas
const DISTRITO_CENTROID = {
  "Arequipa": [-16.3988, -71.5369], // Cercado
  "Cayma": [-16.3895, -71.5490],
  "Yanahuara": [-16.3840, -71.5420],
  "Alto Selva Alegre": [-16.3660, -71.5270],
  "Cerro Colorado": [-16.4120, -71.5740],
  "Mariano Melgar": [-16.4050, -71.5100],
  "Miraflores": [-16.4250, -71.5220],
  "Jose Luis Bustamante y Rivero": [-16.4330, -71.5220],
  "Paucarpata": [-16.4250, -71.4920],
  "Jacobo Hunter": [-16.4520, -71.5450],
  "Sachaca": [-16.4400, -71.5620],
  "Tiabaya": [-16.4580, -71.5940],
  "Socabaya": [-16.4620, -71.5220],
  "Characato": [-16.4330, -71.4700],
  "Sabandia": [-16.4520, -71.4920],
  "Sabandía": [-16.4520, -71.4920],
  "Yura": [-16.2500, -71.6800],
  "Uchumayo": [-16.4260, -71.6800],
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Devuelve el distrito mas cercano a una coordenada (para afinar la direccion generica)
export function distritoFromCoords(lat, lon) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;
  let mejor = null;
  let mejorDist = Infinity;
  for (const [nombre, [clat, clon]] of Object.entries(DISTRITO_CENTROID)) {
    if (nombre === "Sabandia") continue; // variante, solo usamos la acentuada
    const d = haversineKm(Number(lat), Number(lon), clat, clon);
    if (d < mejorDist) {
      mejorDist = d;
      mejor = nombre;
    }
  }
  return mejorDist < 12 ? mejor : null; // fuera del area metropolitana: mejor Arequipa
}

export function distritoFromAddress(address, lat, lon) {
  const a = (address || "").replace(/,?\s*Perú\.?$/i, "").trim();
  if (!a) return distritoFromCoords(lat, lon) || "Arequipa";
  const norm = a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const d of DISTRITOS_CONOCIDOS) {
    const dn = d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (norm.includes(dn)) return d;
  }
  const parts = a.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const cand = parts[parts.length - 1].replace(/\b0?400?\d{2}\b/g, "").trim();
    if (cand && cand.length <= 40 && cand !== "Arequipa") return cand;
  }
  // Direccion generica → afinar por coordenadas
  return distritoFromCoords(lat, lon) || "Arequipa";
}

export function hasParking(place) {
  const hay = `${place?.title || ""} ${place?.address || ""} ${place?.website || ""}`;
  return /cochera|parking|estacionamiento|garage|parqueo privado/i.test(hay);
}

export function shortLine(place, lang = "es") {
  const cat = (place?.category || "").trim();
  const distrito = place?.district || distritoFromAddress(place?.address);
  if (lang === "en") return `${cat || "Local spot"} in ${distrito}`;
  return `${cat || "Local"} en ${distrito}`;
}

export function normalizeGoogle(row) {
  return {
    id: String(row.id),
    source: "lugares_google",
    title: row.title,
    category: row.category,
    address: row.address || "",
    district: distritoFromAddress(row.address, row.latitude, row.longitude),
    phone: row.phone || "",
    website: row.website || "",
    rating: row.rating ?? null,
    reviewsCount: row.reviews_count ?? null,
    latitude: row.latitude,
    longitude: row.longitude,
    horario: "",
    price: "",
    desc: "",
    parking: hasParking(row),
  };
}

export function normalizeGastronomia(row) {
  return {
    id: `g-${row.local_id || row.id}`,
    source: "gastronomia",
    localId: row.local_id || row.id,
    title: row.nombre,
    category: row.categoria || "Picanteria",
    address: row.direccion || "",
    district: row.distrito || "Arequipa",
    phone: "",
    website: "",
    rating: null,
    reviewsCount: null,
    latitude: row.lat,
    longitude: row.lon,
    horario: row.horario || "",
    price: row.precio_ref || "",
    desc: row.especialidad || "",
    parking: false,
  };
}
