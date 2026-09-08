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

// Parsea OSM relation full.json -> array de [lat, lon]
function osmToCoords(json) {
  if (!json || !Array.isArray(json.elements)) return [];
  const nodes = new Map();
  for (const el of json.elements) {
    if (el.type === "node" && typeof el.lat === "number") {
      nodes.set(el.id, [el.lat, el.lon]);
    }
  }
  const line = [];
  for (const el of json.elements) {
    if (el.type === "way" && Array.isArray(el.nodes)) {
      for (const nid of el.nodes) {
        const c = nodes.get(nid);
        if (c) {
          const last = line[line.length - 1];
          if (!last || last[0] !== c[0] || last[1] !== c[1]) line.push(c);
        }
      }
    }
  }
  return line;
}

export default function RutaMap({ ruta, lang = "es" }) {
  const [coords, setCoords] = useState([]);
  const [estado, setEstado] = useState("idle"); // idle | cargando | ok | fallback | error

  useEffect(() => {
    if (!ruta) {
      setCoords([]);
      setEstado("idle");
      return;
    }
    const osmId = ruta.osm_ids && ruta.osm_ids[0];
    if (!osmId) {
      setCoords([]);
      setEstado("fallback");
      return;
    }
    let cancel = false;
    setEstado("cargando");
    setCoords([]);
    fetch(`https://www.openstreetmap.org/api/0.6/relation/${osmId}/full.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`OSM ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (cancel) return;
        const line = osmToCoords(j);
        if (line.length > 1) {
          setCoords(line);
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
        {coords.length > 1 && (
          <Polyline positions={coords} pathOptions={{ color, weight: 5, opacity: 0.85 }} />
        )}
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
