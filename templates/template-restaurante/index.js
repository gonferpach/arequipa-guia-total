// Plantilla RESTAURANTE - colores cálidos, apetitoso, estilo picantería arequipeña
import {
  LandingNav,
  HeroSection,
  VisionSection,
  MisionSection,
  HistoriaSection,
  QuienesSomosSection,
  GaleriaSection,
  ContactoSection,
  RedesSection,
  FooterSection,
} from "../shared/sections.js";

const theme = {
  primary: "bg-amber-700",
  primaryText: "text-amber-700",
  bg: "bg-white",
  bgAlt: "bg-orange-50",
  text: "text-gray-900",
  textSoft: "text-gray-600",
};

export default function TemplateRestaurante({ data }) {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav data={data} theme={theme} />
      <HeroSection data={data} theme={theme} />
      <HistoriaSection data={data} theme={theme} />
      <MisionSection data={data} theme={theme} />
      <VisionSection data={data} theme={theme} />
      <GaleriaSection data={data} theme={theme} />
      <QuienesSomosSection data={data} theme={theme} />
      <ContactoSection data={data} theme={theme} />
      <RedesSection data={data} />
      <FooterSection data={data} />
    </div>
  );
}