import { useEffect, useState } from "react";
import type { Module, ProgressResponse } from "../types";
import { fetchModules, fetchProgress } from "../api/client";
import ModuleCard from "../components/ModuleCard";

export default function Dashboard() {
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchModules(), fetchProgress()])
      .then(([mods, prog]) => {
        setModules(mods);
        setProgress(prog);
      })
      .catch(() =>
        setError(
          "No se pudo conectar con el backend. ¿Está corriendo en :8000?",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-400">Cargando módulos…</p>;
  }

  if (error) {
    return <p className="rounded-lg bg-red-950 p-4 text-red-300">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Elegí un lenguaje</h1>
        <p className="mt-1 text-slate-400">
          Aprendé con un tutor de IA, practicá con ejercicios generados a medida
          y seguí tu progreso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            progress={progress?.modules.find((p) => p.module_id === m.id)}
          />
        ))}
      </div>
    </div>
  );
}
