import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import GuiaHome from "../../../components/GuiaHome";

export const metadata = {
  title: "The Complete Arequipa Guide — food, attractions and events",
  description:
    "The full Arequipa guide: 48 traditional venues, 25 top attractions (UNESCO Historic Centre) and an events agenda — bilingual ES/EN, with user ratings and an AI bot.",
};

export default function GuiaEnPage() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/guia" />
      <GuiaHome lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}