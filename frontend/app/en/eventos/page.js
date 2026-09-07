import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import EventosClient from "../../eventos/EventosClient";

export const metadata = {
  title: "Arequipa What's On & Events — fairs, tours and fiestas · Arequipa Guide",
  description:
    "Yanahuara artisan fair, picantería tours, San Camilo market, August Fiestas and the Adobo Festival. Arequipa's bilingual events agenda.",
};

export default function EventosEnPage() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/eventos" />
      <EventosClient lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}