import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import LugarClient from "../../../components/LugarClient";

export const metadata = { title: "Ficha de local · Arequipa Guia Total" };

export default function LugarPage({ params }) {
  return (
    <>
      <GuiaNav lang="es" switchHref={`/en/lugar/${params.id}`} />
      <LugarClient id={params.id} lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}
