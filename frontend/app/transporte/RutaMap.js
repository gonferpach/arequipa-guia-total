"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CENTRO = [-16.409, -71.537];

// Fix iconos por defecto de Leaflet en Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    } else if (coords && coords.length === 1) {
      map.setView(coords[0], 13);
    }
  }, [coords, map]);
  return null;
}

// Parsea OSM relation full.json -> segmentos ordenados [[lat,lon],...]
// Sigue el orden de members de la relación y orienta cada way;
// si un tramo no conecta con el anterior, corta y empieza otro segmento
// (así jamás salen líneas cruzando el mapa).
function osmToSegments(json) {
  if (!json || !Array.isArray(json.elements)) return [];
  const nodes = new Map();
  const ways = new Map();
  let members = null;
  for (const el of json.elements) {
    if (el.type === "node" && typeof el.lat === "number") {
      nodes.set(el.id, [el.lat, el.lon]);
    } else if (el.type === "way" && Array.isArray(el.nodes)) {
      ways.set(el.id, el.nodes);
    } else if (el.type === "relation" && Array.isArray(el.members) && !members) {
      members = el.members;
    }
  }
  const wayOrder = members
    ? members.filter((m) => m.type === "way").map((m) => m.ref)
    : [...ways.keys()];
  const segments = [];
  let current = [];
  const key = (c) => c[0].toFixed(6) + "," + c[1].toFixed(6);
  for (const wid of wayOrder) {
    const nodeIds = ways.get(wid);
    if (!nodeIds || nodeIds.length < 2) continue;
    let pts = nodeIds.map((id) => nodes.get(id)).filter(Boolean);
    if (pts.length < 2) continue;
    if (current.length) {
      const end = key(current[current.length - 1]);
      if (key(pts[0]) === end) {
        pts = pts.slice(1);
      } else if (key(pts[pts.length - 1]) === end) {
        pts = pts.slice(0, -1).reverse();
      } else {
        if (current.length > 1) segments.push(current);
        current = [];
      }
    }
    for (const p of pts) {
      const last = current[current.length - 1];
      if (!last || key(last) !== key(p)) current.push(p);
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

export default function RutaMap({ ruta, lang = "es" }) {
  const [segments, setSegments] = useState([]);
  const [estado, setEstado] = useState("idle"); // idle | cargando | ok | fallback | error

  const coords = segments.flat();

  useEffect(() => {
    if (!ruta) {
      setSegments([]);
      setEstado("idle");
      return;
    }
    const osmId = ruta.osm_ids && ruta.osm_ids[0];
    if (!osmId) {
      setSegments([]);
      setEstado("fallback");
      return;
    }
    let cancel = false;
    setEstado("cargando");
    setSegments([]);
    fetch(`https://www.openstreetmap.org/api/0.6/relation/${osmId}/full.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`OSM ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (cancel) return;
        const segs = osmToSegments(j);
        if (segs.flat().length > 1) {
          setSegments(segs);
          setEstado("ok");
        } else {
          setEstado("fallback");
        }
      })
      .catch(() => {
        if (!cancel) setEstado("fallback");
      });
    return () => {
      cancel = true;
    };
  }, [ruta]);

  const color = ruta?.color || "#2563eb";
  const inicio = coords.length ? coords[0] : null;
  const fin = coords.length ? coords[coords.length - 1] : null;

  const msg =
    estado === "cargando"
      ? lang === "es"
        ? "Trazando recorrido desde OpenStreetMap…"
        : "Tracing route from OpenStreetMap…"
      : estado === "fallback"
        ? lang === "es"
          ? `Recorrido detallado no disponible por API — ${ruta?.origen || ""} → ${ruta?.destino || ""}.`
          : `Detailed path unavailable via API — ${ruta?.origen || ""} → ${ruta?.destino || ""}.`
        : estado === "idle"
          ? lang === "es"
            ? "Selecciona una ruta y pulsa «Ver recorrido»."
            : "Pick a route and press “View path”."
          : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
      <MapContainer
        center={CENTRO}
        zoom={12}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "420px", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds coords={coords} />
        {segments.length > 0 &&
          segments.map((seg, i) => (
            <Polyline key={i} positions={seg} pathOptions={{ color, weight: 5, opacity: 0.85 }} />
          ))}
        {inicio && (
          <Marker position={inicio}>
            <Popup>{lang === "es" ? "Origen" : "Origin"}: {ruta.origen}</Popup>
          </Marker>
        )}
        {fin && (
          <Marker position={fin}>
            <Popup>{lang === "es" ? "Destino" : "Destination"}: {ruta.destino}</Popup>
          </Marker>
        )}
      </MapContainer>
      {msg && (
        <p className="text-xs text-center text-gray-500 bg-stone-50 border-t border-stone-200 px-4 py-2">
          {msg}
        </p>
      )}
    </div>
  );
}
