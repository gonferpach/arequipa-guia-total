import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import CategoriaClient from "../../../components/CategoriaClient";

export const metadata = { title: "Coffee shops in Arequipa — specialty coffee · Complete Guide", description: "Coffee shops and chocolate houses in Arequipa, with map and district listings." };

export default function Page() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/cafeterias" />
      <CategoriaClient categoria="cafeterias" lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}
