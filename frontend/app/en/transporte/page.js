import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import TransporteClient from "../../transporte/TransporteClient";

export const metadata = {
  title: "Arequipa Transport & Mobility — bus, taxi, gas stations · Arequipa Guide",
  description:
    "Bus stops, terminals, taxis, gas stations and parking in Arequipa. OpenStreetMap data updated 2026.",
};

export default function TransporteEnPage() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/transporte" />
      <TransporteClient lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}