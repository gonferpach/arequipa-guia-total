"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fija los iconos por defecto via CDN (el bundler de Next no resuelve los PNG de leaflet)
const ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const ICON_RETINA = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const ICON_SHADOW = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const AREQUIPA = [-16.409, -71.537];

export default function CategoryMap({ places = [], detailHref = null, height = 380 }) {
  useEffect(() => {
    try {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconUrl: ICON_URL, iconRetinaUrl: ICON_RETINA, shadowUrl: ICON_SHADOW });
    } catch {}
  }, []);

  const pins = (places || []).filter(
    (p) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
  );
  const center =
    pins.length === 1
      ? [Number(pins[0].latitude), Number(pins[0].longitude)]
      : AREQUIPA;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm" data-leaflet-map="true">
      <MapContainer
        center={center}
        zoom={pins.length === 1 ? 16 : 13}
        scrollWheelZoom={false}
        style={{ width: "100%", height }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.slice(0, 300).map((p) => (
          <Marker key={`${p.source}-${p.id}`} position={[Number(p.latitude), Number(p.longitude)]}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>{p.title}</strong>
                {p.district && <div style={{ fontSize: 12, color: "#57534e" }}>{p.district}</div>}
                {detailHref ? (
                  <a href={typeof detailHref === "function" ? detailHref(p) : `${detailHref}/${p.id}`}>
                    Ver ficha
                  </a>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="text-xs text-stone-500 px-4 py-2 bg-stone-50">
        Mapa: OpenStreetMap · {pins.length} locales con coordenadas
      </p>
    </div>
  );
}
