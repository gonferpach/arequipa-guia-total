import GuiaNav from "../../../../components/GuiaNav";
import GuiaChat from "../../../../components/GuiaChat";
import LugarClient from "../../../../components/LugarClient";

export const metadata = { title: "Venue listing · Complete Arequipa Guide" };

export default function LugarEnPage({ params }) {
  return (
    <>
      <GuiaNav lang="en" switchHref={`/lugar/${params.id}`} />
      <LugarClient id={params.id} lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}
