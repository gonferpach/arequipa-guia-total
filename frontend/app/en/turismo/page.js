import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import TurismoClient from "../../turismo/TurismoClient";

export const metadata = {
  title: "Arequipa Top Attractions — 25 places · Arequipa Guide",
  description:
    "UNESCO Historic Centre, Santa Catalina, Misti viewpoints, colonial mills and hot springs. Bilingual listings with user ratings on 5 criteria.",
};

export default function TurismoEnPage() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/turismo" />
      <TurismoClient lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}