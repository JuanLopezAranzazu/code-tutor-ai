import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Bot, User, Check, Copy } from "lucide-react";
import type { ChatMessage } from "../types";

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match?.[1] ?? "text";
  const code = String(children).replace(/\n$/, "");

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-700/80 bg-[#0d1117] shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-1.5 sm:px-4">
        <span className="font-mono text-[11px] tracking-wide text-slate-500">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="hidden sm:inline">Copiado</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="hidden sm:inline">Copiar</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          wrapLongLines
          customStyle={{
            margin: 0,
            padding: "0.875rem",
            background: "transparent",
            fontSize: "0.8125rem",
            lineHeight: 1.6,
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-5 text-lg font-bold text-white first:mt-0">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-bold text-white first:mt-0">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold text-white first:mt-0">
      {children}
    </h3>
  ),

  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,

  ul: ({ children }) => (
    <ul className="mb-3 ml-5 list-disc space-y-1 last:mb-0">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1 last:mb-0">{children}</ol>
  ),

  li: ({ children }) => <li className="pl-1">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-slate-500 pl-4 italic text-slate-300">
      {children}
    </blockquote>
  ),

  pre: ({ children }) => <>{children}</>,

  code: ({ className, children, ...props }) => {
    const isInline = !className;

    if (isInline) {
      return (
        <code
          className="rounded-md bg-slate-700/70 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-300"
          {...props}
        >
          {children}
        </code>
      );
    }

    return <CodeBlock className={className}>{children}</CodeBlock>;
  },

  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-sky-400 underline underline-offset-2 hover:text-sky-300"
    >
      {children}
    </a>
  ),

  hr: () => <hr className="my-4 border-slate-700" />,

  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-slate-800 text-slate-100">{children}</thead>
  ),

  th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,

  td: ({ children }) => (
    <td className="border-t border-slate-700 px-3 py-2">{children}</td>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
};

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-2 sm:gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7 ${
          isUser ? "bg-brand-600 text-white" : "bg-slate-700 text-slate-300"
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div
        className={
          isUser
            ? "max-w-[88%] rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2.5 text-sm leading-relaxed text-white sm:max-w-[80%] sm:px-4"
            : "max-w-[92%] rounded-2xl rounded-tl-sm bg-slate-800 px-3.5 py-2.5 text-sm leading-relaxed text-slate-100 sm:max-w-[85%] sm:px-4 sm:py-3"
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
