"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-slate-800">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        hr: () => <hr className="my-3 border-slate-200" />,
        h1: ({ children }) => (
          <h1 className="mb-2 text-base font-bold text-slate-800">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 text-sm font-bold text-slate-800">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 text-sm font-semibold text-slate-800">
            {children}
          </h3>
        ),
        code: ({ children }) => (
          <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">
            {children}
          </code>
        ),
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-50">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="whitespace-nowrap px-3 py-2 text-slate-600">
            {children}
          </td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
