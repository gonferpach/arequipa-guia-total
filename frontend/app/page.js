import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center">
      <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
        2braind Landing Factory 🧠
      </h1>
      <p className="text-xl text-gray-300 max-w-2xl">
        Sube fotos y datos de tu negocio, la IA elige la plantilla y tu landing
        queda lista en 5-10 minutos.
      </p>
      <div className="flex gap-4">
        <Link
          href="/admin"
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 font-semibold text-gray-950 transition"
        >
          Crear mi landing →
        </Link>
        <a
          href="/p/demo-clinica"
          className="px-6 py-3 rounded-xl border border-gray-700 hover:border-cyan-400 font-semibold transition"
        >
          Ver demo
        </a>
      </div>
    </main>
  );
}