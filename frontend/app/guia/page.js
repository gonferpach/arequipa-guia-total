import GuiaNav from "../../components/GuiaNav";
import GuiaChat from "../../components/GuiaChat";
import GuiaHome from "../../components/GuiaHome";

export const metadata = {
  title: "Arequipa Guía Total — gastronomía, sitios turísticos y eventos",
  description:
    "La guía completa de Arequipa: 48 locales tradicionales, 25 sitios turísticos (Centro Histórico UNESCO) y agenda de eventos — bilingüe ES/EN, con calificaciones de usuarios y bot con IA.",
};

export default function GuiaPage() {
  return (
    <>
      <GuiaNav lang="es" switchHref="/en/guia" />
      <GuiaHome lang="es" />
      <GuiaChat lang="es" />
    </>
  );
}