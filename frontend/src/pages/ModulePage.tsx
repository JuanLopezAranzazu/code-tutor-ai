import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import type {
  Module,
  ChatMessage,
  Exercise,
  SubmitResult,
  ModuleProgress,
  ExerciseHistoryItem,
} from "../types";
import {
  fetchModules,
  sendTutorMessage,
  fetchChatHistory,
  resetChatHistory,
  generateExercise,
  submitExercise,
  fetchProgress,
  fetchExercise,
  fetchExerciseHistory,
} from "../api/client";
import ChatBubble from "../components/ChatBubble";
import ProgressBar from "../components/ProgressBar";
import CodeEditor from "../components/CodeEditor";
import {
  Send,
  Sparkles,
  RefreshCcw,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const tabTrigger =
  "px-3 py-2 text-sm font-medium text-slate-400 border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:text-slate-100 transition whitespace-nowrap sm:px-4";

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<Module | null>(null);

  useEffect(() => {
    fetchModules().then((mods) =>
      setModule(mods.find((m) => m.id === moduleId) ?? null),
    );
  }, [moduleId]);

  if (!module || !moduleId) {
    return <p className="text-slate-400">Cargando…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
            {module.name}
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            {module.description}
          </p>
        </div>
      </div>

      <Tabs.Root defaultValue="tutor">
        <Tabs.List className="flex gap-1 overflow-x-auto border-b border-slate-800 sm:gap-2">
          <Tabs.Trigger className={tabTrigger} value="tutor">
            Tutor
          </Tabs.Trigger>
          <Tabs.Trigger className={tabTrigger} value="ejercicios">
            Ejercicios
          </Tabs.Trigger>
          <Tabs.Trigger className={tabTrigger} value="progreso">
            Progreso
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="tutor" className="pt-5 sm:pt-6">
          <TutorTab module={module} />
        </Tabs.Content>
        <Tabs.Content value="ejercicios" className="pt-5 sm:pt-6">
          <ExercisesTab module={module} />
        </Tabs.Content>
        <Tabs.Content value="progreso" className="pt-5 sm:pt-6">
          <ProgressTab moduleId={moduleId} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

const welcomeMessage = (moduleName: string): ChatMessage => ({
  role: "assistant",
  content: `¡Hola! Soy tu tutor de ${moduleName}. Preguntame lo que quieras: un concepto, un error que te tira el código, o pedime que te explique un tema paso a paso.`,
});

function TutorTab({ module }: { module: Module }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setLoadingHistory(true);
    fetchChatHistory(module.id)
      .then((history) => {
        setMessages(
          history.length > 0
            ? history.map((h) => ({ role: h.role, content: h.content }))
            : [welcomeMessage(module.name)],
        );
      })
      .catch(() => setMessages([welcomeMessage(module.name)]))
      .finally(() => setLoadingHistory(false));
  }, [module.id]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendTutorMessage(module.id, userMsg.content);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "⚠️ Hubo un error contactando al tutor. Intentá de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    await resetChatHistory(module.id);
    setMessages([welcomeMessage(module.name)]);
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          <span className="hidden sm:inline">
            La conversación se guarda y la vas a ver la próxima vez que entres a
            este módulo.
          </span>
          <span className="sm:hidden">Se guarda tu conversación.</span>
        </p>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 sm:px-3"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Nueva conversación</span>
        </button>
      </div>

      <div className="h-[65vh] min-h-[320px] max-h-[480px] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:h-[420px] sm:p-4">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={15} className="animate-spin" />
              Cargando conversación...
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <ChatBubble key={i} message={m} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-xs text-slate-400">
                  <span>El tutor está escribiendo</span>

                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={`Preguntale algo de ${module.name}...`}
          className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-600 sm:px-4"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:px-4"
        >
          <Send size={16} />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
  );
}

