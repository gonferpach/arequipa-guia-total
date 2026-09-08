import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import CategoriaClient from "../../components/CategoriaClient";

export const metadata = { title: "Hoteles y Hostales en Arequipa — donde dormir · Guia Total", description: "Hoteles y hostales en Arequipa por zona, con sello de cochera y mapa." };

export default function Page() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/hoteles" />
      <CategoriaClient categoria="hoteles" lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}
