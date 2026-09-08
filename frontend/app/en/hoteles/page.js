import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import CategoriaClient from "../../../components/CategoriaClient";

export const metadata = { title: "Hotels and Hostels in Arequipa — where to stay · Complete Guide", description: "Hotels and hostels in Arequipa by area, with parking badge and map." };

export default function Page() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/hoteles" />
      <CategoriaClient categoria="hoteles" lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}
