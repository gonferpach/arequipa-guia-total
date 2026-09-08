import GuiaNav from "../../../components/GuiaNav";
import GuiaChat from "../../../components/GuiaChat";
import ItinerarioClient from "../../../components/ItinerarioClient";

export const metadata = {
  title: "Arequipa itineraries — 1 day, 2 days and weekend · Guide",
  description: "Day-by-day routes: attractions, restaurants, coffee and nightlife with map.",
};

export default function Page() {
  return (
    <>
      <GuiaNav lang="en" switchHref="/itinerarios" />
      <ItinerarioClient lang="en" />
      <GuiaChat lang="en" />
    </>
  );
}
