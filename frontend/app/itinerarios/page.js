import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import ItinerarioClient from "../../components/ItinerarioClient";

export const metadata = {
  title: "Itinerarios en Arequipa — 1 dia, 2 dias y fin de semana · Guia Total",
  description: "Rutas dia por dia: turismo, restaurante, cafe y noche con mapa.",
};

export default function Page() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/itinerarios" />
      <ItinerarioClient lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}
