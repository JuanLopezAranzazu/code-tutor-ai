import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { githubDark } from "@uiw/codemirror-theme-github";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { go } from "@codemirror/lang-go";
import { rust } from "@codemirror/lang-rust";
import { java } from "@codemirror/lang-java";
import { Check, Copy, RotateCcw } from "lucide-react";
import type { Extension } from "@codemirror/state";

const LANGUAGE_FACTORIES: Record<string, () => Extension> = {
  python: () => python(),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  go: () => go(),
  rust: () => rust(),
  java: () => java(),
};

function resolveLanguageKey(hint: string): string {
  const normalized = hint.toLowerCase();
  const match = Object.keys(LANGUAGE_FACTORIES).find((key) =>
    normalized.includes(key),
  );
  return match ?? "javascript";
}

export default function CodeEditor({
  value,
  onChange,
  language,
  onReset,
  height = "clamp(220px, 45vh, 380px)",
}: {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onReset?: () => void;
  height?: string;
}) {
  const [copied, setCopied] = useState(false);
  const languageKey = resolveLanguageKey(language);

  const extensions = useMemo(
    () => [LANGUAGE_FACTORIES[languageKey]()],
    [languageKey],
  );

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/80 px-3 py-2 sm:px-4">
        <span className="font-mono text-xs text-slate-500">{languageKey}</span>

        <div className="flex items-center gap-1">
          {onReset && (
            <button
              onClick={onReset}
              title="Restablecer al código inicial"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="hidden sm:inline">Copiado</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <CodeMirror
        value={value}
        onChange={onChange}
        theme={githubDark}
        extensions={extensions}
        height={height}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          tabSize: 4,
        }}
        className="text-[13px] sm:text-sm [&_.cm-scroller]:font-mono"
      />
    </div>
  );
}
