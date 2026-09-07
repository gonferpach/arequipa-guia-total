import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import GastronomiaClient from "./GastronomiaClient";

export const metadata = { title: "Gastronomía Campiña Arequipa — 48 locales tradicionales" };

export default function GastronomiaPage() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/guia" />
      <GastronomiaClient />
      <GuiaChat lang="es" />
    </>
  );
}
