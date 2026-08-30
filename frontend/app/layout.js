import "./globals.css";

export const metadata = {
  title: "2braind Landing Factory",
  description: "Fábrica de landings con IA - listo en 5-10 minutos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}