function ExercisesTab({ module }: { module: Module }) {
  const [topic, setTopic] = useState<string>(module.topics[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<"facil" | "media" | "dificil">(
    "facil",
  );
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [history, setHistory] = useState<ExerciseHistoryItem[]>([]);

  function loadHistory() {
    fetchExerciseHistory(module.id)
      .then(setHistory)
      .catch(() => {});
  }

  useEffect(() => {
    loadHistory();
  }, [module.id]);

  async function handleGenerate() {
    setLoadingGen(true);
    setResult(null);
    try {
      const ex = await generateExercise(module.id, topic || null, difficulty);
      setExercise(ex);
      setCode(ex.starter_code);
      loadHistory();
    } finally {
      setLoadingGen(false);
    }
  }

  async function handleOpenPrevious(item: ExerciseHistoryItem) {
    setResult(null);
    const ex = await fetchExercise(item.id);
    setExercise(ex);
    setCode(ex.starter_code);
  }

  async function handleSubmit() {
    if (!exercise) return;
    setLoadingSubmit(true);
    try {
      const res = await submitExercise(exercise.id, code);
      setResult(res);
      loadHistory();
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-1 flex-col gap-1 sm:flex-none">
          <label className="text-xs text-slate-400">Tema</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 sm:w-auto"
          >
            {module.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1 sm:flex-none">
          <label className="text-xs text-slate-400">Dificultad</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 sm:w-auto"
          >
            <option value="facil">Fácil</option>
            <option value="media">Media</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loadingGen}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
        >
          <Sparkles size={16} />
          {exercise ? "Generar otro" : "Generar ejercicio"}
        </button>
      </div>

      {exercise && (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {exercise.title}
            </h3>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-300">
              {exercise.statement}
            </p>
          </div>

          {exercise.hints.length > 0 && (
            <details className="text-sm text-slate-400">
              <summary className="cursor-pointer text-brand-500">
                Ver pistas
              </summary>
              <ul className="mt-2 list-disc pl-5">
                {exercise.hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </details>
          )}

          <CodeEditor
            value={code}
            onChange={setCode}
            language={module.id}
            onReset={() => setCode(exercise.starter_code)}
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleSubmit}
              disabled={loadingSubmit}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loadingSubmit ? "Evaluando…" : "Enviar solución"}
            </button>
            <button
              onClick={handleGenerate}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              <RefreshCcw size={16} /> Otro ejercicio
            </button>
          </div>

          {result && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                result.correct
                  ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
                  : "border-amber-800 bg-amber-950/40 text-amber-300"
              }`}
            >
              <p className="font-semibold">
                {result.correct ? "✅ Correcto" : "❌ Todavía no"} — Puntaje:{" "}
                {result.score}/100
              </p>
              <p className="mt-1 whitespace-pre-line">{result.feedback}</p>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-300">
            Ejercicios anteriores
          </h4>
          <ul className="max-h-72 divide-y divide-slate-800 overflow-y-auto">
            {history.map((item) => {
              const isActive = exercise && item.id === (exercise as any).id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleOpenPrevious(item)}
                    className={`flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg px-2 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-brand-600/10 text-brand-400"
                        : "hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-slate-200">
                      {item.title}
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      {item.last_correct !== null && (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.last_correct
                              ? "bg-emerald-950/60 text-emerald-400"
                              : "bg-amber-950/60 text-amber-400"
                          }`}
                        >
                          {item.last_correct ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {item.last_score}/100
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          item.difficulty === "facil"
                            ? "bg-emerald-950/40 text-emerald-400"
                            : item.difficulty === "media"
                              ? "bg-amber-950/40 text-amber-400"
                              : "bg-rose-950/40 text-rose-400"
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProgressTab({ moduleId }: { moduleId: string }) {
  const [progress, setProgress] = useState<ModuleProgress | null>(null);

  useEffect(() => {
    fetchProgress().then((p) =>
      setProgress(p.modules.find((m) => m.module_id === moduleId) ?? null),
    );
  }, [moduleId]);

  if (!progress) return <p className="text-slate-400">Cargando progreso…</p>;

  const accuracy =
    progress.exercises_attempted > 0
      ? Math.round(
          (progress.exercises_correct / progress.exercises_attempted) * 100,
        )
      : 0;

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
      <Stat
        label="Ejercicios intentados"
        value={progress.exercises_attempted}
      />
      <Stat label="Ejercicios correctos" value={progress.exercises_correct} />
      <Stat label="Puntaje promedio" value={`${progress.average_score}/100`} />
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Precisión</span>
          <span>{accuracy}%</span>
        </div>
        <ProgressBar value={accuracy} />
      </div>
      {progress.last_activity && (
        <p className="text-xs text-slate-500">
          Última actividad: {new Date(progress.last_activity).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-slate-800 pb-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}
