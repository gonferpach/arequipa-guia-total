import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import CategoriaClient from "../../components/CategoriaClient";

export const metadata = { title: "Restaurantes en Arequipa — picanterias y todo tipo · Guia Total", description: "Restaurantes tradicionales y de todo tipo en Arequipa, con mapa, precio de referencia y distrito." };

export default function Page() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/restaurantes" />
      <CategoriaClient categoria="restaurantes" lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}
