import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import TurismoClient from "./TurismoClient";

export const metadata = {
  title: "Sitios Turísticos de Arequipa — 25 lugares · Arequipa Guía Total",
  description:
    "Centro Histórico UNESCO, Santa Catalina, miradores del Misti, molinos coloniales y termales. Fichas bilingües con calificación de usuarios en 5 criterios.",
};

export default function TurismoPage() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/turismo" />
      <TurismoClient lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}