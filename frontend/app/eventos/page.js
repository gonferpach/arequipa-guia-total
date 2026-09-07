import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import EventosClient from "./EventosClient";

export const metadata = {
  title: "Agenda y Eventos de Arequipa — ferias, tours y fiestas · Arequipa Guía Total",
  description:
    "Feria artesanal de Yanahuara, tour de picanterías, mercado San Camilo, Fiestas de Agosto y Festival del Adobo. Agenda bilingüe de Arequipa.",
};

export default function EventosPage() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/eventos" />
      <EventosClient lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}