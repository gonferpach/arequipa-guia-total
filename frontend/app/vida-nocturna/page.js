import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import CategoriaClient from "../../components/CategoriaClient";

export const metadata = { title: "Centros Nocturnos en Arequipa — discotecas, bares y pubs · Guia Total", description: "Discotecas, bares, pubs y cocteleria en Arequipa, con mapa y fichas por local." };

export default function Page() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/vida-nocturna" />
      <CategoriaClient categoria="vida-nocturna" lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}
