import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import TransporteClient from "./TransporteClient";

export const metadata = {
  title: "Transporte y Movilidad de Arequipa — bus, taxi, gasolineras · Arequipa Guía Total",
  description:
    "Paradas de bus, terminales, taxis, gasolineras y estacionamientos de Arequipa. Datos de OpenStreetMap actualizados 2026.",
};

export default function TransportePage() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/transporte" />
      <TransporteClient lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}