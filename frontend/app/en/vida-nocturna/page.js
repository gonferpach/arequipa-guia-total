import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import CategoriaClient from "../../../components/CategoriaClient";

export const metadata = { title: "Nightlife in Arequipa — clubs, bars and pubs · Complete Guide", description: "Clubs, bars, pubs and cocktail spots in Arequipa, with map and venue listings." };

export default function Page() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/vida-nocturna" />
      <CategoriaClient categoria="vida-nocturna" lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}
