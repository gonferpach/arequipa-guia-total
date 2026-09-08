import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import CategoriaClient from "../../../components/CategoriaClient";

export const metadata = { title: "Restaurants in Arequipa — traditional and more · Complete Guide", description: "Traditional and contemporary restaurants in Arequipa, with map, reference prices and district." };

export default function Page() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/restaurantes" />
      <CategoriaClient categoria="restaurantes" lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}
