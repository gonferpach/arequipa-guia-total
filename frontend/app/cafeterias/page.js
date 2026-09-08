import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import CategoriaClient from "../../components/CategoriaClient";

export const metadata = { title: "Cafeterias en Arequipa — cafe de especialidad · Guia Total", description: "Cafeterias y chocolaterias en Arequipa, con mapa y fichas por distrito." };

export default function Page() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/cafeterias" />
      <CategoriaClient categoria="cafeterias" lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}
