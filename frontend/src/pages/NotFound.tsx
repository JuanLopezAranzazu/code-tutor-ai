import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-brand-400 sm:h-20 sm:w-20">
        <Compass size={32} className="sm:hidden" />
        <Compass size={40} className="hidden sm:block" />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
          Error 404
        </p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Esta página no existe
        </h1>
        <p className="mx-auto max-w-sm text-sm text-slate-400 sm:text-base">
          Puede que el módulo o el enlace ya no estén disponibles, o que hayas
          escrito mal la dirección.
        </p>
      </div>

      <Link
        to="/"
        className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500"
      >
        <Home size={16} />
        Volver al inicio
      </Link>
    </div>
  );
}
