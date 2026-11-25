import React from 'react';

interface MarkdownRendererProps {
  markdown: string;
}

function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={key++} className="font-bold text-slate-950">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={key++}
          className="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 text-[0.85em] font-semibold text-blue-800"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={key++} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>,
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown }) => {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={key++}
          className="font-editorial mt-1 mb-2.5 text-lg font-bold tracking-tight text-slate-950"
        >
          {renderInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={key++}
          className="mt-4 mb-2 text-xs font-extrabold uppercase tracking-widest text-blue-800"
        >
          {renderInline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }

    // Formula / Grammar Callout Blockquote (> ...)
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <div
          key={key++}
          className="my-3 rounded-2xl border-l-4 border-blue-700 bg-blue-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-900"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className={qIdx > 0 ? 'mt-1' : ''}>
              {renderInline(ql)}
            </p>
          ))}
        </div>,
      );
      continue;
    }

    if (
      line.startsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith('|') &&
      lines[i + 1].includes('---')
    ) {
      const headers = parseTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }

      elements.push(
        <div
          key={key++}
          className="sv-md-table-wrap my-3 w-full max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs"
        >
          <table className="sv-md-table w-full table-fixed border-collapse text-left text-xs sm:text-sm">
            <thead className="sv-md-thead">
              <tr className="border-b border-stone-200 bg-stone-100/80">
                {headers.map((header, hIdx) => (
                  <th
                    key={hIdx}
                    className="break-words px-2.5 py-2 align-top font-extrabold leading-tight text-slate-800"
                  >
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={`sv-md-row ${rIdx % 2 === 1 ? 'bg-stone-50/60' : 'bg-white'}`}
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="break-words px-2.5 py-2 align-top leading-snug text-slate-800"
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-2 space-y-1.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-slate-800">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={key++} className="my-2 space-y-1.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-800">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                {idx + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    elements.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-slate-700">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
};
