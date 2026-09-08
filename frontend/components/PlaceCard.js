import { shortLine } from "../lib/categorias";

// Ficha editorial estilo Infatuation: nombre, linea descriptiva, precio,
// barrio/distrito, horario, rating. Sin emojis.
export default function PlaceCard({ place, lang = "es", detailHref = null }) {
  const es = lang === "es";
  const linea = place.desc || shortLine(place, lang);
  const href =
    typeof detailHref === "function"
      ? detailHref(place)
      : detailHref
        ? `${detailHref}/${place.id}`
        : null;

  const inner = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {place.category && (
          <span className="text-xs px-2 py-1 rounded-full border border-stone-300 bg-stone-100 text-stone-700">
            {place.category}
          </span>
        )}
        {place.district && (
          <span className="text-xs px-2 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800">
            {place.district}
          </span>
        )}
        {place.parking && (
          <span className="text-xs px-2 py-1 rounded-full border border-green-500 bg-green-50 text-green-800 font-semibold">
            {es ? "Con cochera" : "With parking"}
          </span>
        )}
      </div>
      <h3 className="font-bold text-lg mt-3 text-stone-900 leading-snug">{place.title}</h3>
      <p className="text-sm text-gray-700 mt-1">{linea}</p>
      <dl className="text-xs text-gray-500 mt-3 space-y-1">
        {place.price && (
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-600 w-16 shrink-0">{es ? "Precio" : "Price"}</dt>
            <dd>{place.price}</dd>
          </div>
        )}
        {place.address && (
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-600 w-16 shrink-0">{es ? "Dirección" : "Address"}</dt>
            <dd>{place.address}</dd>
          </div>
        )}
        {place.horario && (
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-600 w-16 shrink-0">{es ? "Horario" : "Hours"}</dt>
            <dd>{place.horario}</dd>
          </div>
        )}
        {place.phone && (
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-600 w-16 shrink-0">{es ? "Teléfono" : "Phone"}</dt>
            <dd>{place.phone}</dd>
          </div>
        )}
        {(place.rating != null || place.reviewsCount != null) && (
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-600 w-16 shrink-0">Rating</dt>
            <dd>
              {place.rating != null ? ` ${place.rating}/5` : "—"}
              {place.reviewsCount != null ? ` · ${place.reviewsCount} ${es ? "reseñas" : "reviews"}` : ""}
            </dd>
          </div>
        )}
      </dl>
    </>
  );

  const foot = (
    <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 text-xs flex justify-between items-center mt-4">
      <span className="font-semibold text-amber-700">{href ? (es ? "Ver ficha" : "View listing") : place.district}</span>
      {place.latitude && place.longitude && (
        <a
          href={`https://maps.google.com/?q=${place.latitude},${place.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-500 underline hover:text-stone-700"
          onClick={(e) => e.stopPropagation()}
        >
          {es ? "Cómo llegar" : "Directions"}
        </a>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
      >
        <div className="p-5 pb-1 flex-1">{inner}</div>
        {foot}
      </a>
    );
  }
  return (
    <article className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
      <div className="p-5 pb-1 flex-1">{inner}</div>
      {foot}
    </article>
  );
}
