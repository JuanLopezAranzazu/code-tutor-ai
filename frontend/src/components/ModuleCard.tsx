import { Link } from "react-router-dom";
import type { Module, ModuleProgress } from "../types";
import ProgressBar from "./ProgressBar";

export default function ModuleCard({
  module,
  progress,
}: {
  module: Module;
  progress?: ModuleProgress;
}) {
  const accuracy =
    progress && progress.exercises_attempted > 0
      ? Math.round(
          (progress.exercises_correct / progress.exercises_attempted) * 100,
        )
      : 0;

  return (
    <Link
      to={`/module/${module.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-brand-600 hover:bg-slate-900"
    >
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 group-hover:text-brand-500">
            {module.name}
          </h3>
          <p className="text-sm text-slate-400">{module.description}</p>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{progress?.exercises_attempted ?? 0} ejercicios resueltos</span>
          <span>{accuracy}% acierto</span>
        </div>
        <ProgressBar value={accuracy} />
      </div>
    </Link>
  );
}
